import { randomUUID } from 'node:crypto'

import {
  commitStoredIncidentLifecycleMutation,
  createStoredIncidentWithLifecycle,
  findOpenIncidentIdByAlertDedupKey,
  getStoredIncident,
  listStoredIncidents,
  type StoredIncidentEventRecord,
} from '@/lib/server/incidents/store'
import { resolveActorIdentity } from '@/lib/server/users/store'
import {
  alertIngestInputSchema,
  type AlertIngestInput,
  incidentAssignInputSchema,
  incidentLifecycleActionInputSchema,
  incidentNoteCreateInputSchema,
  incidentSeverityChangeInputSchema,
  type IncidentAssignInput,
  type IncidentListQuery,
  incidentRouteParamsSchema,
  incidentDtoSchema,
  incidentsListDtoSchema,
  type IncidentLifecycleActionInput,
  type IncidentNoteCreateInput,
  type IncidentSeverityChangeInput,
  type IncidentDto,
} from '@/lib/server/incidents/schema'
import { deliverSlackNotificationsBestEffort } from '@/lib/server/notifications/slack'
import type { StoredIncidentNotificationRecord } from '@/lib/server/notifications/store'

type LifecycleTimelineEvent = IncidentDto['timeline'][number] & {
  createdAt: string
  metadataJson?: string
}
type LifecycleNote = IncidentDto['notes'][number] & {
  createdAt: string
}

export class IncidentNotFoundError extends Error {
  constructor(id: string) {
    super(`Incident ${id} was not found.`)
    this.name = 'IncidentNotFoundError'
  }
}

export class IncidentLifecycleError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'IncidentLifecycleError'
  }
}

function formatTimelineTimestamp(date: Date) {
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
  })
}

const severityRank: Record<IncidentDto['severity'], number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
}

function formatSeverityLabel(severity: IncidentDto['severity']) {
  return severity.charAt(0).toUpperCase() + severity.slice(1)
}

function normalizeAlertSource(value: string) {
  return value.trim().toLowerCase()
}

function normalizeAlertTitle(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function deriveAlertFingerprintV1(input: {
  source: string
  category: IncidentDto['category']
  title: string
}) {
  const normalizedSource = normalizeAlertSource(input.source)
  const normalizedTitle = normalizeAlertTitle(input.title)

  return `v1|source:${normalizedSource}|category:${input.category}|title:${normalizedTitle}`
}

function buildTimelineEvent(
  incidentId: string,
  type: IncidentDto['timeline'][number]['type'],
  description: string,
  actor: string,
  now: Date,
): LifecycleTimelineEvent {
  return {
    id: `evt_${randomUUID()}`,
    createdAt: now.toISOString(),
    timestamp: formatTimelineTimestamp(now),
    type,
    description,
    user: actor,
  }
}

function buildNoteRecord(
  incidentId: string,
  author: string,
  content: string,
  now: Date,
): LifecycleNote {
  return {
    id: `note_${randomUUID()}`,
    createdAt: now.toISOString(),
    user: author,
    timestamp: formatTimelineTimestamp(now),
    content,
  }
}

function buildLifecycleNotification(options: {
  incident: IncidentDto
  eventId?: string
  type: StoredIncidentNotificationRecord['type']
  title: string
  message: string
  createdAt: string
}): StoredIncidentNotificationRecord {
  return {
    id: `notif_${randomUUID()}`,
    incidentId: options.incident.id,
    eventId: options.eventId ?? null,
    type: options.type,
    title: options.title,
    message: options.message,
    incidentTitle: options.incident.title,
    incidentSeverity: options.incident.severity,
    createdAt: options.createdAt,
    readAt: null,
  }
}

function normalizeLifecycleActor(actor: string) {
  return resolveActorIdentity(actor, 'OpsMate Bot')
}

function createCommentMutation(
  incident: IncidentDto,
  actor: string,
  noteContent: string,
  now: Date,
) {
  const commentTime = new Date(now.getTime() + 1)
  const note = buildNoteRecord(incident.id, actor, noteContent, commentTime)
  const event = buildTimelineEvent(
    incident.id,
    'comment',
    'Added a note',
    actor,
    commentTime,
  )

  return {
    notes: [note] as LifecycleNote[],
    events: [event] as LifecycleTimelineEvent[],
    incident: {
      ...incident,
      updatedAt: 'Just now',
      notes: [...incident.notes, note],
      timeline: [...incident.timeline, event],
    } satisfies IncidentDto,
  }
}

function persistLifecycleMutation(
  incident: IncidentDto,
  options: {
    events: LifecycleTimelineEvent[]
    notes?: LifecycleNote[]
    notifications?: StoredIncidentNotificationRecord[]
    primaryTransitionEventId?: string
    expectedCurrentStatus?: IncidentDto['status']
    expectedCurrentAssignedTo?: string | null
    expectedCurrentSeverity?: IncidentDto['severity']
    expectedCurrentAlertMergeCount?: number
    fromStatus?: IncidentDto['status'] | null
    toStatus?: IncidentDto['status'] | null
    fromSeverity?: IncidentDto['severity'] | null
    toSeverity?: IncidentDto['severity'] | null
    fromAssignedTo?: string | null
    toAssignedTo?: string | null
  },
) {
  return incidentDtoSchema.parse(
    commitStoredIncidentLifecycleMutation({
      incident,
      expectedCurrentStatus: options.expectedCurrentStatus,
      expectedCurrentAssignedTo: options.expectedCurrentAssignedTo,
      expectedCurrentSeverity: options.expectedCurrentSeverity,
      expectedCurrentAlertMergeCount: options.expectedCurrentAlertMergeCount,
      notifications: options.notifications,
      events: options.events.map((event) => {
        const isPrimaryTransition = event.id === options.primaryTransitionEventId

        return {
          id: event.id,
          incidentId: incident.id,
          type: event.type,
          actor: event.user ?? null,
          description: event.description,
          createdAt: event.createdAt,
          metadataJson: event.metadataJson ?? null,
          fromStatus: isPrimaryTransition ? (options.fromStatus ?? null) : null,
          toStatus: isPrimaryTransition ? (options.toStatus ?? null) : null,
          fromSeverity: isPrimaryTransition ? (options.fromSeverity ?? null) : null,
          toSeverity: isPrimaryTransition ? (options.toSeverity ?? null) : null,
          fromAssignedTo: isPrimaryTransition ? (options.fromAssignedTo ?? null) : null,
          toAssignedTo: isPrimaryTransition ? (options.toAssignedTo ?? null) : null,
        }
      }),
      notes: (options.notes ?? []).map((note) => ({
        id: note.id,
        incidentId: incident.id,
        author: note.user,
        content: note.content,
        createdAt: note.createdAt,
      })),
    }),
  )
}

function applyOptionalComment(
  incident: IncidentDto,
  actor: string,
  noteContent: string | undefined,
  now: Date,
) {
  if (!noteContent) {
    return {
      incident,
      notes: [] as LifecycleNote[],
      events: [] as LifecycleTimelineEvent[],
    }
  }

  return createCommentMutation(incident, actor, noteContent, now)
}

function createAcknowledgedIncident(
  incident: IncidentDto,
  input: IncidentLifecycleActionInput,
) {
  if (incident.status !== 'open') {
    throw new IncidentLifecycleError('Only open incidents can be acknowledged.')
  }

  const now = new Date()
  const event = buildTimelineEvent(
    incident.id,
    'acknowledged',
    'Incident acknowledged',
    input.actor,
    now,
  )

  const baseIncident: IncidentDto = {
    ...incident,
    status: 'acknowledged',
    updatedAt: 'Just now',
    timeline: [...incident.timeline, event],
  }

  const optionalComment = applyOptionalComment(baseIncident, input.actor, input.note, now)

  return {
    incident: optionalComment.incident,
    events: [event, ...optionalComment.events],
    notes: optionalComment.notes,
    notifications: [] as StoredIncidentNotificationRecord[],
    primaryTransitionEventId: event.id,
    expectedCurrentStatus: incident.status,
    fromStatus: incident.status,
    toStatus: 'acknowledged' as const,
  }
}

function createAssignedIncident(
  incident: IncidentDto,
  input: IncidentAssignInput,
) {
  if (incident.status === 'resolved') {
    throw new IncidentLifecycleError('Resolved incidents cannot be reassigned.')
  }

  if (incident.assignedTo === input.assignee) {
    throw new IncidentLifecycleError(
      `Incident is already assigned to ${input.assignee}.`,
    )
  }

  const now = new Date()
  const description = incident.assignedTo
    ? `Reassigned incident to ${input.assignee}`
    : `Assigned incident to ${input.assignee}`
  const event = buildTimelineEvent(
    incident.id,
    'assigned',
    description,
    input.actor,
    now,
  )

  return {
    incident: {
      ...incident,
      assignedTo: input.assignee,
      updatedAt: 'Just now',
      timeline: [...incident.timeline, event],
    } satisfies IncidentDto,
    events: [event] as LifecycleTimelineEvent[],
    notes: [] as LifecycleNote[],
    primaryTransitionEventId: event.id,
    expectedCurrentStatus: incident.status,
    expectedCurrentAssignedTo: incident.assignedTo,
    fromAssignedTo: incident.assignedTo,
    toAssignedTo: input.assignee,
    notifications: [
      buildLifecycleNotification({
        incident: {
          ...incident,
          assignedTo: input.assignee,
        } satisfies IncidentDto,
        eventId: event.id,
        type: 'incident_assigned',
        title: incident.assignedTo ? 'Incident reassigned' : 'Incident assigned',
        message: `${incident.id} was ${incident.assignedTo ? 'reassigned' : 'assigned'} to ${input.assignee}.`,
        createdAt: event.createdAt,
      }),
    ] as StoredIncidentNotificationRecord[],
  }
}

function createResolvedIncident(
  incident: IncidentDto,
  input: IncidentLifecycleActionInput,
) {
  if (incident.status === 'resolved') {
    return {
      incident,
      events: [] as LifecycleTimelineEvent[],
      notes: [] as LifecycleNote[],
      notifications: [] as StoredIncidentNotificationRecord[],
      primaryTransitionEventId: undefined,
      expectedCurrentStatus: undefined,
      fromStatus: incident.status,
      toStatus: incident.status,
    }
  }

  const now = new Date()
  const event = buildTimelineEvent(
    incident.id,
    'resolved',
    'Incident resolved from OpsMate API',
    input.actor,
    now,
  )

  const baseIncident: IncidentDto = {
    ...incident,
    status: 'resolved',
    updatedAt: 'Just now',
    resolvedAt: now.toISOString(),
    timeline: [...incident.timeline, event],
  }

  const optionalComment = applyOptionalComment(baseIncident, input.actor, input.note, now)

  return {
    incident: optionalComment.incident,
    events: [event, ...optionalComment.events],
    notes: optionalComment.notes,
    notifications: [
      buildLifecycleNotification({
        incident: {
          ...incident,
          status: 'resolved',
        } satisfies IncidentDto,
        eventId: event.id,
        type: 'incident_resolved',
        title: 'Incident resolved',
        message: `${incident.id} was resolved by ${input.actor}.`,
        createdAt: event.createdAt,
      }),
    ] as StoredIncidentNotificationRecord[],
    primaryTransitionEventId: event.id,
    expectedCurrentStatus: incident.status,
    fromStatus: incident.status,
    toStatus: 'resolved' as const,
  }
}

function createSeverityChangedIncident(
  incident: IncidentDto,
  input: IncidentSeverityChangeInput,
) {
  if (incident.status === 'resolved') {
    throw new IncidentLifecycleError('Resolved incidents cannot change severity.')
  }

  if (incident.severity === input.severity) {
    throw new IncidentLifecycleError(
      `Incident is already ${input.severity} severity.`,
    )
  }

  const now = new Date()
  const isEscalation = severityRank[input.severity] < severityRank[incident.severity]
  const event = buildTimelineEvent(
    incident.id,
    'severity_changed',
    `${isEscalation ? 'Severity escalated' : 'Severity downgraded'} from ${formatSeverityLabel(incident.severity)} to ${formatSeverityLabel(input.severity)}`,
    input.actor,
    now,
  )

  return {
    incident: {
      ...incident,
      severity: input.severity,
      updatedAt: 'Just now',
      timeline: [...incident.timeline, event],
    } satisfies IncidentDto,
    events: [event] as LifecycleTimelineEvent[],
    notes: [] as LifecycleNote[],
    notifications: [] as StoredIncidentNotificationRecord[],
    primaryTransitionEventId: event.id,
    expectedCurrentStatus: incident.status,
    expectedCurrentSeverity: incident.severity,
    fromSeverity: incident.severity,
    toSeverity: input.severity,
  }
}

function createReopenedIncident(
  incident: IncidentDto,
  input: IncidentLifecycleActionInput,
) {
  if (incident.status !== 'resolved') {
    throw new IncidentLifecycleError('Only resolved incidents can be reopened.')
  }

  const now = new Date()
  const event = buildTimelineEvent(
    incident.id,
    'reopened',
    'Incident reopened',
    input.actor,
    now,
  )

  const baseIncident: IncidentDto = {
    ...incident,
    status: 'acknowledged',
    updatedAt: 'Just now',
    resolvedAt: null,
    timeline: [...incident.timeline, event],
  }

  const optionalComment = applyOptionalComment(baseIncident, input.actor, input.note, now)

  return {
    incident: optionalComment.incident,
    events: [event, ...optionalComment.events],
    notes: optionalComment.notes,
    notifications: [
      buildLifecycleNotification({
        incident: {
          ...incident,
          status: 'acknowledged',
        } satisfies IncidentDto,
        eventId: event.id,
        type: 'incident_reopened',
        title: 'Incident reopened',
        message: `${incident.id} was reopened by ${input.actor}.`,
        createdAt: event.createdAt,
      }),
    ] as StoredIncidentNotificationRecord[],
    primaryTransitionEventId: event.id,
    expectedCurrentStatus: incident.status,
    fromStatus: incident.status,
    toStatus: 'acknowledged' as const,
  }
}

export function listIncidents(query?: IncidentListQuery) {
  return incidentsListDtoSchema.parse(listStoredIncidents(query))
}

export function getIncidentById(id: string) {
  const parsedParams = incidentRouteParamsSchema.parse({ id })
  const incident = getStoredIncident(parsedParams.id)

  if (!incident) {
    throw new IncidentNotFoundError(parsedParams.id)
  }

  return incidentDtoSchema.parse(incident)
}

export function acknowledgeIncidentById(
  id: string,
  input?: IncidentLifecycleActionInput,
) {
  const incident = getIncidentById(id)
  const parsedInput = incidentLifecycleActionInputSchema.parse(input ?? {})
  const normalizedInput = {
    ...parsedInput,
    actor: normalizeLifecycleActor(parsedInput.actor),
  }
  const mutation = createAcknowledgedIncident(incident, normalizedInput)

  return persistLifecycleMutation(mutation.incident, {
    events: mutation.events,
    notes: mutation.notes,
    notifications: mutation.notifications,
    primaryTransitionEventId: mutation.primaryTransitionEventId,
    expectedCurrentStatus: mutation.expectedCurrentStatus,
    expectedCurrentSeverity: incident.severity,
    fromStatus: mutation.fromStatus,
    toStatus: mutation.toStatus,
  })
}

export function assignIncidentById(id: string, input: IncidentAssignInput) {
  const incident = getIncidentById(id)
  const parsedInput = incidentAssignInputSchema.parse(input)
  const normalizedInput = {
    ...parsedInput,
    actor: normalizeLifecycleActor(parsedInput.actor),
    assignee: resolveActorIdentity(parsedInput.assignee, parsedInput.assignee),
  }
  const mutation = createAssignedIncident(incident, normalizedInput)

  const updatedIncident = persistLifecycleMutation(mutation.incident, {
    events: mutation.events,
    notes: mutation.notes,
    notifications: mutation.notifications,
    primaryTransitionEventId: mutation.primaryTransitionEventId,
    expectedCurrentStatus: mutation.expectedCurrentStatus,
    expectedCurrentAssignedTo: mutation.expectedCurrentAssignedTo,
    expectedCurrentSeverity: incident.severity,
    fromAssignedTo: mutation.fromAssignedTo,
    toAssignedTo: mutation.toAssignedTo,
  })

  void deliverSlackNotificationsBestEffort(mutation.notifications)
  return updatedIncident
}

export function changeIncidentSeverityById(
  id: string,
  input: IncidentSeverityChangeInput,
) {
  const incident = getIncidentById(id)
  const parsedInput = incidentSeverityChangeInputSchema.parse(input)
  const normalizedInput = {
    ...parsedInput,
    actor: normalizeLifecycleActor(parsedInput.actor),
  }
  const mutation = createSeverityChangedIncident(incident, normalizedInput)

  return persistLifecycleMutation(mutation.incident, {
    events: mutation.events,
    notes: mutation.notes,
    notifications: mutation.notifications,
    primaryTransitionEventId: mutation.primaryTransitionEventId,
    expectedCurrentStatus: mutation.expectedCurrentStatus,
    expectedCurrentSeverity: mutation.expectedCurrentSeverity,
    fromSeverity: mutation.fromSeverity,
    toSeverity: mutation.toSeverity,
  })
}

export function resolveIncidentById(
  id: string,
  input?: IncidentLifecycleActionInput,
) {
  const incident = getIncidentById(id)
  const parsedInput = incidentLifecycleActionInputSchema.parse(input ?? {})
  const normalizedInput = {
    ...parsedInput,
    actor: normalizeLifecycleActor(parsedInput.actor),
  }
  const mutation = createResolvedIncident(incident, normalizedInput)

  if (mutation.events.length === 0) {
    return incidentDtoSchema.parse(incident)
  }

  const updatedIncident = persistLifecycleMutation(mutation.incident, {
    events: mutation.events,
    notes: mutation.notes,
    notifications: mutation.notifications,
    primaryTransitionEventId: mutation.primaryTransitionEventId,
    expectedCurrentStatus: incident.status,
    expectedCurrentSeverity: incident.severity,
    fromStatus: mutation.fromStatus,
    toStatus: mutation.toStatus,
  })

  void deliverSlackNotificationsBestEffort(mutation.notifications)
  return updatedIncident
}

export function reopenIncidentById(
  id: string,
  input?: IncidentLifecycleActionInput,
) {
  const incident = getIncidentById(id)
  const parsedInput = incidentLifecycleActionInputSchema.parse(input ?? {})
  const normalizedInput = {
    ...parsedInput,
    actor: normalizeLifecycleActor(parsedInput.actor),
  }
  const mutation = createReopenedIncident(incident, normalizedInput)

  const updatedIncident = persistLifecycleMutation(mutation.incident, {
    events: mutation.events,
    notes: mutation.notes,
    notifications: mutation.notifications,
    primaryTransitionEventId: mutation.primaryTransitionEventId,
    expectedCurrentStatus: mutation.expectedCurrentStatus,
    expectedCurrentSeverity: incident.severity,
    fromStatus: mutation.fromStatus,
    toStatus: mutation.toStatus,
  })

  void deliverSlackNotificationsBestEffort(mutation.notifications)
  return updatedIncident
}

export function addIncidentNoteById(
  id: string,
  input: IncidentNoteCreateInput,
) {
  const incident = getIncidentById(id)
  const parsedInput = incidentNoteCreateInputSchema.parse(input)
  const normalizedAuthor = normalizeLifecycleActor(parsedInput.author)
  const commentMutation = createCommentMutation(
    incident,
    normalizedAuthor,
    parsedInput.content,
    new Date(),
  )

  return persistLifecycleMutation(commentMutation.incident, {
    events: commentMutation.events,
    notes: commentMutation.notes,
    expectedCurrentStatus: incident.status,
    expectedCurrentSeverity: incident.severity,
  })
}

function mergeIngestIntoOpenIncident(
  incidentId: string,
  parsed: AlertIngestInput,
) {
  const incident = getStoredIncident(incidentId)
  if (!incident) {
    throw new IncidentNotFoundError(incidentId)
  }

  const description =
    parsed.description?.trim() || 'No description provided.'
  const now = new Date()
  const nextMergeCount = incident.alertMergeCount + 1
  const event = buildTimelineEvent(
    incidentId,
    'alert_merged',
    `Alert merged (repeat ${nextMergeCount}) from ${parsed.source}`,
    parsed.source,
    now,
  )
  event.metadataJson = JSON.stringify({
    incidentTitle: parsed.title,
    incidentSeverity: parsed.severity,
    incidentSource: parsed.source,
    mergeCount: nextMergeCount,
  })

  const updated: IncidentDto = {
    ...incident,
    title: parsed.title,
    description,
    severity: parsed.severity,
    alertMergeCount: nextMergeCount,
    updatedAt: 'Just now',
    timeline: [...incident.timeline, event],
  }

  return incidentDtoSchema.parse(
    persistLifecycleMutation(updated, {
      events: [event],
      expectedCurrentStatus: incident.status,
      expectedCurrentSeverity: incident.severity,
      expectedCurrentAlertMergeCount: incident.alertMergeCount,
      notifications: [],
    }),
  )
}

export function ingestAlert(input: unknown): {
  incident: IncidentDto
  deduplicated: boolean
} {
  const parsed = alertIngestInputSchema.parse(input)
  const effectiveDedupKey =
    parsed.dedupKey ??
    deriveAlertFingerprintV1({
      source: parsed.source,
      category: parsed.category,
      title: parsed.title,
    })
  const description =
    parsed.description?.trim() || 'No description provided.'

  const existingId = findOpenIncidentIdByAlertDedupKey(effectiveDedupKey)
  if (existingId) {
    const existingIncident = getStoredIncident(existingId)
    const sourceMatches =
      normalizeAlertSource(existingIncident?.source ?? '') ===
      normalizeAlertSource(parsed.source)
    const categoryMatches = existingIncident?.category === parsed.category

    if (existingIncident && sourceMatches && categoryMatches) {
      return {
        incident: mergeIngestIntoOpenIncident(existingId, parsed),
        deduplicated: true,
      }
    }
  }

  const incidentId = `INC-${randomUUID()}`
  const now = new Date()
  const event = buildTimelineEvent(
    incidentId,
    'created',
    `Incident created from ${parsed.source} alert`,
    parsed.source,
    now,
  )

  const incident: IncidentDto = {
    id: incidentId,
    source: parsed.source,
    title: parsed.title,
    description,
    severity: parsed.severity,
    status: 'open',
    category: parsed.category,
    assignedRunbook: null,
    assignedTo: null,
    alertMergeCount: 0,
    createdAt: now.toISOString(),
    updatedAt: 'Just now',
    resolvedAt: null,
    timeline: [event],
    notes: [],
  }

  const storedEvent: StoredIncidentEventRecord = {
    id: event.id,
    incidentId,
    type: event.type,
    actor: event.user ?? null,
    description: event.description,
    createdAt: event.createdAt,
    metadataJson: JSON.stringify({
      incidentTitle: incident.title,
      incidentSeverity: incident.severity,
      incidentSource: incident.source,
      mergeCount: 0,
    }),
    fromStatus: null,
    toStatus: 'open',
    fromSeverity: null,
    toSeverity: parsed.severity,
    fromAssignedTo: null,
    toAssignedTo: null,
  }

  const notifications =
    parsed.severity === 'critical'
      ? [
          buildLifecycleNotification({
            incident,
            eventId: event.id,
            type: 'incident_created_critical',
            title: 'Critical incident created',
            message: `${incidentId} was created: ${parsed.title}.`,
            createdAt: event.createdAt,
          }),
        ]
      : []

  const createdIncident = incidentDtoSchema.parse(
    createStoredIncidentWithLifecycle({
      incident,
      events: [storedEvent],
      notifications,
      alertDedupKey: effectiveDedupKey,
    }),
  )

  void deliverSlackNotificationsBestEffort(notifications)

  return {
    incident: createdIncident,
    deduplicated: false,
  }
}
