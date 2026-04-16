"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  AlertCircle,
  Bell,
  BookOpen,
  CheckCircle,
  ClipboardList,
  Flag,
  History,
  ListChecks,
  Play,
  Trash2,
  User,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Spinner } from "@/components/ui/spinner"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  getActionItemProgress,
  hasCompletedReviewWithOpenActions,
  actionItemAddressedFraction,
} from "@/lib/incident-review-summary"
import {
  incidentSeverityBadgeStyles,
  incidentStatusBadgeStyles,
  incidentTimelineEventTypeLabels,
  incidentTimelineIconStyles,
  majorIncidentBadgeClassName,
  runbookExecutionStatusMeta,
} from "@/lib/presentation"
import { cn } from "@/lib/utils"
import type {
  Incident,
  IncidentReview,
  IncidentReviewActionItem,
  IncidentReviewActionItemStatus,
  IncidentReviewStatus,
  IncidentRunbookExecutionContext,
  IncidentWorkspaceEnrichment,
  RunbookExecutionStatus,
  Severity,
} from "@/lib/types"

function formatCategoryLabel(category: Incident["category"]) {
  return category.charAt(0).toUpperCase() + category.slice(1)
}

function formatSeverityLabel(severity: Severity) {
  return severity.charAt(0).toUpperCase() + severity.slice(1)
}

function formatExecutionTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleString([], {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
  })
}

const REVIEW_STATUS_OPTIONS: { value: IncidentReviewStatus; label: string }[] = [
  { value: "not_started", label: "Not started" },
  { value: "draft", label: "Draft" },
  { value: "completed", label: "Completed" },
]

const ACTION_ITEM_STATUS_OPTIONS: {
  value: IncidentReviewActionItemStatus
  label: string
}[] = [
  { value: "open", label: "Open" },
  { value: "done", label: "Done" },
  { value: "dropped", label: "Dropped" },
]

function createEmptyReviewActionItem(): IncidentReviewActionItem {
  return {
    id: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    title: "",
    owner: "",
    status: "open",
    dueAt: null,
  }
}

function formatWorkspaceTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleString([], {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
  })
}

interface IncidentDetailSheetProps {
  incident: Incident | null
  open: boolean
  onOpenChange: (open: boolean) => void
  isLoading?: boolean
  error?: string | null
  isAcknowledging?: boolean
  isAssigning?: boolean
  isChangingSeverity?: boolean
  isResolving?: boolean
  isReopening?: boolean
  isAddingNote?: boolean
  isSavingReview?: boolean
  isTogglingMajor?: boolean
  availableAssignees?: string[]
  availableSeverities?: Severity[]
  onAcknowledge?: () => void
  onAssign?: (assignee: string) => void
  onChangeSeverity?: (severity: Severity) => void
  onResolve?: () => void
  onReopen?: () => void
  onAddNote?: (content: string) => void | Promise<void>
  onSaveReview?: (review: IncidentReview) => void | Promise<void>
  onToggleMajor?: (nextMajor: boolean) => void | Promise<void>
  onStartRunbookExecution?: () => void | Promise<void>
  isStartingRunbookExecution?: boolean
  runbookExecutionContext?: IncidentRunbookExecutionContext | null
  isRunbookExecutionLoading?: boolean
  onRefreshRunbookExecution?: () => void | Promise<void>
  onPatchRunbookExecution?: (input: {
    runbookId: string
    executionId: string
    completedStepIds?: string[]
    status?: RunbookExecutionStatus
  }) => void | Promise<void>
  isPatchingRunbookExecution?: boolean
  workspaceEnrichmentLive?: boolean
  workspaceEnrichment?: IncidentWorkspaceEnrichment | null
  isWorkspaceEnrichmentLoading?: boolean
  workspaceEnrichmentError?: string | null
  /** When the assignee list came from the live users directory, link to Team for context. */
  showTeamOwnershipHint?: boolean
  canMutateIncidents?: boolean
  canMutateRunbookExecution?: boolean
}

export function IncidentDetailSheet({
  incident,
  open,
  onOpenChange,
  isLoading = false,
  error = null,
  isAcknowledging = false,
  isAssigning = false,
  isChangingSeverity = false,
  isResolving = false,
  isReopening = false,
  isAddingNote = false,
  isSavingReview = false,
  isTogglingMajor = false,
  availableAssignees = [],
  availableSeverities = [],
  onAcknowledge,
  onAssign,
  onChangeSeverity,
  onResolve,
  onReopen,
  onAddNote,
  onSaveReview,
  onToggleMajor,
  onStartRunbookExecution,
  isStartingRunbookExecution = false,
  runbookExecutionContext = null,
  isRunbookExecutionLoading = false,
  onRefreshRunbookExecution,
  onPatchRunbookExecution,
  isPatchingRunbookExecution = false,
  workspaceEnrichmentLive = false,
  workspaceEnrichment = null,
  isWorkspaceEnrichmentLoading = false,
  workspaceEnrichmentError = null,
  showTeamOwnershipHint = false,
  canMutateIncidents = true,
  canMutateRunbookExecution = true,
}: IncidentDetailSheetProps) {
  const [noteInput, setNoteInput] = useState("")
  const [reviewValidationError, setReviewValidationError] = useState<string | null>(null)
  const [selectedAssignee, setSelectedAssignee] = useState(incident?.assignedTo ?? "")
  const [selectedSeverity, setSelectedSeverity] = useState<Severity>(
    incident?.severity ?? "medium",
  )
  const [reviewDraft, setReviewDraft] = useState<IncidentReview>({
    summary: "",
    rootCause: "",
    followUps: "",
    status: "not_started",
    actionItems: [],
  })

  const reviewActionItemsKey = incident
    ? JSON.stringify(incident.review.actionItems ?? [])
    : ""

  const reviewSyncKey = useMemo(
    () => {
      if (!incident) {
        return ""
      }
      return [
        incident.id,
        incident.review.summary,
        incident.review.rootCause,
        incident.review.followUps,
        incident.review.status,
        reviewActionItemsKey,
      ].join("|")
    },
    // Granular deps match the prior useEffect; omitting `incident` keeps keys in sync when review fields change in place.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      incident?.id,
      incident?.review.summary,
      incident?.review.rootCause,
      incident?.review.followUps,
      incident?.review.status,
      reviewActionItemsKey,
    ],
  )

  const [prevReviewSyncKey, setPrevReviewSyncKey] = useState("")
  if (reviewSyncKey !== prevReviewSyncKey) {
    setPrevReviewSyncKey(reviewSyncKey)
    if (incident) {
      setReviewDraft({
        ...incident.review,
        actionItems: incident.review.actionItems.map((item) => ({ ...item })),
      })
      setReviewValidationError(null)
    }
  }

  if (!incident) return null

  const reviewItemProgress = getActionItemProgress(reviewDraft)
  const reviewAddressedPct = Math.round(actionItemAddressedFraction(reviewDraft) * 100)
  const reviewStatusLabel =
    REVIEW_STATUS_OPTIONS.find((o) => o.value === reviewDraft.status)?.label ??
    reviewDraft.status
  const hasReviewSummary = reviewDraft.summary.trim().length > 0
  const hasReviewRootCause = reviewDraft.rootCause.trim().length > 0
  const hasReviewFollowUps = reviewDraft.followUps.trim().length > 0
  const hasReviewActionItems = reviewDraft.actionItems.length > 0
  const canMarkReviewCompleted =
    hasReviewSummary &&
    hasReviewRootCause &&
    (hasReviewFollowUps || hasReviewActionItems)

  async function handleAddNote() {
    const content = noteInput.trim()

    if (!content || !onAddNote) {
      return
    }

    await Promise.resolve(onAddNote(content))
    setNoteInput("")
  }

  async function handleAssign() {
    const assignee = selectedAssignee.trim()

    if (!assignee || !onAssign) {
      return
    }

    await Promise.resolve(onAssign(assignee))
  }

  async function handleChangeSeverity() {
    if (!onChangeSeverity || !selectedSeverity) {
      return
    }

    await Promise.resolve(onChangeSeverity(selectedSeverity))
  }

  async function handleSaveReview() {
    if (!onSaveReview) {
      return
    }

    if (reviewDraft.status === "completed" && !canMarkReviewCompleted) {
      setReviewValidationError(
        "To mark completed, fill summary and root cause/fix, then add follow-up notes or at least one action item.",
      )
      return
    }

    setReviewValidationError(null)
    await Promise.resolve(onSaveReview(reviewDraft))
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        key={`${incident.id}-${incident.severity}-${open ? "open" : "closed"}`}
        className={cn(
          "w-full sm:max-w-xl bg-card border-border",
          incident.isMajorIncident && "border-l-4 border-l-rose-500/55",
        )}
      >
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
            {incident.isMajorIncident ? (
              <Badge
                variant="outline"
                className={`inline-flex items-center gap-1 ${majorIncidentBadgeClassName}`}
              >
                <Flag className="h-3 w-3" aria-hidden />
                Major
              </Badge>
            ) : null}
            {incident.isMajorIncident &&
            incident.status === "resolved" &&
            incident.review.status !== "completed" ? (
              <Badge
                variant="outline"
                className="border-amber-500/40 bg-amber-500/10 text-[10px] text-amber-800 dark:text-amber-200"
              >
                Review open
              </Badge>
            ) : null}
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
                Loading…
              </div>
            )}

            {error && (
              <Alert className="border-border/70 bg-card/70">
                <AlertCircle className="h-4 w-4 text-amber-400" />
                <AlertTitle>Couldn’t refresh</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {(!canMutateIncidents || !canMutateRunbookExecution) && (
              <Alert className="border-border/70 bg-secondary/40">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <AlertTitle className="text-sm">Read-only</AlertTitle>
                <AlertDescription className="text-xs leading-relaxed">
                  {!canMutateIncidents
                    ? "Your role can’t change incidents. "
                    : null}
                  {!canMutateRunbookExecution
                    ? "Your role can’t update runbook steps. "
                    : null}
                  Use <span className="font-medium text-foreground">Acting as</span> in the header
                  to switch to engineer or admin.
                </AlertDescription>
              </Alert>
            )}

            {incident.isMajorIncident && (
              <div className="flex items-start gap-2 rounded-lg border border-rose-500/35 bg-rose-500/[0.07] px-3 py-2.5 text-sm">
                <Flag className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" aria-hidden />
                <div className="min-w-0 space-y-0.5">
                  <p className="font-medium text-foreground">Major incident</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Expect wider coordination and Slack fan-out; linked ingests and notify rows show
                    below.
                  </p>
                </div>
              </div>
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
              <div className="col-span-2 flex flex-col gap-2 rounded-lg border border-border/60 bg-secondary/25 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <Flag className="h-4 w-4 shrink-0 text-rose-400" aria-hidden />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Major incident</p>
                    <p className="text-[11px] text-muted-foreground/90">
                      {incident.isMajorIncident
                        ? "Flagged for broader visibility and coordination."
                        : "Not flagged. Use when customer- or org-wide impact is significant."}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                  disabled={
                    !canMutateIncidents ||
                    isTogglingMajor ||
                    !onToggleMajor
                  }
                  onClick={() =>
                    void onToggleMajor?.(!incident.isMajorIncident)
                  }
                >
                  {isTogglingMajor
                    ? "Updating…"
                    : incident.isMajorIncident
                      ? "Clear major flag"
                      : "Mark as major"}
                </Button>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Assignee</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{incident.assignedTo || "Unassigned"}</span>
                  </div>
                  <div className="flex gap-2">
                    <Select
                      value={selectedAssignee}
                      onValueChange={setSelectedAssignee}
                      disabled={
                        !canMutateIncidents ||
                        isAssigning ||
                        incident.status === "resolved"
                      }
                    >
                      <SelectTrigger className="h-9 bg-secondary border-border">
                        <SelectValue placeholder="Choose assignee" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableAssignees.map((assignee) => (
                          <SelectItem key={assignee} value={assignee}>
                            {assignee}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={
                        !canMutateIncidents ||
                        isAssigning ||
                        incident.status === "resolved" ||
                        selectedAssignee.trim().length === 0 ||
                        selectedAssignee === (incident.assignedTo ?? "")
                      }
                      onClick={() => void handleAssign()}
                    >
                      {isAssigning
                        ? "Saving…"
                        : incident.assignedTo
                          ? "Reassign"
                          : "Assign"}
                    </Button>
                  </div>
                  {showTeamOwnershipHint ? (
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      Roster from{" "}
                      <Link
                        href="/team"
                        className="text-primary underline-offset-2 hover:underline"
                      >
                        Team
                      </Link>
                      .
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Runbook</p>
                <div className="space-y-2">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    {incident.assignedRunbook || "None"}
                  </p>
                  {incident.assignedRunbook && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={
                        !canMutateRunbookExecution ||
                        isStartingRunbookExecution ||
                        incident.status === "resolved" ||
                        !onStartRunbookExecution
                      }
                      onClick={() => void onStartRunbookExecution?.()}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      {isStartingRunbookExecution ? "Starting…" : "Start execution"}
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Severity</p>
                <div className="space-y-2">
                  <Badge
                    variant="outline"
                    className={incidentSeverityBadgeStyles[incident.severity]}
                  >
                    {incident.severity}
                  </Badge>
                  <div className="flex gap-2">
                    <Select
                      value={selectedSeverity}
                      onValueChange={(value) => setSelectedSeverity(value as Severity)}
                      disabled={
                        !canMutateIncidents ||
                        isChangingSeverity ||
                        incident.status === "resolved"
                      }
                    >
                      <SelectTrigger className="h-9 bg-secondary border-border">
                        <SelectValue placeholder="Severity" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSeverities.map((severity) => (
                          <SelectItem key={severity} value={severity}>
                            {formatSeverityLabel(severity)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={
                        !canMutateIncidents ||
                        isChangingSeverity ||
                        incident.status === "resolved" ||
                        selectedSeverity === incident.severity
                      }
                      onClick={() => void handleChangeSeverity()}
                    >
                      {isChangingSeverity ? "Updating…" : "Apply severity"}
                    </Button>
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm text-foreground">
                  {new Date(incident.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Updated</p>
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

            {incident.status === "resolved" ? (
              <div className="space-y-3 rounded-lg border border-border/60 bg-secondary/25 p-3">
                {incident.isMajorIncident && incident.review.status !== "completed" ? (
                  <Alert className="border-amber-500/35 bg-amber-500/[0.06]">
                    <ClipboardList className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <AlertTitle className="text-sm">Complete post-incident review</AlertTitle>
                    <AlertDescription className="text-xs leading-relaxed">
                      Record summary, root cause, and follow-ups while context is fresh; mark review
                      completed when done.
                    </AlertDescription>
                  </Alert>
                ) : null}
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" />
                    Post-incident review
                  </h3>
                </div>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Short recap for leads; timeline and notes above are the live record. Open action
                  items also list on{" "}
                  <Link
                    href="/follow-ups"
                    className="text-primary underline-offset-2 hover:underline"
                  >
                    Follow-ups
                  </Link>
                  .
                </p>
                <div className="space-y-2 rounded-md border border-border/50 bg-card/40 px-3 py-2.5">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Review
                    </span>
                    <Badge variant="outline" className="text-[10px] border-border/70">
                      {reviewStatusLabel}
                    </Badge>
                    {reviewItemProgress.total > 0 ? (
                      <span className="text-xs text-muted-foreground">
                        <span className="font-medium tabular-nums text-foreground">
                          {reviewItemProgress.open}
                        </span>{" "}
                        open
                        <span className="mx-1.5 text-border">·</span>
                        <span className="tabular-nums">{reviewItemProgress.done}</span> done
                        <span className="mx-1.5 text-border">·</span>
                        <span className="tabular-nums">{reviewItemProgress.dropped}</span>{" "}
                        dropped
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        No action items
                      </span>
                    )}
                  </div>
                  {reviewItemProgress.total > 0 ? (
                    <div className="space-y-1">
                      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className="rounded-full bg-emerald-500/65 transition-[width]"
                          style={{ width: `${reviewAddressedPct}%` }}
                        />
                      </div>
                      <p className="text-[10px] leading-snug text-muted-foreground">
                        {reviewAddressedPct}% items closed (done or dropped)
                      </p>
                    </div>
                  ) : null}
                  {reviewDraft.status !== "completed" ? (
                    <p className="text-[10px] leading-relaxed text-muted-foreground">
                      {!reviewDraft.summary.trim() ? (
                        <span className="text-amber-700/85 dark:text-amber-400/90">
                          Summary missing.{" "}
                        </span>
                      ) : null}
                      {!reviewDraft.rootCause.trim() ? (
                        <span className="text-amber-700/85 dark:text-amber-400/90">
                          Root cause / fix missing.{" "}
                        </span>
                      ) : null}
                      {reviewDraft.summary.trim() && reviewDraft.rootCause.trim() ? (
                        <span className="text-emerald-700/90 dark:text-emerald-400/85">
                          Summary and root cause filled.
                        </span>
                      ) : null}
                    </p>
                  ) : null}
                </div>
                {hasCompletedReviewWithOpenActions(reviewDraft) ? (
                  <Alert className="border-amber-500/35 bg-amber-500/[0.06]">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    <AlertTitle className="text-sm">Review closed; items still open</AlertTitle>
                    <AlertDescription className="text-xs leading-relaxed">
                      Review is completed but{" "}
                      <span className="font-medium text-foreground">
                        {reviewItemProgress.open}
                      </span>{" "}
                      action item(s) remain open. They stay on Follow-ups until done or dropped.
                    </AlertDescription>
                  </Alert>
                ) : null}
                {reviewDraft.status !== "completed" &&
                reviewItemProgress.total > 0 &&
                reviewItemProgress.open === 0 ? (
                  <Alert className="border-border/60 bg-secondary/35">
                    <ListChecks className="h-4 w-4 text-muted-foreground" />
                    <AlertTitle className="text-sm">All items closed</AlertTitle>
                    <AlertDescription className="text-xs leading-relaxed">
                      Every action item is done or dropped. When narrative is ready, mark review
                      completed.
                    </AlertDescription>
                  </Alert>
                ) : null}
                {!canMarkReviewCompleted ? (
                  <Alert className="border-border/60 bg-secondary/35">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <AlertTitle className="text-sm">Completion requires minimum fields</AlertTitle>
                    <AlertDescription className="text-xs leading-relaxed">
                      Add summary, root cause/fix, and either follow-up notes or at least one action item.
                    </AlertDescription>
                  </Alert>
                ) : null}
                {reviewValidationError ? (
                  <Alert className="border-amber-500/35 bg-amber-500/[0.06]">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    <AlertDescription className="text-xs leading-relaxed">
                      {reviewValidationError}
                    </AlertDescription>
                  </Alert>
                ) : null}
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Select
                    value={reviewDraft.status}
                    onValueChange={(value) => {
                      setReviewValidationError(null)
                      setReviewDraft((prev) => ({
                        ...prev,
                        status: value as IncidentReviewStatus,
                      }))
                    }}
                    disabled={!canMutateIncidents || isSavingReview}
                  >
                    <SelectTrigger className="h-9 bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REVIEW_STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">Summary</p>
                  <Textarea
                    className="min-h-[72px] bg-secondary border-border text-sm"
                    value={reviewDraft.summary}
                    onChange={(e) =>
                      setReviewDraft((prev) => ({ ...prev, summary: e.target.value }))
                    }
                    disabled={!canMutateIncidents || isSavingReview}
                    placeholder="Customer impact, scope, timeline (short)…"
                  />
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">Root cause & resolution</p>
                  <Textarea
                    className="min-h-[88px] bg-secondary border-border text-sm"
                    value={reviewDraft.rootCause}
                    onChange={(e) =>
                      setReviewDraft((prev) => ({ ...prev, rootCause: e.target.value }))
                    }
                    disabled={!canMutateIncidents || isSavingReview}
                    placeholder="Cause, mitigation, permanent fix…"
                  />
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">Notes (optional)</p>
                  <Textarea
                    className="min-h-[72px] bg-secondary border-border text-sm"
                    value={reviewDraft.followUps}
                    onChange={(e) =>
                      setReviewDraft((prev) => ({ ...prev, followUps: e.target.value }))
                    }
                    disabled={!canMutateIncidents || isSavingReview}
                    placeholder="Links, tickets, context (tracked items are below)…"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">Action items</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      disabled={!canMutateIncidents || isSavingReview}
                      onClick={() =>
                        setReviewDraft((prev) => ({
                          ...prev,
                          actionItems: [
                            ...prev.actionItems,
                            createEmptyReviewActionItem(),
                          ],
                        }))
                      }
                    >
                      Add item
                    </Button>
                  </div>
                  {reviewDraft.actionItems.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground">
                      None yet—add rows for task, owner, status, due.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {reviewDraft.actionItems.map((item) => (
                        <div
                          key={item.id}
                          className="space-y-2 rounded-md border border-border/50 bg-card/50 p-2.5"
                        >
                          <div className="flex gap-2">
                            <Input
                              className="h-8 flex-1 bg-secondary border-border text-sm"
                              value={item.title}
                              onChange={(e) => {
                                const title = e.target.value
                                setReviewDraft((prev) => ({
                                  ...prev,
                                  actionItems: prev.actionItems.map((row) =>
                                    row.id === item.id ? { ...row, title } : row,
                                  ),
                                }))
                              }}
                              disabled={!canMutateIncidents || isSavingReview}
                              placeholder="Task"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0 text-muted-foreground"
                              disabled={!canMutateIncidents || isSavingReview}
                              onClick={() =>
                                setReviewDraft((prev) => ({
                                  ...prev,
                                  actionItems: prev.actionItems.filter(
                                    (row) => row.id !== item.id,
                                  ),
                                }))
                              }
                              aria-label="Remove action item"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                            <div className="space-y-1">
                              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                Owner
                              </p>
                              <Input
                                className="h-8 bg-secondary border-border text-sm"
                                value={item.owner}
                                onChange={(e) => {
                                  const owner = e.target.value
                                  setReviewDraft((prev) => ({
                                    ...prev,
                                    actionItems: prev.actionItems.map((row) =>
                                      row.id === item.id ? { ...row, owner } : row,
                                    ),
                                  }))
                                }}
                                disabled={!canMutateIncidents || isSavingReview}
                                placeholder="Name"
                                list={`assignee-hints-${incident.id}`}
                              />
                              <datalist id={`assignee-hints-${incident.id}`}>
                                {availableAssignees.map((name) => (
                                  <option key={name} value={name} />
                                ))}
                              </datalist>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                Status
                              </p>
                              <Select
                                value={item.status}
                                onValueChange={(value) =>
                                  setReviewDraft((prev) => ({
                                    ...prev,
                                    actionItems: prev.actionItems.map((row) =>
                                      row.id === item.id
                                        ? {
                                            ...row,
                                            status: value as IncidentReviewActionItemStatus,
                                          }
                                        : row,
                                    ),
                                  }))
                                }
                                disabled={!canMutateIncidents || isSavingReview}
                              >
                                <SelectTrigger className="h-8 bg-secondary border-border text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {ACTION_ITEM_STATUS_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                Due
                              </p>
                              <Input
                                type="date"
                                className="h-8 bg-secondary border-border text-sm"
                                value={item.dueAt ?? ""}
                                onChange={(e) => {
                                  const raw = e.target.value
                                  const dueAt = raw === "" ? null : raw
                                  setReviewDraft((prev) => ({
                                    ...prev,
                                    actionItems: prev.actionItems.map((row) =>
                                      row.id === item.id ? { ...row, dueAt } : row,
                                    ),
                                  }))
                                }}
                                disabled={!canMutateIncidents || isSavingReview}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!canMutateIncidents || isSavingReview || !onSaveReview}
                  onClick={() => void handleSaveReview()}
                >
                  {isSavingReview ? "Saving…" : "Save review"}
                </Button>
              </div>
            ) : null}

            {incident.assignedRunbook ? (
              <div className="space-y-3 rounded-lg border border-border/60 bg-secondary/25 p-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <ListChecks className="h-4 w-4" />
                    Runbook execution
                  </h3>
                  {onRefreshRunbookExecution && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs"
                      disabled={isRunbookExecutionLoading}
                      onClick={() => void onRefreshRunbookExecution()}
                    >
                      Refresh
                    </Button>
                  )}
                </div>
                {isRunbookExecutionLoading ? (
                  <p className="text-xs text-muted-foreground">Loading execution state…</p>
                ) : runbookExecutionContext ? (
                  <>
                    {!runbookExecutionContext.runbookId && runbookExecutionContext.runbookTitle ? (
                      <p className="text-xs text-amber-600/90">
                        Assigned runbook &quot;{runbookExecutionContext.runbookTitle}&quot; is not
                        in the catalog.
                      </p>
                    ) : null}
                    {runbookExecutionContext.activeExecution &&
                    runbookExecutionContext.runbookId ? (
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant="outline"
                            className={
                              runbookExecutionStatusMeta[
                                runbookExecutionContext.activeExecution.status
                              ].badgeClassName
                            }
                          >
                            {runbookExecutionContext.activeExecution.status.replace(/_/g, " ")}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {runbookExecutionContext.activeExecution.duration}
                            {runbookExecutionContext.activeExecution.startedBy
                              ? ` · ${runbookExecutionContext.activeExecution.startedBy}`
                              : ""}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">Steps</p>
                        <div className="space-y-2">
                          {[...runbookExecutionContext.steps]
                            .sort((a, b) => a.order - b.order)
                            .map((step) => {
                              const completed =
                                runbookExecutionContext.activeExecution?.completedStepIds?.includes(
                                  step.id,
                                ) ?? false
                              const canEdit =
                                canMutateRunbookExecution &&
                                incident.status !== "resolved" &&
                                !isPatchingRunbookExecution &&
                                Boolean(onPatchRunbookExecution)
                              return (
                                <label
                                  key={step.id}
                                  className="flex cursor-pointer items-start gap-2 rounded-md border border-border/50 bg-background/40 px-2 py-2"
                                >
                                  <Checkbox
                                    checked={completed}
                                    disabled={!canEdit}
                                    onCheckedChange={() => {
                                      if (
                                        !onPatchRunbookExecution ||
                                        !runbookExecutionContext.runbookId ||
                                        !runbookExecutionContext.activeExecution
                                      ) {
                                        return
                                      }
                                      const ids = new Set(
                                        runbookExecutionContext.activeExecution
                                          .completedStepIds ?? [],
                                      )
                                      if (ids.has(step.id)) {
                                        ids.delete(step.id)
                                      } else {
                                        ids.add(step.id)
                                      }
                                      void onPatchRunbookExecution({
                                        runbookId: runbookExecutionContext.runbookId,
                                        executionId:
                                          runbookExecutionContext.activeExecution.id,
                                        completedStepIds: [...ids],
                                      })
                                    }}
                                    className="mt-0.5"
                                  />
                                  <span className="text-sm leading-snug">
                                    <span className="font-mono text-xs text-muted-foreground">
                                      {step.order}.
                                    </span>{" "}
                                    {step.title}
                                  </span>
                                </label>
                              )
                            })}
                        </div>
                        {incident.status !== "resolved" ? (
                          <div className="flex flex-wrap gap-2 pt-1">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={
                                !canMutateRunbookExecution ||
                                isPatchingRunbookExecution ||
                                !onPatchRunbookExecution
                              }
                              onClick={() => {
                                if (
                                  !onPatchRunbookExecution ||
                                  !runbookExecutionContext.runbookId ||
                                  !runbookExecutionContext.activeExecution
                                ) {
                                  return
                                }
                                void onPatchRunbookExecution({
                                  runbookId: runbookExecutionContext.runbookId,
                                  executionId: runbookExecutionContext.activeExecution.id,
                                  status: "success",
                                })
                              }}
                            >
                              Mark success
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={
                                !canMutateRunbookExecution ||
                                isPatchingRunbookExecution ||
                                !onPatchRunbookExecution
                              }
                              onClick={() => {
                                if (
                                  !onPatchRunbookExecution ||
                                  !runbookExecutionContext.runbookId ||
                                  !runbookExecutionContext.activeExecution
                                ) {
                                  return
                                }
                                void onPatchRunbookExecution({
                                  runbookId: runbookExecutionContext.runbookId,
                                  executionId: runbookExecutionContext.activeExecution.id,
                                  status: "partial",
                                })
                              }}
                            >
                              Mark partial
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={
                                !canMutateRunbookExecution ||
                                isPatchingRunbookExecution ||
                                !onPatchRunbookExecution
                              }
                              onClick={() => {
                                if (
                                  !onPatchRunbookExecution ||
                                  !runbookExecutionContext.runbookId ||
                                  !runbookExecutionContext.activeExecution
                                ) {
                                  return
                                }
                                void onPatchRunbookExecution({
                                  runbookId: runbookExecutionContext.runbookId,
                                  executionId: runbookExecutionContext.activeExecution.id,
                                  status: "failed",
                                })
                              }}
                            >
                              Mark failed
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    ) : runbookExecutionContext.runbookId ? (
                      <p className="text-xs text-muted-foreground">
                        No active execution. Start above.
                      </p>
                    ) : null}
                    {runbookExecutionContext.history.length > 0 ? (
                      <div className="space-y-2 border-t border-border/50 pt-3">
                        <p className="text-xs font-medium text-muted-foreground">
                          Prior executions
                        </p>
                        <ul className="space-y-1.5">
                          {runbookExecutionContext.history.map((exec) => (
                            <li
                              key={exec.id}
                              className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"
                            >
                              <Badge
                                variant="outline"
                                className={runbookExecutionStatusMeta[exec.status].badgeClassName}
                              >
                                {exec.status.replace(/_/g, " ")}
                              </Badge>
                              <span>{exec.duration}</span>
                              <span>{formatExecutionTime(exec.timestamp)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Runbook state loads when the API is reachable.
                  </p>
                )}
              </div>
            ) : null}

            {workspaceEnrichmentLive ? (
              <div className="space-y-4 rounded-lg border border-border/60 bg-secondary/20 p-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Ingests & notifications
                </h3>
                {isWorkspaceEnrichmentLoading ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Spinner className="size-3.5" />
                    Loading ingests and notifications…
                  </div>
                ) : workspaceEnrichmentError ? (
                  <p className="text-xs text-amber-600/90">{workspaceEnrichmentError}</p>
                ) : workspaceEnrichment ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                        <History className="h-3.5 w-3.5" />
                        Alert ingests
                      </p>
                      {workspaceEnrichment.alertIngests.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          No ingests for this incident id.
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {workspaceEnrichment.alertIngests.map((item) => (
                            <li
                              key={item.id}
                              className="rounded-md border border-border/50 bg-background/40 px-2 py-2 text-xs"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="font-medium text-foreground truncate">
                                  {item.title}
                                </span>
                                <span className="shrink-0 text-muted-foreground">
                                  {formatWorkspaceTime(item.ingestedAt)}
                                </span>
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                                  {item.disposition === "incident_created"
                                    ? "Created"
                                    : "Merged"}
                                </Badge>
                                <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                                  {item.source}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className={`h-5 px-1.5 text-[10px] ${incidentSeverityBadgeStyles[item.severity]}`}
                                >
                                  {item.severity}
                                </Badge>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="space-y-2 border-t border-border/50 pt-3">
                      <p className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                        <Bell className="h-3.5 w-3.5" />
                        Notifications
                      </p>
                      {workspaceEnrichment.notifications.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          No notification rows for this incident id.
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {workspaceEnrichment.notifications.map((n) => (
                            <li
                              key={n.id}
                              className="rounded-md border border-border/50 bg-background/40 px-2 py-2 text-xs"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="font-medium text-foreground">
                                  {n.title}
                                </span>
                                <span className="shrink-0 text-muted-foreground">
                                  {formatWorkspaceTime(n.createdAt)}
                                </span>
                              </div>
                              <p className="mt-1 text-muted-foreground line-clamp-2">
                                {n.message}
                              </p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

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
                      <div className="flex flex-wrap items-baseline gap-2">
                        <Badge
                          variant="outline"
                          className="h-5 shrink-0 border-border/70 bg-secondary/40 text-[10px] text-muted-foreground"
                        >
                          {incidentTimelineEventTypeLabels[event.type]}
                        </Badge>
                        <p className="text-sm text-foreground min-w-0 flex-1">
                          {event.description}
                        </p>
                      </div>
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
                Notes
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
                  placeholder="Handoff, hypothesis, command output…"
                  className="bg-secondary border-border min-h-[80px] resize-none"
                  value={noteInput}
                  onChange={(event) => setNoteInput(event.target.value)}
                  disabled={!canMutateIncidents || isAddingNote}
                />
                <Button
                  size="sm"
                  className="w-full"
                  disabled={
                    !canMutateIncidents ||
                    isAddingNote ||
                    noteInput.trim().length === 0
                  }
                  onClick={() => void handleAddNote()}
                >
                  {isAddingNote ? "Adding…" : "Add note"}
                </Button>
              </div>
            </div>

            <Separator className="bg-border" />

            {/* Actions */}
            <div className="flex gap-2">
              {incident.status === "open" && (
                <Button
                  className="flex-1"
                  variant="outline"
                  disabled={!canMutateIncidents || isAcknowledging}
                  onClick={onAcknowledge}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {isAcknowledging ? "Acknowledging…" : "Acknowledge"}
                </Button>
              )}
              {incident.status !== "resolved" && (
                <>
                  <Button
                    className="flex-1"
                    variant="default"
                    disabled={!canMutateIncidents || isResolving}
                    onClick={onResolve}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {isResolving ? "Resolving…" : "Resolve"}
                  </Button>
                </>
              )}
              {incident.status === "resolved" && (
                <Button
                  className="flex-1"
                  variant="outline"
                  disabled={!canMutateIncidents || isReopening}
                  onClick={onReopen}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  {isReopening ? "Reopening…" : "Reopen"}
                </Button>
              )}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
