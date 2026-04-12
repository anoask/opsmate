"use client"

import { useMemo } from "react"
import { BookOpen, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  incidentSeverityBadgeStyles,
  incidentStatusBadgeStyles,
  majorIncidentBadgeClassName,
} from "@/lib/presentation"
import type { Incident, Status } from "@/lib/types"

const BOARD_STATUS_ORDER: Status[] = [
  "open",
  "acknowledged",
  "investigating",
  "resolved",
]

function statusColumnTitle(status: Status) {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function sortByCreatedDesc(a: Incident, b: Incident) {
  return (
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

interface IncidentsStatusBoardProps {
  incidents: Incident[]
  onSelectIncident: (incident: Incident) => void
}

export function IncidentsStatusBoard({
  incidents,
  onSelectIncident,
}: IncidentsStatusBoardProps) {
  const columns = useMemo(() => {
    const byStatus = new Map<Status, Incident[]>()
    for (const s of BOARD_STATUS_ORDER) {
      byStatus.set(s, [])
    }
    for (const incident of incidents) {
      const list = byStatus.get(incident.status)
      if (list) {
        list.push(incident)
      }
    }
    for (const s of BOARD_STATUS_ORDER) {
      byStatus.get(s)?.sort(sortByCreatedDesc)
    }
    return byStatus
  }, [incidents])

  if (incidents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-card/50 px-6 py-14 text-center">
        <p className="text-sm font-medium text-foreground">No incidents found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Try adjusting your filters or view
        </p>
      </div>
    )
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:thin]">
      {BOARD_STATUS_ORDER.map((status) => {
        const columnIncidents = columns.get(status) ?? []
        const majorInColumn = columnIncidents.filter((i) => i.isMajorIncident).length
        return (
          <section
            key={status}
            className="flex w-[min(100%,280px)] shrink-0 flex-col rounded-xl border border-border/80 bg-card/95 shadow-sm shadow-black/10"
          >
            <header className="flex items-center justify-between gap-2 border-b border-border/60 bg-secondary/30 px-3 py-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <Badge
                  variant="outline"
                  className={cn(
                    "shrink-0 text-[10px] uppercase tracking-wide",
                    incidentStatusBadgeStyles[status],
                  )}
                >
                  {statusColumnTitle(status)}
                </Badge>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {columnIncidents.length}
                  {majorInColumn > 0 ? (
                    <span className="ml-1.5 text-rose-400/90" title="Major incidents in this column">
                      · {majorInColumn} major
                    </span>
                  ) : null}
                </span>
              </div>
            </header>
            <div className="max-h-[min(70vh,640px)] space-y-2 overflow-y-auto p-2">
              {columnIncidents.length === 0 ? (
                <p className="py-8 text-center text-xs text-muted-foreground/80">
                  None in this column
                </p>
              ) : (
                columnIncidents.map((incident) => (
                  <button
                    key={incident.id}
                    type="button"
                    aria-label={`Open incident ${incident.id} workspace`}
                    onClick={() => onSelectIncident(incident)}
                    className={cn(
                      "w-full rounded-lg border border-border/60 bg-secondary/20 p-3 text-left transition-colors hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                      incident.isMajorIncident && "border-l-2 border-l-rose-500/55",
                      !incident.isMajorIncident &&
                        incident.status !== "resolved" &&
                        !incident.assignedTo?.trim() &&
                        "border-l-2 border-l-amber-500/50",
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-xs text-primary">
                        {incident.id}
                      </span>
                      {incident.isMajorIncident ? (
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] px-1.5 py-0",
                            majorIncidentBadgeClassName,
                          )}
                        >
                          Major
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-sm font-medium leading-snug text-foreground">
                      {incident.title}
                    </p>
                    {incident.description.trim().length > 0 ? (
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        {incident.description}
                      </p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] capitalize",
                          incidentSeverityBadgeStyles[incident.severity],
                        )}
                      >
                        {incident.severity}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground truncate max-w-full">
                        {incident.source}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-col gap-1 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1.5 min-w-0">
                        <User className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
                        <span
                          className={cn(
                            "truncate",
                            !incident.assignedTo?.trim() &&
                              incident.status !== "resolved" &&
                              "font-medium text-amber-700/90 dark:text-amber-400/90",
                          )}
                        >
                          {incident.assignedTo ?? "Unassigned"}
                        </span>
                      </span>
                      {incident.assignedRunbook ? (
                        <span className="flex items-center gap-1.5 min-w-0">
                          <BookOpen className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
                          <span className="truncate">{incident.assignedRunbook}</span>
                        </span>
                      ) : null}
                      <span className="text-muted-foreground/80">
                        Updated {incident.updatedAt}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}
