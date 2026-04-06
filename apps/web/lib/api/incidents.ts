import {
  isIncidentInDateRange,
  type AnalyticsDateRange,
} from '@/lib/analytics/date-range'
import { buildApiUrl } from '@/lib/config'
import { getCurrentDemoIncidents } from '@/lib/demo-incidents'
import type {
  Incident,
  IncidentCategory,
  IncidentNote,
  IncidentTimelineEvent,
  Severity,
  Status,
} from '@/lib/types'

export type IncidentsDataSource = 'backend' | 'mock'

export interface IncidentListResult {
  incidents: Incident[]
  source: IncidentsDataSource
  warning?: string
}

export interface IncidentResult {
  incident: Incident
  source: IncidentsDataSource
  warning?: string
}

export interface LoadIncidentsOptions {
  range?: AnalyticsDateRange
}

const REQUEST_TIMEOUT_MS = 6000

export const INCIDENTS_FALLBACK_MESSAGE =
  'Live incident service is unavailable. Showing demo data instead.'

export const INCIDENT_RESOLVE_FALLBACK_MESSAGE =
  'Live incident service is unavailable. Incident was resolved locally in demo mode.'
export const INCIDENT_ACKNOWLEDGE_FALLBACK_MESSAGE =
  'Live incident service is unavailable. Incident was acknowledged locally in demo mode.'
export const INCIDENT_ASSIGN_FALLBACK_MESSAGE =
  'Live incident service is unavailable. Incident assignment was updated locally in demo mode.'
export const INCIDENT_SEVERITY_FALLBACK_MESSAGE =
  'Live incident service is unavailable. Incident severity was updated locally in demo mode.'
export const INCIDENT_REOPEN_FALLBACK_MESSAGE =
  'Live incident service is unavailable. Incident was reopened locally in demo mode.'
export const INCIDENT_NOTE_FALLBACK_MESSAGE =
  'Live incident service is unavailable. Note was added locally in demo mode.'

class IncidentsApiError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message)
    this.name = 'IncidentsApiError'
  }
}

type IncidentApiResponse = Partial<
  Omit<Incident, 'timeline' | 'notes' | 'title' | 'description'>
> & {
  id?: string
  title?: string | null
  message?: string | null
  description?: string | null
  timeline?: IncidentTimelineEvent[] | null
  notes?: IncidentNote[] | null
}

const DEFAULT_INCIDENT_CATEGORY: IncidentCategory = 'application'
const VALID_SEVERITIES: Severity[] = ['critical', 'high', 'medium', 'low']
const VALID_STATUSES: Status[] = ['open', 'acknowledged', 'investigating', 'resolved']
const VALID_INCIDENT_CATEGORIES: IncidentCategory[] = [
  'application',
  'database',
  'infrastructure',
  'network',
  'security',
]
const severityRank: Record<Severity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isValidIsoDate(value: unknown): value is string {
  return isNonEmptyString(value) && !Number.isNaN(Date.parse(value))
}

function getValidSeverity(value: unknown, fallback?: Severity): Severity {
  if (typeof value === 'string' && VALID_SEVERITIES.includes(value as Severity)) {
    return value as Severity
  }

  return fallback ?? 'medium'
}

function getValidStatus(value: unknown, fallback?: Status): Status {
  if (typeof value === 'string' && VALID_STATUSES.includes(value as Status)) {
    return value as Status
  }

  return fallback ?? 'open'
}

function getValidCategory(
  value: unknown,
  fallback?: IncidentCategory,
): IncidentCategory {
  if (
    typeof value === 'string' &&
    VALID_INCIDENT_CATEGORIES.includes(value as IncidentCategory)
  ) {
    return value as IncidentCategory
  }

  return fallback ?? DEFAULT_INCIDENT_CATEGORY
}

function formatSeverityLabel(severity: Severity) {
  return severity.charAt(0).toUpperCase() + severity.slice(1)
}

function normalizeTimeline(
  timeline: IncidentApiResponse['timeline'],
  fallback?: IncidentTimelineEvent[],
) {
  return Array.isArray(timeline)
    ? timeline.map((event) => ({ ...event }))
    : (fallback ?? []).map((event) => ({ ...event }))
}

function normalizeNotes(
  notes: IncidentApiResponse['notes'],
  fallback?: IncidentNote[],
) {
  return Array.isArray(notes)
    ? notes.map((note) => ({ ...note }))
    : (fallback ?? []).map((note) => ({ ...note }))
}

function normalizeResolvedAt(
  status: Status,
  resolvedAt: unknown,
  updatedAt: unknown,
  fallback?: string | null,
) {
  if (status !== 'resolved') {
    return null
  }

  if (isValidIsoDate(resolvedAt)) {
    return resolvedAt
  }

  if (isValidIsoDate(updatedAt)) {
    return updatedAt
  }

  return fallback ?? null
}

function normalizeIncident(
  incident: IncidentApiResponse,
  fallback?: Incident,
): Incident {
  const createdAt =
    isValidIsoDate(incident.createdAt) ? incident.createdAt : fallback?.createdAt
  const status = getValidStatus(incident.status, fallback?.status)
  const resolvedAt = normalizeResolvedAt(
    status,
    incident.resolvedAt,
    incident.updatedAt,
    fallback?.resolvedAt,
  )

  return {
    id: isNonEmptyString(incident.id) ? incident.id : fallback?.id ?? 'INC-UNKNOWN',
    source: isNonEmptyString(incident.source)
      ? incident.source
      : fallback?.source ?? 'Unknown',
    title: isNonEmptyString(incident.title)
      ? incident.title
      : isNonEmptyString(incident.message)
        ? incident.message
        : fallback?.title ?? 'Untitled incident',
    description: isNonEmptyString(incident.description)
      ? incident.description
      : isNonEmptyString(incident.message)
        ? incident.message
        : fallback?.description ?? 'No additional incident details available.',
    severity: getValidSeverity(incident.severity, fallback?.severity),
    status,
    category: getValidCategory(incident.category, fallback?.category),
    assignedRunbook:
      typeof incident.assignedRunbook === 'string' || incident.assignedRunbook === null
        ? incident.assignedRunbook
        : (fallback?.assignedRunbook ?? null),
    assignedTo:
      typeof incident.assignedTo === 'string' || incident.assignedTo === null
        ? incident.assignedTo
        : (fallback?.assignedTo ?? null),
    createdAt: createdAt ?? new Date().toISOString(),
    updatedAt: isNonEmptyString(incident.updatedAt)
      ? incident.updatedAt
      : fallback?.updatedAt ?? 'Recently updated',
    resolvedAt,
    timeline: normalizeTimeline(incident.timeline, fallback?.timeline),
    notes: normalizeNotes(incident.notes, fallback?.notes),
  }
}

function normalizeIncidents(
  incidents: IncidentApiResponse[],
  fallbacks: Incident[] = [],
) {
  const fallbackById = new Map(fallbacks.map((incident) => [incident.id, incident]))

  return incidents.map((incident) =>
    normalizeIncident(
      incident,
      isNonEmptyString(incident.id) ? fallbackById.get(incident.id) : undefined,
    ),
  )
}

async function requestJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T | null> {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(buildApiUrl(`/api/incidents${path}`), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new IncidentsApiError(
        `Incidents request failed with status ${response.status}.`,
        response.status,
      )
    }

    if (response.status === 204) {
      return null
    }

    return (await response.json()) as T
  } catch (error) {
    if (error instanceof IncidentsApiError) {
      throw error
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new IncidentsApiError('Incidents request timed out.')
    }

    throw new IncidentsApiError('Unable to reach the incidents service.')
  } finally {
    window.clearTimeout(timeoutId)
  }
}

function cloneIncident(incident: Incident): Incident {
  return normalizeIncident(incident, incident)
}

function cloneIncidents(incidents: Incident[]) {
  return incidents.map(cloneIncident)
}

function filterIncidentsByRange(
  incidents: Incident[],
  range?: AnalyticsDateRange,
) {
  if (!range) {
    return cloneIncidents(incidents)
  }

  return cloneIncidents(incidents).filter((incident) =>
    isIncidentInDateRange(incident, range),
  )
}

function getMockIncidentById(id: string) {
  const mockIncidents = getCurrentDemoIncidents()
  const incident = mockIncidents.find((item) => item.id === id)
  return incident ? cloneIncident(incident) : null
}

function createLocalNote(incidentId: string, actor: string, content: string, now: Date) {
  return {
    id: `note-${incidentId}-${now.getTime()}`,
    user: actor,
    timestamp: now.toLocaleTimeString([], {
      hour: '2-digit',
      hour12: false,
      minute: '2-digit',
    }),
    content,
  } satisfies IncidentNote
}

function createLocalTimelineEvent(
  incidentId: string,
  actor: string,
  eventType: IncidentTimelineEvent['type'],
  description: string,
  now: Date,
) {
  return {
    id: `${eventType}-${incidentId}-${now.getTime()}`,
    timestamp: now.toLocaleTimeString([], {
      hour: '2-digit',
      hour12: false,
      minute: '2-digit',
    }),
    type: eventType,
    description,
    user: actor,
  } satisfies IncidentTimelineEvent
}

function applyLocalIncidentMutation(options: {
  incident: Incident
  actor: string
  eventType: IncidentTimelineEvent['type']
  eventDescription: string
  nextStatus?: Status
  nextResolvedAt?: string | null
  nextAssignedTo?: string | null
  nextSeverity?: Severity
  noteContent?: string
}) {
  const now = new Date()
  const nextIncident = cloneIncident(options.incident)
  const lifecycleEvent = createLocalTimelineEvent(
    options.incident.id,
    options.actor,
    options.eventType,
    options.eventDescription,
    now,
  )

  nextIncident.status = options.nextStatus ?? nextIncident.status
  nextIncident.updatedAt = 'Just now'
  nextIncident.resolvedAt =
    options.nextResolvedAt === undefined
      ? nextIncident.resolvedAt
      : options.nextResolvedAt
  nextIncident.severity =
    options.nextSeverity === undefined
      ? nextIncident.severity
      : options.nextSeverity
  nextIncident.assignedTo =
    options.nextAssignedTo === undefined
      ? nextIncident.assignedTo
      : options.nextAssignedTo
  nextIncident.timeline = [...nextIncident.timeline, lifecycleEvent]

  if (options.noteContent) {
    const note = createLocalNote(
      options.incident.id,
      options.actor,
      options.noteContent,
      now,
    )
    const commentEvent = createLocalTimelineEvent(
      options.incident.id,
      options.actor,
      'comment',
      'Added a note',
      now,
    )

    nextIncident.notes = [...nextIncident.notes, note]
    nextIncident.timeline = [...nextIncident.timeline, commentEvent]
  }

  return nextIncident
}

function createLocallyAcknowledgedIncident(
  incident: Incident,
  actor: string,
  noteContent?: string,
) {
  return applyLocalIncidentMutation({
    incident,
    actor,
    eventDescription: 'Incident acknowledged',
    eventType: 'acknowledged',
    nextStatus: 'acknowledged',
    noteContent,
  })
}

function createLocallyResolvedIncident(
  incident: Incident,
  actor: string,
  noteContent?: string,
) {
  return applyLocalIncidentMutation({
    incident,
    actor,
    eventDescription: 'Incident resolved from OpsMate',
    eventType: 'resolved',
    nextResolvedAt: new Date().toISOString(),
    nextStatus: 'resolved',
    noteContent,
  })
}

function createLocallyReopenedIncident(
  incident: Incident,
  actor: string,
  noteContent?: string,
) {
  return applyLocalIncidentMutation({
    incident,
    actor,
    eventDescription: 'Incident reopened',
    eventType: 'reopened',
    nextResolvedAt: null,
    nextStatus: 'acknowledged',
    noteContent,
  })
}

function createLocallyAssignedIncident(
  incident: Incident,
  actor: string,
  assignee: string,
) {
  return applyLocalIncidentMutation({
    incident,
    actor,
    eventDescription: incident.assignedTo
      ? `Reassigned incident to ${assignee}`
      : `Assigned incident to ${assignee}`,
    eventType: 'assigned',
    nextAssignedTo: assignee,
  })
}

function createLocallySeverityChangedIncident(
  incident: Incident,
  actor: string,
  severity: Severity,
) {
  const isEscalation = severityRank[severity] < severityRank[incident.severity]

  return applyLocalIncidentMutation({
    incident,
    actor,
    eventDescription: `${isEscalation ? 'Severity escalated' : 'Severity downgraded'} from ${formatSeverityLabel(incident.severity)} to ${formatSeverityLabel(severity)}`,
    eventType: 'severity_changed',
    nextSeverity: severity,
  })
}

function assertLocalAssignmentAllowed(incident: Incident, assignee: string) {
  if (incident.status === 'resolved') {
    throw new IncidentsApiError('Resolved incidents cannot be reassigned.', 409)
  }

  if (incident.assignedTo === assignee) {
    throw new IncidentsApiError(
      `Incident is already assigned to ${assignee}.`,
      409,
    )
  }
}

function assertLocalSeverityChangeAllowed(incident: Incident, severity: Severity) {
  if (incident.status === 'resolved') {
    throw new IncidentsApiError('Resolved incidents cannot change severity.', 409)
  }

  if (incident.severity === severity) {
    throw new IncidentsApiError(
      `Incident is already ${severity} severity.`,
      409,
    )
  }
}

function createLocallyAnnotatedIncident(
  incident: Incident,
  author: string,
  content: string,
) {
  const now = new Date()
  const note = createLocalNote(incident.id, author, content, now)
  const commentEvent = createLocalTimelineEvent(
    incident.id,
    author,
    'comment',
    'Added a note',
    now,
  )

  return {
    ...cloneIncident(incident),
    updatedAt: 'Just now',
    notes: [...incident.notes.map((noteItem) => ({ ...noteItem })), note],
    timeline: [
      ...incident.timeline.map((event) => ({ ...event })),
      commentEvent,
    ],
  }
}

export async function getIncidents(options?: LoadIncidentsOptions): Promise<Incident[]> {
  const mockIncidents = getCurrentDemoIncidents()
  const searchParams = new URLSearchParams()

  if (options?.range) {
    searchParams.set('range', options.range)
  }

  const path = searchParams.size > 0 ? `?${searchParams.toString()}` : ''
  const incidents = await requestJson<IncidentApiResponse[]>(path)
  return incidents ? normalizeIncidents(incidents, mockIncidents) : []
}

export async function getIncident(id: string): Promise<Incident> {
  const incident = await requestJson<IncidentApiResponse>(`/${id}`)

  if (!incident) {
    throw new IncidentsApiError(`Incident ${id} returned no data.`)
  }

  return normalizeIncident(incident, getMockIncidentById(id) ?? undefined)
}

export async function resolveIncident(id: string): Promise<Incident | null> {
  return resolveIncidentAction(id, { actor: 'OpsMate' })
}

async function resolveIncidentAction(
  id: string,
  payload: { actor: string; note?: string },
): Promise<Incident | null> {
  const incident = await requestJson<IncidentApiResponse>(`/${id}/resolve`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })

  return incident
    ? normalizeIncident(incident, getMockIncidentById(id) ?? undefined)
    : null
}

export async function acknowledgeIncident(
  id: string,
  payload: { actor: string; note?: string },
): Promise<Incident | null> {
  const incident = await requestJson<IncidentApiResponse>(`/${id}/acknowledge`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })

  return incident
    ? normalizeIncident(incident, getMockIncidentById(id) ?? undefined)
    : null
}

export async function reopenIncident(
  id: string,
  payload: { actor: string; note?: string },
): Promise<Incident | null> {
  const incident = await requestJson<IncidentApiResponse>(`/${id}/reopen`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })

  return incident
    ? normalizeIncident(incident, getMockIncidentById(id) ?? undefined)
    : null
}

export async function addIncidentNote(
  id: string,
  payload: { author: string; content: string },
): Promise<Incident | null> {
  const incident = await requestJson<IncidentApiResponse>(`/${id}/notes`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return incident
    ? normalizeIncident(incident, getMockIncidentById(id) ?? undefined)
    : null
}

export async function assignIncident(
  id: string,
  payload: { actor: string; assignee: string },
): Promise<Incident | null> {
  const incident = await requestJson<IncidentApiResponse>(`/${id}/assign`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })

  return incident
    ? normalizeIncident(incident, getMockIncidentById(id) ?? undefined)
    : null
}

export async function changeIncidentSeverity(
  id: string,
  payload: { actor: string; severity: Severity },
): Promise<Incident | null> {
  const incident = await requestJson<IncidentApiResponse>(`/${id}/severity`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })

  return incident
    ? normalizeIncident(incident, getMockIncidentById(id) ?? undefined)
    : null
}

export async function loadIncidents(
  options?: LoadIncidentsOptions,
): Promise<IncidentListResult> {
  const mockIncidents = getCurrentDemoIncidents()

  try {
    return {
      incidents: await getIncidents(options),
      source: 'backend',
    }
  } catch {
    return {
      incidents: filterIncidentsByRange(mockIncidents, options?.range),
      source: 'mock',
      warning: INCIDENTS_FALLBACK_MESSAGE,
    }
  }
}

export async function loadIncident(
  id: string,
  fallbackIncident?: Incident,
): Promise<IncidentResult> {
  try {
    return {
      incident: await getIncident(id),
      source: 'backend',
    }
  } catch {
    const incident = fallbackIncident
      ? cloneIncident(fallbackIncident)
      : getMockIncidentById(id)

    if (!incident) {
      throw new IncidentsApiError(`Unable to load incident ${id}.`)
    }

    return {
      incident,
      source: 'mock',
      warning: INCIDENTS_FALLBACK_MESSAGE,
    }
  }
}

export async function resolveIncidentWithFallback(
  incident: Incident,
  payload: { actor: string; note?: string } = { actor: 'OpsMate' },
): Promise<IncidentResult> {
  try {
    const updatedIncident = await resolveIncidentAction(incident.id, payload)

    if (updatedIncident) {
      return {
        incident: updatedIncident,
        source: 'backend',
      }
    }

    return {
      incident: await getIncident(incident.id),
      source: 'backend',
    }
  } catch {
    return {
      incident: createLocallyResolvedIncident(incident, payload.actor, payload.note),
      source: 'mock',
      warning: INCIDENT_RESOLVE_FALLBACK_MESSAGE,
    }
  }
}

export async function acknowledgeIncidentWithFallback(
  incident: Incident,
  payload: { actor: string; note?: string },
): Promise<IncidentResult> {
  try {
    const updatedIncident = await acknowledgeIncident(incident.id, payload)

    if (updatedIncident) {
      return {
        incident: updatedIncident,
        source: 'backend',
      }
    }

    return {
      incident: await getIncident(incident.id),
      source: 'backend',
    }
  } catch {
    return {
      incident: createLocallyAcknowledgedIncident(
        incident,
        payload.actor,
        payload.note,
      ),
      source: 'mock',
      warning: INCIDENT_ACKNOWLEDGE_FALLBACK_MESSAGE,
    }
  }
}

export async function assignIncidentWithFallback(
  incident: Incident,
  payload: { actor: string; assignee: string },
): Promise<IncidentResult> {
  try {
    const updatedIncident = await assignIncident(incident.id, payload)

    if (updatedIncident) {
      return {
        incident: updatedIncident,
        source: 'backend',
      }
    }

    return {
      incident: await getIncident(incident.id),
      source: 'backend',
    }
  } catch (error) {
    if (error instanceof IncidentsApiError && error.status !== undefined) {
      throw error
    }

    assertLocalAssignmentAllowed(incident, payload.assignee)

    return {
      incident: createLocallyAssignedIncident(
        incident,
        payload.actor,
        payload.assignee,
      ),
      source: 'mock',
      warning: INCIDENT_ASSIGN_FALLBACK_MESSAGE,
    }
  }
}

export async function reopenIncidentWithFallback(
  incident: Incident,
  payload: { actor: string; note?: string },
): Promise<IncidentResult> {
  try {
    const updatedIncident = await reopenIncident(incident.id, payload)

    if (updatedIncident) {
      return {
        incident: updatedIncident,
        source: 'backend',
      }
    }

    return {
      incident: await getIncident(incident.id),
      source: 'backend',
    }
  } catch {
    return {
      incident: createLocallyReopenedIncident(incident, payload.actor, payload.note),
      source: 'mock',
      warning: INCIDENT_REOPEN_FALLBACK_MESSAGE,
    }
  }
}

export async function changeIncidentSeverityWithFallback(
  incident: Incident,
  payload: { actor: string; severity: Severity },
): Promise<IncidentResult> {
  try {
    const updatedIncident = await changeIncidentSeverity(incident.id, payload)

    if (updatedIncident) {
      return {
        incident: updatedIncident,
        source: 'backend',
      }
    }

    return {
      incident: await getIncident(incident.id),
      source: 'backend',
    }
  } catch (error) {
    if (error instanceof IncidentsApiError && error.status !== undefined) {
      throw error
    }

    assertLocalSeverityChangeAllowed(incident, payload.severity)

    return {
      incident: createLocallySeverityChangedIncident(
        incident,
        payload.actor,
        payload.severity,
      ),
      source: 'mock',
      warning: INCIDENT_SEVERITY_FALLBACK_MESSAGE,
    }
  }
}

export async function addIncidentNoteWithFallback(
  incident: Incident,
  payload: { author: string; content: string },
): Promise<IncidentResult> {
  try {
    const updatedIncident = await addIncidentNote(incident.id, payload)

    if (updatedIncident) {
      return {
        incident: updatedIncident,
        source: 'backend',
      }
    }

    return {
      incident: await getIncident(incident.id),
      source: 'backend',
    }
  } catch {
    return {
      incident: createLocallyAnnotatedIncident(
        incident,
        payload.author,
        payload.content,
      ),
      source: 'mock',
      warning: INCIDENT_NOTE_FALLBACK_MESSAGE,
    }
  }
}
