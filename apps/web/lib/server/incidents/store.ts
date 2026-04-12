import { getAnalyticsWindowStart, type AnalyticsDateRange } from '@/lib/analytics/date-range'
import {
  emptyIncidentReview,
  incidentDtoSchema,
  incidentReviewSchema,
  type IncidentDto,
} from '@/lib/server/incidents/schema'
import type { StoredIncidentNotificationRecord } from '@/lib/server/notifications/store'
import { getDb } from '@/lib/server/db'

function cloneIncident(incident: IncidentDto): IncidentDto {
  return {
    ...incident,
    timeline: incident.timeline.map((event) => ({ ...event })),
    notes: incident.notes.map((note) => ({ ...note })),
    review: {
      ...incident.review,
      actionItems: incident.review.actionItems.map((item) => ({ ...item })),
    },
  }
}

type IncidentRow = {
  id: string
  source: string
  title: string
  description: string
  severity: IncidentDto['severity']
  status: IncidentDto['status']
  category: IncidentDto['category']
  assigned_runbook: string | null
  assigned_to: string | null
  alert_merge_count: number | null
  created_at: string
  updated_at: string
  resolved_at: string | null
  timeline_json: string
  notes_json: string
  review_json: string | null
  is_major: number | null
}

type IncidentEventRow = {
  id: string
  incident_id: string
  type: IncidentDto['timeline'][number]['type']
  actor: string | null
  description: string
  created_at: string
}

type IncidentNoteRow = {
  id: string
  incident_id: string
  author: string
  content: string
  created_at: string
}

export interface StoredIncidentEventRecord {
  id: string
  incidentId: string
  type: IncidentDto['timeline'][number]['type']
  actor?: string | null
  description: string
  createdAt: string
  fromStatus?: IncidentDto['status'] | null
  toStatus?: IncidentDto['status'] | null
  fromSeverity?: IncidentDto['severity'] | null
  toSeverity?: IncidentDto['severity'] | null
  fromAssignedTo?: string | null
  toAssignedTo?: string | null
  metadataJson?: string | null
}

export interface StoredIncidentNoteRecord {
  id: string
  incidentId: string
  author: string
  content: string
  createdAt: string
}

export class IncidentStateConflictError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'IncidentStateConflictError'
  }
}

function parseReviewJson(reviewJson: string | null): IncidentDto['review'] {
  if (!reviewJson?.trim()) {
    return { ...emptyIncidentReview }
  }
  try {
    const parsed = JSON.parse(reviewJson) as unknown
    const result = incidentReviewSchema.safeParse(parsed)
    return result.success ? result.data : { ...emptyIncidentReview }
  } catch {
    return { ...emptyIncidentReview }
  }
}

function parseIncidentRow(
  row: IncidentRow,
  events?: IncidentDto['timeline'],
  notes?: IncidentDto['notes'],
) {
  return incidentDtoSchema.parse({
    id: row.id,
    source: row.source,
    title: row.title,
    description: row.description,
    severity: row.severity,
    status: row.status,
    category: row.category,
    assignedRunbook: row.assigned_runbook,
    assignedTo: row.assigned_to,
    alertMergeCount: row.alert_merge_count ?? 0,
    isMajorIncident: (row.is_major ?? 0) === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    resolvedAt: row.resolved_at,
    timeline:
      events ?? (JSON.parse(row.timeline_json) as IncidentDto['timeline']),
    notes: notes ?? (JSON.parse(row.notes_json) as IncidentDto['notes']),
    review: parseReviewJson(row.review_json),
  })
}

function formatLifecycleTimestamp(dateValue: string) {
  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) {
    return dateValue
  }

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
  })
}

function buildTimelineEvent(row: IncidentEventRow): IncidentDto['timeline'][number] {
  return {
    id: row.id,
    timestamp: formatLifecycleTimestamp(row.created_at),
    type: row.type,
    description: row.description,
    user: row.actor ?? undefined,
  }
}

function buildIncidentNote(row: IncidentNoteRow): IncidentDto['notes'][number] {
  return {
    id: row.id,
    user: row.author,
    timestamp: formatLifecycleTimestamp(row.created_at),
    content: row.content,
  }
}

function getLifecycleMaps(incidentIds: string[]) {
  const eventsByIncidentId = new Map<string, IncidentDto['timeline']>()
  const notesByIncidentId = new Map<string, IncidentDto['notes']>()

  if (incidentIds.length === 0) {
    return { eventsByIncidentId, notesByIncidentId }
  }

  const db = getDb()
  const placeholders = incidentIds.map(() => '?').join(', ')

  const eventRows = db
    .prepare(
      `SELECT
        id,
        incident_id,
        type,
        actor,
        description,
        created_at
      FROM incident_events
      WHERE incident_id IN (${placeholders})
      ORDER BY datetime(created_at) ASC, rowid ASC`,
    )
    .all(...incidentIds) as IncidentEventRow[]

  const noteRows = db
    .prepare(
      `SELECT
        id,
        incident_id,
        author,
        content,
        created_at
      FROM incident_notes
      WHERE incident_id IN (${placeholders})
      ORDER BY datetime(created_at) ASC, rowid ASC`,
    )
    .all(...incidentIds) as IncidentNoteRow[]

  for (const row of eventRows) {
    const currentEvents = eventsByIncidentId.get(row.incident_id) ?? []
    currentEvents.push(buildTimelineEvent(row))
    eventsByIncidentId.set(row.incident_id, currentEvents)
  }

  for (const row of noteRows) {
    const currentNotes = notesByIncidentId.get(row.incident_id) ?? []
    currentNotes.push(buildIncidentNote(row))
    notesByIncidentId.set(row.incident_id, currentNotes)
  }

  return { eventsByIncidentId, notesByIncidentId }
}

function hydrateIncidents(rows: IncidentRow[]) {
  const { eventsByIncidentId, notesByIncidentId } = getLifecycleMaps(
    rows.map((row) => row.id),
  )

  return rows.map((row) =>
    cloneIncident(
      parseIncidentRow(
        row,
        eventsByIncidentId.get(row.id),
        notesByIncidentId.get(row.id),
      ),
    ),
  )
}

export function listStoredIncidents(options?: { range?: AnalyticsDateRange }) {
  const db = getDb()
  const baseQuery = `SELECT
      id,
      source,
      title,
      description,
      severity,
      status,
      category,
      assigned_runbook,
      assigned_to,
      alert_merge_count,
      created_at,
      updated_at,
      resolved_at,
      timeline_json,
      notes_json,
      review_json,
      is_major
    FROM incidents`

  const rows = options?.range
    ? (db
        .prepare(
          `${baseQuery}
          WHERE datetime(created_at) >= datetime(?)
             OR (resolved_at IS NOT NULL AND datetime(resolved_at) >= datetime(?))
          ORDER BY datetime(created_at) DESC`,
        )
        .all(
          getAnalyticsWindowStart(options.range).toISOString(),
          getAnalyticsWindowStart(options.range).toISOString(),
                ) as IncidentRow[])
    : (db
        .prepare(`${baseQuery} ORDER BY datetime(created_at) DESC`)
        .all() as IncidentRow[])

  return hydrateIncidents(rows)
}

export function getStoredIncident(id: string) {
  const db = getDb()
  const row = db
    .prepare(
      `SELECT
        id,
        source,
        title,
        description,
        severity,
        status,
        category,
        assigned_runbook,
        assigned_to,
        alert_merge_count,
        created_at,
        updated_at,
        resolved_at,
        timeline_json,
        notes_json,
        review_json,
        is_major
      FROM incidents
      WHERE id = ?`,
    )
    .get(id) as IncidentRow | undefined

  return row ? hydrateIncidents([row])[0] ?? null : null
}

/** Open = not resolved; used to merge repeat alerts into one operational incident. */
export function findOpenIncidentIdByAlertDedupKey(dedupKey: string): string | null {
  const db = getDb()
  const row = db
    .prepare(
      `SELECT id FROM incidents
       WHERE alert_dedup_key = ?
         AND status != 'resolved'
       ORDER BY datetime(created_at) DESC
       LIMIT 1`,
    )
    .get(dedupKey) as { id: string } | undefined

  return row?.id ?? null
}

export function saveStoredIncident(incident: IncidentDto) {
  const db = getDb()
  const parsedIncident = incidentDtoSchema.parse(incident)

  db.prepare(
    `INSERT INTO incidents (
      id,
      source,
      title,
      description,
      severity,
      status,
      category,
      assigned_runbook,
      assigned_to,
      created_at,
      updated_at,
      resolved_at,
      timeline_json,
      notes_json,
      alert_dedup_key,
      alert_merge_count,
      review_json,
      is_major
    ) VALUES (
      @id,
      @source,
      @title,
      @description,
      @severity,
      @status,
      @category,
      @assigned_runbook,
      @assigned_to,
      @created_at,
      @updated_at,
      @resolved_at,
      @timeline_json,
      @notes_json,
      @alert_dedup_key,
      @alert_merge_count,
      @review_json,
      @is_major
    )
    ON CONFLICT(id) DO UPDATE SET
      source = excluded.source,
      title = excluded.title,
      description = excluded.description,
      severity = excluded.severity,
      status = excluded.status,
      category = excluded.category,
      assigned_runbook = excluded.assigned_runbook,
      assigned_to = excluded.assigned_to,
      created_at = excluded.created_at,
      updated_at = excluded.updated_at,
      resolved_at = excluded.resolved_at,
      timeline_json = excluded.timeline_json,
      notes_json = excluded.notes_json,
      review_json = excluded.review_json,
      is_major = excluded.is_major`,
  ).run({
    id: parsedIncident.id,
    source: parsedIncident.source,
    title: parsedIncident.title,
    description: parsedIncident.description,
    severity: parsedIncident.severity,
    status: parsedIncident.status,
    category: parsedIncident.category,
    assigned_runbook: parsedIncident.assignedRunbook,
    assigned_to: parsedIncident.assignedTo,
    created_at: parsedIncident.createdAt,
    updated_at: parsedIncident.updatedAt,
    resolved_at: parsedIncident.resolvedAt,
    timeline_json: JSON.stringify(parsedIncident.timeline),
    notes_json: JSON.stringify(parsedIncident.notes),
    alert_dedup_key: null,
    alert_merge_count: parsedIncident.alertMergeCount,
    review_json: JSON.stringify(parsedIncident.review),
    is_major: parsedIncident.isMajorIncident ? 1 : 0,
  })

  return cloneIncident(parsedIncident)
}

export function appendStoredIncidentEvent(event: StoredIncidentEventRecord) {
  const db = getDb()

  db.prepare(
    `INSERT INTO incident_events (
      id,
      incident_id,
      type,
      actor,
      description,
      created_at,
      from_status,
      to_status,
      from_severity,
      to_severity,
      from_assigned_to,
      to_assigned_to,
      metadata_json
    ) VALUES (
      @id,
      @incident_id,
      @type,
      @actor,
      @description,
      @created_at,
      @from_status,
      @to_status,
      @from_severity,
      @to_severity,
      @from_assigned_to,
      @to_assigned_to,
      @metadata_json
    )`,
  ).run({
    id: event.id,
    incident_id: event.incidentId,
    type: event.type,
    actor: event.actor ?? null,
    description: event.description,
    created_at: event.createdAt,
    from_status: event.fromStatus ?? null,
    to_status: event.toStatus ?? null,
    from_severity: event.fromSeverity ?? null,
    to_severity: event.toSeverity ?? null,
    from_assigned_to: event.fromAssignedTo ?? null,
    to_assigned_to: event.toAssignedTo ?? null,
    metadata_json: event.metadataJson ?? null,
  })
}

export function appendStoredIncidentNote(note: StoredIncidentNoteRecord) {
  const db = getDb()

  db.prepare(
    `INSERT INTO incident_notes (
      id,
      incident_id,
      author,
      content,
      created_at
    ) VALUES (
      @id,
      @incident_id,
      @author,
      @content,
      @created_at
    )`,
  ).run({
    id: note.id,
    incident_id: note.incidentId,
    author: note.author,
    content: note.content,
    created_at: note.createdAt,
  })
}

/**
 * Inserts a new incident plus lifecycle rows in one transaction.
 * Does not reuse commitStoredIncidentLifecycleMutation (which updates existing rows).
 */
export function createStoredIncidentWithLifecycle(options: {
  incident: IncidentDto
  events: StoredIncidentEventRecord[]
  notes?: StoredIncidentNoteRecord[]
  notifications?: StoredIncidentNotificationRecord[]
  /** Set when ingest supplies dedupKey so repeat alerts can merge before resolve. */
  alertDedupKey?: string | null
}) {
  const db = getDb()
  const parsedIncident = incidentDtoSchema.parse(options.incident)

  const transaction = db.transaction(() => {
    const insertResult = db
      .prepare(
        `INSERT INTO incidents (
          id,
          source,
          title,
          description,
          severity,
          status,
          category,
          assigned_runbook,
          assigned_to,
          created_at,
          updated_at,
          resolved_at,
          timeline_json,
          notes_json,
          alert_dedup_key,
          alert_merge_count,
          review_json,
          is_major
        ) VALUES (
          @id,
          @source,
          @title,
          @description,
          @severity,
          @status,
          @category,
          @assigned_runbook,
          @assigned_to,
          @created_at,
          @updated_at,
          @resolved_at,
          @timeline_json,
          @notes_json,
          @alert_dedup_key,
          @alert_merge_count,
          @review_json,
          @is_major
        )`,
      )
      .run({
        id: parsedIncident.id,
        source: parsedIncident.source,
        title: parsedIncident.title,
        description: parsedIncident.description,
        severity: parsedIncident.severity,
        status: parsedIncident.status,
        category: parsedIncident.category,
        assigned_runbook: parsedIncident.assignedRunbook,
        assigned_to: parsedIncident.assignedTo,
        created_at: parsedIncident.createdAt,
        updated_at: parsedIncident.updatedAt,
        resolved_at: parsedIncident.resolvedAt,
        timeline_json: JSON.stringify(parsedIncident.timeline),
        notes_json: JSON.stringify(parsedIncident.notes),
        alert_dedup_key: options.alertDedupKey ?? null,
        alert_merge_count: parsedIncident.alertMergeCount,
        review_json: JSON.stringify(parsedIncident.review),
        is_major: parsedIncident.isMajorIncident ? 1 : 0,
      })

    if (insertResult.changes !== 1) {
      throw new IncidentStateConflictError(
        `Incident ${parsedIncident.id} could not be created.`,
      )
    }

    for (const event of options.events) {
      db.prepare(
        `INSERT INTO incident_events (
          id,
          incident_id,
          type,
          actor,
          description,
          created_at,
          from_status,
          to_status,
          from_severity,
          to_severity,
          from_assigned_to,
          to_assigned_to,
          metadata_json
        ) VALUES (
          @id,
          @incident_id,
          @type,
          @actor,
          @description,
          @created_at,
          @from_status,
          @to_status,
          @from_severity,
          @to_severity,
          @from_assigned_to,
          @to_assigned_to,
          @metadata_json
        )`,
      ).run({
        id: event.id,
        incident_id: event.incidentId,
        type: event.type,
        actor: event.actor ?? null,
        description: event.description,
        created_at: event.createdAt,
        from_status: event.fromStatus ?? null,
        to_status: event.toStatus ?? null,
        from_severity: event.fromSeverity ?? null,
        to_severity: event.toSeverity ?? null,
        from_assigned_to: event.fromAssignedTo ?? null,
        to_assigned_to: event.toAssignedTo ?? null,
        metadata_json: event.metadataJson ?? null,
      })
    }

    for (const note of options.notes ?? []) {
      db.prepare(
        `INSERT INTO incident_notes (
          id,
          incident_id,
          author,
          content,
          created_at
        ) VALUES (
          @id,
          @incident_id,
          @author,
          @content,
          @created_at
        )`,
      ).run({
        id: note.id,
        incident_id: note.incidentId,
        author: note.author,
        content: note.content,
        created_at: note.createdAt,
      })
    }

    for (const notification of options.notifications ?? []) {
      db.prepare(
        `INSERT INTO incident_notifications (
          id,
          incident_id,
          event_id,
          type,
          title,
          message,
          incident_title,
          incident_severity,
          created_at,
          read_at
        ) VALUES (
          @id,
          @incident_id,
          @event_id,
          @type,
          @title,
          @message,
          @incident_title,
          @incident_severity,
          @created_at,
          @read_at
        )`,
      ).run({
        id: notification.id,
        incident_id: notification.incidentId,
        event_id: notification.eventId ?? null,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        incident_title: notification.incidentTitle,
        incident_severity: notification.incidentSeverity,
        created_at: notification.createdAt,
        read_at: notification.readAt ?? null,
      })
    }

    return cloneIncident(parsedIncident)
  })

  return transaction()
}

export function commitStoredIncidentLifecycleMutation(options: {
  incident: IncidentDto
  events: StoredIncidentEventRecord[]
  notes?: StoredIncidentNoteRecord[]
  notifications?: StoredIncidentNotificationRecord[]
  expectedCurrentStatus?: IncidentDto['status']
  expectedCurrentAssignedTo?: string | null
  expectedCurrentSeverity?: IncidentDto['severity']
  expectedCurrentAlertMergeCount?: number
  expectedCurrentIsMajor?: boolean
}) {
  const db = getDb()
  const parsedIncident = incidentDtoSchema.parse(options.incident)

  const transaction = db.transaction(() => {
    const currentRow = db
      .prepare(
        'SELECT status, assigned_to, severity, alert_merge_count, is_major FROM incidents WHERE id = ?',
      )
      .get(parsedIncident.id) as
      | {
          status: IncidentDto['status']
          assigned_to: string | null
          severity: IncidentDto['severity']
          alert_merge_count: number
          is_major: number
        }
      | undefined

    if (!currentRow) {
      throw new IncidentStateConflictError(
        `Incident ${parsedIncident.id} no longer exists.`,
      )
    }

    if (
      options.expectedCurrentStatus &&
      currentRow.status !== options.expectedCurrentStatus
    ) {
      throw new IncidentStateConflictError(
        `Incident ${parsedIncident.id} changed state before the lifecycle action could be applied.`,
      )
    }

    if (
      options.expectedCurrentAssignedTo !== undefined &&
      currentRow.assigned_to !== options.expectedCurrentAssignedTo
    ) {
      throw new IncidentStateConflictError(
        `Incident ${parsedIncident.id} changed assignee before the lifecycle action could be applied.`,
      )
    }

    if (
      options.expectedCurrentSeverity !== undefined &&
      currentRow.severity !== options.expectedCurrentSeverity
    ) {
      throw new IncidentStateConflictError(
        `Incident ${parsedIncident.id} changed severity before the lifecycle action could be applied.`,
      )
    }

    if (
      options.expectedCurrentAlertMergeCount !== undefined &&
      currentRow.alert_merge_count !== options.expectedCurrentAlertMergeCount
    ) {
      throw new IncidentStateConflictError(
        `Incident ${parsedIncident.id} changed alert merge count before the lifecycle action could be applied.`,
      )
    }

    if (options.expectedCurrentIsMajor !== undefined) {
      const currentMajor = (currentRow.is_major ?? 0) === 1
      if (currentMajor !== options.expectedCurrentIsMajor) {
        throw new IncidentStateConflictError(
          `Incident ${parsedIncident.id} changed major-incident flag before the lifecycle action could be applied.`,
        )
      }
    }

    const updateResult = db
      .prepare(
        `UPDATE incidents SET
          source = @source,
          title = @title,
          description = @description,
          severity = @severity,
          status = @status,
          category = @category,
          assigned_runbook = @assigned_runbook,
          assigned_to = @assigned_to,
          created_at = @created_at,
          updated_at = @updated_at,
          resolved_at = @resolved_at,
          timeline_json = @timeline_json,
          notes_json = @notes_json,
          alert_merge_count = @alert_merge_count,
          review_json = @review_json,
          is_major = @is_major
        WHERE id = @id`,
      )
      .run({
        id: parsedIncident.id,
        source: parsedIncident.source,
        title: parsedIncident.title,
        description: parsedIncident.description,
        severity: parsedIncident.severity,
        status: parsedIncident.status,
        category: parsedIncident.category,
        assigned_runbook: parsedIncident.assignedRunbook,
        assigned_to: parsedIncident.assignedTo,
        created_at: parsedIncident.createdAt,
        updated_at: parsedIncident.updatedAt,
        resolved_at: parsedIncident.resolvedAt,
        timeline_json: JSON.stringify(parsedIncident.timeline),
        notes_json: JSON.stringify(parsedIncident.notes),
        alert_merge_count: parsedIncident.alertMergeCount,
        review_json: JSON.stringify(parsedIncident.review),
        is_major: parsedIncident.isMajorIncident ? 1 : 0,
      })

    if (updateResult.changes !== 1) {
      throw new IncidentStateConflictError(
        `Incident ${parsedIncident.id} could not be updated.`,
      )
    }

    for (const event of options.events) {
      db.prepare(
        `INSERT INTO incident_events (
          id,
          incident_id,
          type,
          actor,
          description,
          created_at,
          from_status,
          to_status,
          from_severity,
          to_severity,
          from_assigned_to,
          to_assigned_to,
          metadata_json
        ) VALUES (
          @id,
          @incident_id,
          @type,
          @actor,
          @description,
          @created_at,
          @from_status,
          @to_status,
          @from_severity,
          @to_severity,
          @from_assigned_to,
          @to_assigned_to,
          @metadata_json
        )`,
      ).run({
        id: event.id,
        incident_id: event.incidentId,
        type: event.type,
        actor: event.actor ?? null,
        description: event.description,
        created_at: event.createdAt,
        from_status: event.fromStatus ?? null,
        to_status: event.toStatus ?? null,
        from_severity: event.fromSeverity ?? null,
        to_severity: event.toSeverity ?? null,
        from_assigned_to: event.fromAssignedTo ?? null,
        to_assigned_to: event.toAssignedTo ?? null,
        metadata_json: event.metadataJson ?? null,
      })
    }

    for (const note of options.notes ?? []) {
      db.prepare(
        `INSERT INTO incident_notes (
          id,
          incident_id,
          author,
          content,
          created_at
        ) VALUES (
          @id,
          @incident_id,
          @author,
          @content,
          @created_at
        )`,
      ).run({
        id: note.id,
        incident_id: note.incidentId,
        author: note.author,
        content: note.content,
        created_at: note.createdAt,
      })
    }

    for (const notification of options.notifications ?? []) {
      db.prepare(
        `INSERT INTO incident_notifications (
          id,
          incident_id,
          event_id,
          type,
          title,
          message,
          incident_title,
          incident_severity,
          created_at,
          read_at
        ) VALUES (
          @id,
          @incident_id,
          @event_id,
          @type,
          @title,
          @message,
          @incident_title,
          @incident_severity,
          @created_at,
          @read_at
        )`,
      ).run({
        id: notification.id,
        incident_id: notification.incidentId,
        event_id: notification.eventId ?? null,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        incident_title: notification.incidentTitle,
        incident_severity: notification.incidentSeverity,
        created_at: notification.createdAt,
        read_at: notification.readAt ?? null,
      })
    }

    return cloneIncident(parsedIncident)
  })

  return transaction()
}
