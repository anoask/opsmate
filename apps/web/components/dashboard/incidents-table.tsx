"use client"

import { MoreHorizontal, ExternalLink, Flag, User } from "lucide-react"
import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  incidentSeverityBadgeStyles,
  incidentStatusBadgeStyles,
  majorIncidentBadgeClassName,
} from "@/lib/presentation"
import { cn } from "@/lib/utils"
import type { Incident } from "@/lib/types"

interface IncidentsTableProps {
  incidents: Incident[]
  isLoading?: boolean
}

export function IncidentsTable({
  incidents,
  isLoading = false,
}: IncidentsTableProps) {
  const majorInList = incidents.filter((i) => i.isMajorIncident).length
  const unassignedActiveInList = incidents.filter(
    (i) => i.status !== "resolved" && !i.assignedTo?.trim(),
  ).length

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-lg font-semibold">Recent incidents</CardTitle>
          <p className="text-sm text-muted-foreground">
            Last five by time — full queue in Incidents
            {majorInList > 0 ? (
              <span className="text-foreground/80">
                {" "}
                ·{" "}
                <span className="inline-flex items-center gap-1">
                  <Flag className="inline h-3.5 w-3.5 text-rose-500" aria-hidden />
                  {majorInList} major
                </span>
              </span>
            ) : null}
            {unassignedActiveInList > 0 ? (
              <span className="text-foreground/80">
                {" "}
                ·{" "}
                <span className="inline-flex items-center gap-1 text-amber-700/90 dark:text-amber-400/85">
                  <User className="inline h-3.5 w-3.5" aria-hidden />
                  {unassignedActiveInList} need assignee
                </span>
              </span>
            ) : null}
          </p>
        </div>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="h-8 px-2.5 text-muted-foreground"
        >
          <Link href="/incidents">
            View all
            <ExternalLink className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="px-0 py-0">
        <Table>
          <TableHeader>
            <TableRow className="border-border/60 bg-secondary/30 hover:bg-transparent">
              <TableHead className="px-6">ID</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead>Runbook</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="w-[56px] pr-6"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow className="border-border/60 hover:bg-transparent">
                <TableCell
                  colSpan={9}
                  className="px-6 py-10 text-center text-sm text-muted-foreground"
                >
                  Loading…
                </TableCell>
              </TableRow>
            ) : incidents.length === 0 ? (
              <TableRow className="border-border/60 hover:bg-transparent">
                <TableCell
                  colSpan={9}
                  className="px-6 py-10 text-center text-sm text-muted-foreground"
                >
                  No incidents in range.
                </TableCell>
              </TableRow>
            ) : (
              incidents.map((incident) => (
                (() => {
                  const isUnassignedHighRisk =
                    !incident.isMajorIncident &&
                    incident.status !== "resolved" &&
                    !incident.assignedTo?.trim() &&
                    (incident.severity === "critical" || incident.severity === "high")
                  return (
                <TableRow
                  key={incident.id}
                  className={cn(
                    "cursor-pointer border-border/60 hover:bg-secondary/35",
                    incident.isMajorIncident && "border-l-2 border-l-rose-500/55",
                    isUnassignedHighRisk && "border-l-2 border-l-red-500/55 bg-red-500/[0.03]",
                    !incident.isMajorIncident &&
                      !isUnassignedHighRisk &&
                      incident.status !== "resolved" &&
                      !incident.assignedTo?.trim() &&
                      "border-l-2 border-l-amber-500/50",
                  )}
                >
                  <TableCell className="px-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm text-primary">{incident.id}</span>
                      {incident.isMajorIncident ? (
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${majorIncidentBadgeClassName}`}
                        >
                          Major
                        </Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {incident.source}
                  </TableCell>
                  <TableCell className="max-w-[250px] truncate font-medium">
                    {incident.title}
                    {isUnassignedHighRisk ? (
                      <Badge
                        variant="outline"
                        className="ml-2 h-5 border-red-500/35 text-[10px] text-red-600 dark:text-red-400"
                      >
                        Unassigned high risk
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={incidentSeverityBadgeStyles[incident.severity]}
                    >
                      {incident.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={incidentStatusBadgeStyles[incident.status]}
                    >
                      {incident.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[140px] text-muted-foreground text-sm">
                    {incident.assignedTo?.trim() ? (
                      <span className="flex items-center gap-1.5 truncate">
                        <User className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        <span className="truncate">{incident.assignedTo}</span>
                      </span>
                    ) : (
                      <span
                        className={cn(
                          "text-muted-foreground/70",
                          incident.status !== "resolved" &&
                            "font-medium text-amber-700/90 dark:text-amber-400/90",
                        )}
                      >
                        Unassigned
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {incident.assignedRunbook || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {incident.updatedAt}
                  </TableCell>
                  <TableCell className="pr-6">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Assign Runbook</DropdownMenuItem>
                        <DropdownMenuItem>Escalate</DropdownMenuItem>
                        <DropdownMenuItem>Mark Resolved</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
                  )
                })()
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
