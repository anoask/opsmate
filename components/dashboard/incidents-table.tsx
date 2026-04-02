"use client"

import { MoreHorizontal, ExternalLink } from "lucide-react"
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
import { incidents } from "@/lib/mock-data"
import { incidentSeverityBadgeStyles, incidentStatusBadgeStyles } from "@/lib/presentation"

export function IncidentsTable() {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-lg font-semibold">Recent Incidents</CardTitle>
          <p className="text-sm text-muted-foreground">
            Latest alerts requiring attention across connected systems
          </p>
        </div>
        <Button variant="ghost" size="sm" className="h-8 px-2.5 text-muted-foreground">
          View all
          <ExternalLink className="ml-1 h-3 w-3" />
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
              <TableHead>Runbook</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="w-[56px] pr-6"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {incidents.map((incident) => (
              <TableRow
                key={incident.id}
                className="cursor-pointer border-border/60 hover:bg-secondary/35"
              >
                <TableCell className="px-6 font-mono text-sm text-primary">
                  {incident.id}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {incident.source}
                </TableCell>
                <TableCell className="max-w-[250px] truncate font-medium">
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
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
