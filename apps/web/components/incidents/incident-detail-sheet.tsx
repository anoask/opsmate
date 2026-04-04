"use client"

import {
  AlertCircle,
  User,
  BookOpen,
  CheckCircle,
  ArrowUpCircle,
  XCircle,
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import {
  incidentSeverityBadgeStyles,
  incidentStatusBadgeStyles,
  incidentTimelineIconStyles,
} from "@/lib/presentation"
import type { Incident } from "@/lib/types"

function formatCategoryLabel(category: Incident["category"]) {
  return category.charAt(0).toUpperCase() + category.slice(1)
}

interface IncidentDetailSheetProps {
  incident: Incident | null
  open: boolean
  onOpenChange: (open: boolean) => void
  isLoading?: boolean
  error?: string | null
  isResolving?: boolean
  onResolve?: () => void
}

export function IncidentDetailSheet({
  incident,
  open,
  onOpenChange,
  isLoading = false,
  error = null,
  isResolving = false,
  onResolve,
}: IncidentDetailSheetProps) {
  if (!incident) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl bg-card border-border">
        <SheetHeader className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-mono text-primary">{incident.id}</p>
              <SheetTitle className="text-xl font-semibold text-foreground">
                {incident.title}
              </SheetTitle>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={incidentSeverityBadgeStyles[incident.severity]}>
              {incident.severity}
            </Badge>
            <Badge variant="outline" className={incidentStatusBadgeStyles[incident.status]}>
              {incident.status}
            </Badge>
            <Badge variant="outline" className="border-border/70 bg-secondary/40 text-muted-foreground">
              {formatCategoryLabel(incident.category)}
            </Badge>
            <span className="text-sm text-muted-foreground">
              via {incident.source}
            </span>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-200px)] mt-6 pr-4">
          <div className="space-y-6">
            {isLoading && (
              <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-secondary/35 px-3 py-2.5 text-sm text-muted-foreground">
                <Spinner className="size-4" />
                Refreshing incident details...
              </div>
            )}

            {error && (
              <Alert className="border-border/70 bg-card/70">
                <AlertCircle className="h-4 w-4 text-amber-400" />
                <AlertTitle>Incident sync notice</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Description
              </h3>
              <p className="text-sm text-foreground leading-relaxed">
                {incident.description}
              </p>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Assigned To</p>
                <p className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  {incident.assignedTo || "Unassigned"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Runbook</p>
                <p className="text-sm font-medium flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  {incident.assignedRunbook || "None"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm text-foreground">
                  {new Date(incident.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Last Updated</p>
                <p className="text-sm text-foreground">{incident.updatedAt}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Category</p>
                <p className="text-sm text-foreground">
                  {formatCategoryLabel(incident.category)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Resolved</p>
                <p className="text-sm text-foreground">
                  {incident.resolvedAt
                    ? new Date(incident.resolvedAt).toLocaleString()
                    : "Not resolved"}
                </p>
              </div>
            </div>

            <Separator className="bg-border" />

            {/* Timeline */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                Timeline
              </h3>
              <div className="space-y-3">
                {incident.timeline.map((event, index) => (
                  <div key={event.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                        {(() => {
                          const iconMeta = incidentTimelineIconStyles[event.type]
                          const Icon = iconMeta.icon

                          return <Icon className={`h-4 w-4 ${iconMeta.className}`} />
                        })()}
                      </div>
                      {index < incident.timeline.length - 1 && (
                        <div className="w-px flex-1 bg-border mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm text-foreground">
                        {event.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {event.timestamp}
                        {event.user && ` - ${event.user}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator className="bg-border" />

            {/* Notes */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                Notes & Comments
              </h3>
              {incident.notes.length > 0 ? (
                <div className="space-y-3">
                  {incident.notes.map((note) => (
                    <div
                      key={note.id}
                      className="rounded-lg bg-secondary/50 p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{note.user}</p>
                        <p className="text-xs text-muted-foreground">
                          {note.timestamp}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {note.content}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No notes yet</p>
              )}

              {/* Add Note */}
              <div className="space-y-2 pt-2">
                <Textarea
                  placeholder="Add a note..."
                  className="bg-secondary border-border min-h-[80px] resize-none"
                />
                <Button size="sm" className="w-full">
                  Add Note
                </Button>
              </div>
            </div>

            <Separator className="bg-border" />

            {/* Actions */}
            <div className="flex gap-2">
              {incident.status !== "resolved" && (
                <>
                  <Button
                    className="flex-1"
                    variant="default"
                    disabled={isResolving}
                    onClick={onResolve}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {isResolving ? "Resolving..." : "Resolve"}
                  </Button>
                  <Button className="flex-1" variant="outline">
                    <ArrowUpCircle className="mr-2 h-4 w-4" />
                    Escalate
                  </Button>
                </>
              )}
              {incident.status === "resolved" && (
                <Button className="flex-1" variant="outline">
                  <XCircle className="mr-2 h-4 w-4" />
                  Reopen
                </Button>
              )}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
