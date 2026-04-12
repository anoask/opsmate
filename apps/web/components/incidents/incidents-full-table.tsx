"use client"

import { MoreHorizontal, User } from "lucide-react"
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  incidentSeverityBadgeStyles,
  incidentStatusBadgeStyles,
  majorIncidentBadgeClassName,
} from "@/lib/presentation"
import { cn } from "@/lib/utils"
import type { Incident } from "@/lib/types"

interface IncidentsFullTableProps {
  incidents: Incident[]
  onSelectIncident: (incident: Incident) => void
}

export function IncidentsFullTable({
  incidents,
  onSelectIncident,
}: IncidentsFullTableProps) {
  if (incidents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-card/50 px-6 py-14 text-center">
        <p className="text-sm font-medium text-foreground">No incidents found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Try adjusting your filters
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/80 bg-card/95 shadow-md shadow-black/15">
      <Table>
        <TableHeader>
          <TableRow className="border-border/60 bg-secondary/30 hover:bg-secondary/30">
            <TableHead className="px-6">ID</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead>Runbook</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead className="w-[56px] pr-6"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {incidents.map((incident) => (
            <TableRow
              key={incident.id}
              className={cn(
                "cursor-pointer border-border/60 hover:bg-secondary/35",
                incident.isMajorIncident && "border-l-2 border-l-rose-500/55",
                !incident.isMajorIncident &&
                  incident.status !== "resolved" &&
                  !incident.assignedTo?.trim() &&
                  "border-l-2 border-l-amber-500/50",
              )}
              onClick={() => onSelectIncident(incident)}
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
              <TableCell className="max-w-[280px] truncate font-medium">
                {incident.title}
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
              <TableCell className="text-muted-foreground">
                {incident.assignedTo ? (
                  <span className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    {incident.assignedTo}
                  </span>
                ) : (
                  <span
                    className={cn(
                      "text-muted-foreground/60",
                      incident.status !== "resolved" &&
                        "font-medium text-amber-700/90 dark:text-amber-400/90",
                    )}
                  >
                    Unassigned
                  </span>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground max-w-[150px] truncate">
                {incident.assignedRunbook || "—"}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {incident.updatedAt}
              </TableCell>
              <TableCell className="pr-6">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation()
                      onSelectIncident(incident)
                    }}>
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                      Assign Runbook
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                      Escalate
                    </DropdownMenuItem>
                    {incident.status !== "resolved" ? (
                      <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                        Mark Resolved
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                        Reopen
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
