import { randomUUID } from 'node:crypto'

import {
  commitStoredIncidentLifecycleMutation,
  getStoredIncident,
  listStoredIncidents,
} from '@/lib/server/incidents/store'
import {
  incidentAssignInputSchema,
  incidentLifecycleActionInputSchema,
  incidentNoteCreateInputSchema,
  type IncidentAssignInput,
  type IncidentListQuery,
  incidentRouteParamsSchema,
  incidentDtoSchema,
  incidentsListDtoSchema,
  type IncidentLifecycleActionInput,
  type IncidentNoteCreateInput,
  type IncidentDto,
} from '@/lib/server/incidents/schema'

type LifecycleTimelineEvent = IncidentDto['timeline'][number] & {
  createdAt: string
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
    primaryTransitionEventId?: string
    expectedCurrentStatus?: IncidentDto['status']
    expectedCurrentAssignedTo?: string | null
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
      events: options.events.map((event) => {
        const isPrimaryTransition = event.id === options.primaryTransitionEventId

        return {
          id: event.id,
          incidentId: incident.id,
          type: event.type,
          actor: event.user ?? null,
          description: event.description,
          createdAt: event.createdAt,
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
    primaryTransitionEventId: event.id,
    expectedCurrentStatus: incident.status,
    fromStatus: incident.status,
    toStatus: 'resolved' as const,
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
  const mutation = createAcknowledgedIncident(incident, parsedInput)

  return persistLifecycleMutation(mutation.incident, {
    events: mutation.events,
    notes: mutation.notes,
    primaryTransitionEventId: mutation.primaryTransitionEventId,
    fromStatus: mutation.fromStatus,
    toStatus: mutation.toStatus,
  })
}

export function assignIncidentById(id: string, input: IncidentAssignInput) {
  const incident = getIncidentById(id)
  const parsedInput = incidentAssignInputSchema.parse(input)
  const mutation = createAssignedIncident(incident, parsedInput)

  return persistLifecycleMutation(mutation.incident, {
    events: mutation.events,
    notes: mutation.notes,
    primaryTransitionEventId: mutation.primaryTransitionEventId,
    expectedCurrentStatus: mutation.expectedCurrentStatus,
    expectedCurrentAssignedTo: mutation.expectedCurrentAssignedTo,
    fromAssignedTo: mutation.fromAssignedTo,
    toAssignedTo: mutation.toAssignedTo,
  })
}

export function resolveIncidentById(
  id: string,
  input?: IncidentLifecycleActionInput,
) {
  const incident = getIncidentById(id)
  const parsedInput = incidentLifecycleActionInputSchema.parse(input ?? {})
  const mutation = createResolvedIncident(incident, parsedInput)

  if (mutation.events.length === 0) {
    return incidentDtoSchema.parse(incident)
  }

  return persistLifecycleMutation(mutation.incident, {
    events: mutation.events,
    notes: mutation.notes,
    primaryTransitionEventId: mutation.primaryTransitionEventId,
    fromStatus: mutation.fromStatus,
    toStatus: mutation.toStatus,
  })
}

export function reopenIncidentById(
  id: string,
  input?: IncidentLifecycleActionInput,
) {
  const incident = getIncidentById(id)
  const parsedInput = incidentLifecycleActionInputSchema.parse(input ?? {})
  const mutation = createReopenedIncident(incident, parsedInput)

  return persistLifecycleMutation(mutation.incident, {
    events: mutation.events,
    notes: mutation.notes,
    primaryTransitionEventId: mutation.primaryTransitionEventId,
    fromStatus: mutation.fromStatus,
    toStatus: mutation.toStatus,
  })
}

export function addIncidentNoteById(
  id: string,
  input: IncidentNoteCreateInput,
) {
  const incident = getIncidentById(id)
  const parsedInput = incidentNoteCreateInputSchema.parse(input)
  const commentMutation = createCommentMutation(
    incident,
    parsedInput.author,
    parsedInput.content,
    new Date(),
  )

  return persistLifecycleMutation(commentMutation.incident, {
    events: commentMutation.events,
    notes: commentMutation.notes,
  })
}
