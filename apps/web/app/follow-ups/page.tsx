"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ClipboardList, RefreshCw } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { loadIncidents } from "@/lib/api/incidents"
import { aggregateTrackedActionItems } from "@/lib/incident-review-summary"
import {
  collectOpenReviewActionItems,
  isReviewActionDueOverdue,
} from "@/lib/follow-ups"
import {
  incidentSeverityBadgeStyles,
  incidentStatusBadgeStyles,
  majorIncidentBadgeClassName,
} from "@/lib/presentation"
import { cn } from "@/lib/utils"
import type { Incident } from "@/lib/types"

function formatDueDate(dueAt: string | null) {
  if (!dueAt) return "—"
  const parsed = Date.parse(dueAt)
  if (Number.isNaN(parsed)) {
    return dueAt
  }
  return new Date(parsed).toLocaleDateString([], {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export default function FollowUpsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [warning, setWarning] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const openRows = useMemo(
    () => collectOpenReviewActionItems(incidents),
    [incidents],
  )

  const trackedTotals = useMemo(
    () => aggregateTrackedActionItems(incidents),
    [incidents],
  )

  async function refresh() {
    setIsLoading(true)
    setError(null)
    try {
      const result = await loadIncidents()
      setIncidents(result.incidents)
      setWarning(result.warning ?? null)
    } catch {
      setIncidents([])
      setWarning(null)
      setError("Unable to load incidents. Follow-ups could not be refreshed.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  return (
    <AppShell mainClassName="p-6">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Follow-ups
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground/90">
              Open review action items — edit status in each incident&apos;s post-incident review.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={() => void refresh()}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        {warning ? (
          <Alert className="border-border/70 bg-card/70">
            <ClipboardList className="h-4 w-4 text-amber-400" />
            <AlertTitle>Demo mode</AlertTitle>
            <AlertDescription>{warning}</AlertDescription>
          </Alert>
        ) : null}

        {error ? (
          <Alert variant="destructive" className="border-border/70">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <Card className="border-border/80 bg-card/95 shadow-md shadow-black/15">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <ClipboardList className="h-5 w-5 text-muted-foreground" />
              Open review action items
              {!isLoading ? (
                <Badge variant="secondary" className="font-mono text-xs font-normal">
                  {openRows.length}
                </Badge>
              ) : null}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Items with status <span className="font-medium text-foreground">open</span>{" "}
              from <code className="text-xs">review.actionItems</code>
              {!isLoading && trackedTotals.total > 0 ? (
                <span className="mt-2 block text-xs leading-relaxed">
                  <span className="font-medium text-foreground">{trackedTotals.total}</span>{" "}
                  tracked across incidents ·{" "}
                  <span className="text-foreground">{trackedTotals.open}</span> open ·{" "}
                  <span className="text-foreground">{trackedTotals.done}</span> done ·{" "}
                  <span className="text-foreground">{trackedTotals.dropped}</span> dropped
                </span>
              ) : !isLoading ? (
                <span className="mt-2 block text-xs text-muted-foreground">
                  No tracked action items in incident reviews yet.
                </span>
              ) : null}
            </p>
          </CardHeader>
          <CardContent className="px-0 py-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/60 bg-secondary/30 hover:bg-secondary/30">
                    <TableHead className="px-6">Action</TableHead>
                    <TableHead>Incident</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="pr-6">Incident status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow className="border-border/60 hover:bg-transparent">
                      <TableCell
                        colSpan={6}
                        className="px-6 py-12 text-center text-sm text-muted-foreground"
                      >
                        <span className="inline-flex items-center gap-2">
                          <Spinner className="size-4" />
                          Loading follow-ups…
                        </span>
                      </TableCell>
                    </TableRow>
                  ) : openRows.length === 0 ? (
                    <TableRow className="border-border/60 hover:bg-transparent">
                      <TableCell
                        colSpan={6}
                        className="px-6 py-14 text-center text-sm text-muted-foreground"
                      >
                        No open action items. Resolved incidents with items in{" "}
                        <span className="font-medium text-foreground">
                          Post-incident review
                        </span>{" "}
                        will appear here.
                      </TableCell>
                    </TableRow>
                  ) : (
                    openRows.map((row) => {
                      const overdue = isReviewActionDueOverdue(row.actionItem.dueAt)
                      return (
                        <TableRow
                          key={`${row.incidentId}-${row.actionItem.id}`}
                          className={cn(
                            "border-border/60 hover:bg-secondary/35",
                            row.incidentIsMajor && "border-l-4 border-l-rose-500/45",
                            overdue && !row.incidentIsMajor && "border-l-2 border-l-red-500/45",
                          )}
                        >
                        <TableCell className="max-w-[280px] px-6 align-top">
                          <p className="font-medium text-foreground leading-snug">
                            {row.actionItem.title.trim() || (
                              <span className="text-muted-foreground">(No title)</span>
                            )}
                          </p>
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="space-y-1">
                            <Link
                              href={`/incidents?incident=${encodeURIComponent(row.incidentId)}`}
                              className="font-mono text-sm text-primary underline-offset-2 hover:underline"
                            >
                              {row.incidentId}
                            </Link>
                            <p className="max-w-[240px] text-xs leading-snug text-muted-foreground line-clamp-2">
                              {row.incidentTitle}
                            </p>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${incidentSeverityBadgeStyles[row.incidentSeverity]}`}
                              >
                                {row.incidentSeverity}
                              </Badge>
                              {row.incidentIsMajor ? (
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] ${majorIncidentBadgeClassName}`}
                                >
                                  Major
                                </Badge>
                              ) : null}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="align-top text-sm text-muted-foreground">
                          {row.actionItem.owner.trim() || (
                            <span className="text-muted-foreground/60">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell className="align-top text-sm tabular-nums text-muted-foreground">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span>{formatDueDate(row.actionItem.dueAt)}</span>
                            {overdue ? (
                              <Badge
                                variant="outline"
                                className="border-red-500/40 bg-red-500/10 text-[10px] text-red-600 dark:text-red-400"
                              >
                                Overdue
                              </Badge>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          <Badge variant="outline" className="border-border/70 bg-secondary/40">
                            {row.actionItem.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="pr-6 align-top">
                          <Badge
                            variant="outline"
                            className={incidentStatusBadgeStyles[row.incidentStatus]}
                          >
                            {row.incidentStatus}
                          </Badge>
                        </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
