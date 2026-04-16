"use client"

import { useMemo } from "react"
import Link from "next/link"
import { ArrowRight, ClipboardList, Flag } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import {
  listActiveMajorIncidents,
  countResolvedMajorsPendingReview,
} from "@/lib/dashboard/major-incident-helpers"
import { incidentSeverityBadgeStyles } from "@/lib/presentation"
import { cn } from "@/lib/utils"
import type { Incident } from "@/lib/types"

interface MajorIncidentSpotlightProps {
  incidents: Incident[]
  majorActiveCount: number
  isLoading?: boolean
}

export function MajorIncidentSpotlight({
  incidents,
  majorActiveCount,
  isLoading = false,
}: MajorIncidentSpotlightProps) {
  const activeMajors = useMemo(
    () => listActiveMajorIncidents(incidents, 6),
    [incidents],
  )
  const reviewBacklog = useMemo(
    () => countResolvedMajorsPendingReview(incidents),
    [incidents],
  )

  return (
    <Card className="mb-6 border-rose-500/25 bg-gradient-to-br from-rose-500/[0.06] to-card shadow-sm shadow-black/10">
      <CardHeader className="flex flex-col gap-3 border-b border-border/60 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Flag className="h-5 w-5 text-rose-500" aria-hidden />
            Major incidents
          </CardTitle>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Track open majors; finish post-incident review on resolved majors before context fades.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="border-rose-500/35 bg-card/80" asChild>
            <Link href="/incidents?quick=major-active">
              Active majors
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="border-border/70 bg-card/80" asChild>
            <Link href="/incidents?quick=major-board">
              Major board
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
          {reviewBacklog > 0 ? (
            <Button variant="outline" size="sm" className="border-amber-500/35 bg-amber-500/[0.06]" asChild>
              <Link href="/incidents?quick=major-review">
                <ClipboardList className="mr-1.5 h-3.5 w-3.5" />
                Review backlog ({reviewBacklog})
              </Link>
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {isLoading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Spinner className="size-4" />
            Loading…
          </div>
        ) : majorActiveCount === 0 && reviewBacklog === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">
            No open majors; no resolved majors pending post-incident review.
          </p>
        ) : (
          <div className="space-y-4">
            {majorActiveCount > 0 ? (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground/85">
                  Active — {majorActiveCount} open
                </p>
                <ul className="space-y-2">
                  {activeMajors.map((incident) => (
                    <li key={incident.id}>
                      <Link
                        href={`/incidents?incident=${encodeURIComponent(incident.id)}`}
                        className="group flex flex-col gap-1 rounded-lg border border-border/60 bg-card/60 px-3 py-2.5 transition-colors hover:bg-secondary/40 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-sm text-primary">{incident.id}</span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] capitalize",
                                incidentSeverityBadgeStyles[incident.severity],
                              )}
                            >
                              {incident.severity}
                            </Badge>
                          </div>
                          <p className="truncate text-sm font-medium text-foreground group-hover:underline">
                            {incident.title}
                          </p>
                        </div>
                        <p className="shrink-0 text-xs text-muted-foreground sm:text-right">
                          {incident.assignedTo?.trim() ? (
                            <>Assignee: {incident.assignedTo}</>
                          ) : (
                            <span className="font-medium text-amber-700/90 dark:text-amber-400/90">
                              Unassigned
                            </span>
                          )}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No open major incidents.</p>
            )}
            {reviewBacklog > 0 ? (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/[0.05] px-3 py-2.5 text-sm">
                <span className="font-medium text-foreground">{reviewBacklog} resolved major</span>
                <span className="text-muted-foreground">
                  {" "}
                  still need post-incident review completed.{" "}
                  <Link
                    href="/incidents?quick=major-review"
                    className="text-primary underline-offset-2 hover:underline"
                  >
                    Open filtered list
                  </Link>
                </span>
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
