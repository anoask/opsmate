import { incidents as templateIncidents } from '@/lib/mock-data'
import type { Incident } from '@/lib/types'

const DEMO_RECENCY_OFFSET_MS = 2 * 60 * 1000

function cloneIncident(incident: Incident): Incident {
  return {
    ...incident,
    timeline: incident.timeline.map((event) => ({ ...event })),
    notes: incident.notes.map((note) => ({ ...note })),
  }
}

function getTemplateAnchorTimestamp(incidents: Incident[]) {
  return incidents.reduce((latestTimestamp, incident) => {
    const createdAt = new Date(incident.createdAt).getTime()
    const resolvedAt = incident.resolvedAt
      ? new Date(incident.resolvedAt).getTime()
      : 0

    return Math.max(latestTimestamp, createdAt, resolvedAt)
  }, 0)
}

function shiftIsoTimestamp(value: string | null, deltaMs: number) {
  if (!value) {
    return null
  }

  const timestamp = new Date(value).getTime()

  if (Number.isNaN(timestamp)) {
    return value
  }

  return new Date(timestamp + deltaMs).toISOString()
}

function shiftDisplayTime(
  value: string,
  referenceIsoTimestamp: string,
  deltaMs: number,
) {
  const match = value.match(/^(\d{2}):(\d{2})$/)

  if (!match) {
    return value
  }

  const referenceDate = new Date(referenceIsoTimestamp)

  if (Number.isNaN(referenceDate.getTime())) {
    return value
  }

  referenceDate.setUTCHours(Number(match[1]), Number(match[2]), 0, 0)

  return new Date(referenceDate.getTime() + deltaMs).toLocaleTimeString([], {
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
  })
}

export function getCurrentDemoIncidents(now = new Date()) {
  const anchorTimestamp = getTemplateAnchorTimestamp(templateIncidents)
  const targetAnchorTimestamp = now.getTime() - DEMO_RECENCY_OFFSET_MS
  const deltaMs = targetAnchorTimestamp - anchorTimestamp

  return templateIncidents.map((incident) => {
    const clonedIncident = cloneIncident(incident)
    const createdAt = shiftIsoTimestamp(clonedIncident.createdAt, deltaMs)

    return {
      ...clonedIncident,
      createdAt: createdAt ?? clonedIncident.createdAt,
      resolvedAt: shiftIsoTimestamp(clonedIncident.resolvedAt, deltaMs),
      timeline: clonedIncident.timeline.map((event) => ({
        ...event,
        timestamp: shiftDisplayTime(event.timestamp, incident.createdAt, deltaMs),
      })),
      notes: clonedIncident.notes.map((note) => ({
        ...note,
        timestamp: shiftDisplayTime(note.timestamp, incident.createdAt, deltaMs),
      })),
    }
  })
}
