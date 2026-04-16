"use client"

import { Suspense, useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertTriangle, RefreshCw, ServerCrash } from "lucide-react"
import { useActor, OPSMATE_DEFAULT_ACTOR_NAME } from "@/components/actor-context"
import { AppShell } from "@/components/app-shell"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { IncidentsFilters } from "@/components/incidents/incidents-filters"
import {
  IncidentsOperatorChips,
  type IncidentsOwnershipQuickFilter,
} from "@/components/incidents/incidents-operator-chips"
import { IncidentsFullTable } from "@/components/incidents/incidents-full-table"
import { IncidentsStatusBoard } from "@/components/incidents/incidents-status-board"
import { IncidentDetailSheet } from "@/components/incidents/incident-detail-sheet"
import { Spinner } from "@/components/ui/spinner"
import {
  acknowledgeIncidentWithFallback,
  assignIncidentWithFallback,
  addIncidentNoteWithFallback,
  changeIncidentSeverityWithFallback,
  getIncidentWorkspaceEnrichment,
  type IncidentsDataSource,
  loadIncident,
  loadIncidents,
  patchIncidentMajorWithFallback,
  patchIncidentReviewWithFallback,
  reopenIncidentWithFallback,
  resolveIncidentWithFallback,
} from "@/lib/api/incidents"
import {
  getIncidentRunbookExecutionContext,
  startRunbookExecutionFromIncident,
  updateRunbookExecution,
} from "@/lib/api/runbooks"
import { fetchUsers } from "@/lib/api/users"
import { countOverdueOpenReviewActionItems } from "@/lib/follow-ups"
import { teamMembers } from "@/lib/mock-data"
import type {
  Incident,
  IncidentReview,
  IncidentRunbookExecutionContext,
  IncidentWorkspaceEnrichment,
  RunbookExecutionStatus,
  Severity,
} from "@/lib/types"
import { cn } from "@/lib/utils"

export default function IncidentsPage() {
  return (
    <AppShell mainClassName="p-6">
      <Suspense
        fallback={
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Spinner className="size-4" />
            Loading incidents…
          </div>
        }
      >
        <IncidentsPageInner />
      </Suspense>
    </AppShell>
  )
}

function IncidentsPageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { actorName: incidentActor, can } = useActor()
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [severityFilter, setSeverityFilter] = useState("all")
  const [sourceFilter, setSourceFilter] = useState("all")
  const [majorFilter, setMajorFilter] = useState("all")
  const [ownershipFilter, setOwnershipFilter] =
    useState<IncidentsOwnershipQuickFilter>("all")
  const [incidentsView, setIncidentsView] = useState<"table" | "board">("table")
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loadWarning, setLoadWarning] = useState<string | null>(null)
  const [dataSource, setDataSource] = useState<IncidentsDataSource>("backend")
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [runbookExecutionContext, setRunbookExecutionContext] =
    useState<IncidentRunbookExecutionContext | null>(null)
  const [isRunbookCtxLoading, setIsRunbookCtxLoading] = useState(false)
  const [isRunbookCtxPatching, setIsRunbookCtxPatching] = useState(false)
  const [workspaceEnrichment, setWorkspaceEnrichment] =
    useState<IncidentWorkspaceEnrichment | null>(null)
  const [isWorkspaceEnrichmentLoading, setIsWorkspaceEnrichmentLoading] =
    useState(false)
  const [workspaceEnrichmentError, setWorkspaceEnrichmentError] = useState<string | null>(
    null,
  )
  const [activeMutation, setActiveMutation] = useState<
    | "acknowledge"
    | "assign"
    | "severity"
    | "resolve"
    | "reopen"
    | "note"
    | "review"
    | "major"
    | "runbook_execution"
    | null
  >(null)
  const [availableAssignees, setAvailableAssignees] = useState<string[]>(() =>
    teamMembers
      .filter((member) => member.status === "active")
      .map((member) => member.name),
  )
  const [assigneesFromLiveDirectory, setAssigneesFromLiveDirectory] = useState(false)
  const availableSeverities = useMemo<Severity[]>(
    () => ["critical", "high", "medium", "low"],
    [],
  )

  const refreshRunbookExecutionContext = useCallback(async () => {
    const incident = selectedIncident
    if (!incident || dataSource === "mock" || !incident.assignedRunbook) {
      setRunbookExecutionContext(null)
      return
    }

    setIsRunbookCtxLoading(true)
    try {
      const ctx = await getIncidentRunbookExecutionContext(incident.id)
      setRunbookExecutionContext(ctx)
    } catch {
      setRunbookExecutionContext(null)
    } finally {
      setIsRunbookCtxLoading(false)
    }
  }, [selectedIncident, dataSource])

  useEffect(() => {
    if (sheetOpen && selectedIncident && dataSource === "backend") {
      void refreshRunbookExecutionContext()
    }
    if (!sheetOpen) {
      setRunbookExecutionContext(null)
    }
  }, [sheetOpen, selectedIncident, dataSource, refreshRunbookExecutionContext])

  const refreshWorkspaceEnrichment = useCallback(async () => {
    const incident = selectedIncident
    if (!incident || dataSource === "mock") {
      setWorkspaceEnrichment(null)
      setWorkspaceEnrichmentError(null)
      setIsWorkspaceEnrichmentLoading(false)
      return
    }

    setIsWorkspaceEnrichmentLoading(true)
    setWorkspaceEnrichment(null)
    setWorkspaceEnrichmentError(null)
    try {
      const data = await getIncidentWorkspaceEnrichment(incident.id)
      setWorkspaceEnrichment(data)
    } catch {
      setWorkspaceEnrichment(null)
      setWorkspaceEnrichmentError(
        "Linked alerts and notifications could not be loaded.",
      )
    } finally {
      setIsWorkspaceEnrichmentLoading(false)
    }
  }, [selectedIncident, dataSource])

  useEffect(() => {
    if (!sheetOpen) {
      setWorkspaceEnrichment(null)
      setWorkspaceEnrichmentError(null)
      setIsWorkspaceEnrichmentLoading(false)
      return
    }
    if (dataSource === "backend") {
      void refreshWorkspaceEnrichment()
    }
  }, [sheetOpen, dataSource, refreshWorkspaceEnrichment])

  const refreshIncidents = useCallback(async () => {
    setIsInitialLoading(true)
    setLoadError(null)

    try {
      const result = await loadIncidents()
      setIncidents(result.incidents)
      setDataSource(result.source)
      setLoadWarning(result.warning ?? null)
      setLastRefreshedAt(new Date().toISOString())
    } catch {
      setIncidents([])
      setDataSource("mock")
      setLoadWarning(null)
      setLoadError("Unable to load incidents right now. Please try again.")
      setLastRefreshedAt(new Date().toISOString())
    } finally {
      setIsInitialLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshIncidents()
  }, [refreshIncidents])

  useEffect(() => {
    if (
      incidentActor.trim() === OPSMATE_DEFAULT_ACTOR_NAME &&
      ownershipFilter === "mine"
    ) {
      setOwnershipFilter("all")
    }
  }, [incidentActor, ownershipFilter])

  useEffect(() => {
    const quick = searchParams.get("quick")?.trim()
    if (quick === "major-active") {
      setMajorFilter("major")
      setActiveTab("active")
    } else if (quick === "major-review") {
      setMajorFilter("major")
      setActiveTab("resolved")
    } else if (quick === "major-board") {
      setMajorFilter("major")
      setActiveTab("active")
      setIncidentsView("board")
    } else {
      return
    }

    const params = new URLSearchParams(searchParams.toString())
    params.delete("quick")
    const qs = params.toString()
    router.replace(qs ? `/incidents?${qs}` : "/incidents", { scroll: false })
  }, [searchParams, router])

  useEffect(() => {
    const id = searchParams.get("incident")?.trim()
    if (!id || incidents.length === 0) {
      return
    }
    const match = incidents.find((incident) => incident.id === id)
    if (!match) {
      return
    }
    setSelectedIncident(match)
    setSheetOpen(true)
    router.replace("/incidents", { scroll: false })
  }, [searchParams, incidents, router])

  useEffect(() => {
    void (async () => {
      try {
        const users = await fetchUsers()
        const names = users
          .filter((u) => u.status === "active" && u.id !== "sys-opsmate-bot")
          .map((u) => u.name)
        if (names.length > 0) {
          setAvailableAssignees(names)
          setAssigneesFromLiveDirectory(true)
        }
      } catch {
        /* keep demo assignee names */
      }
    })()
  }, [])

  const filteredIncidents = useMemo(() => {
    return incidents.filter((incident) => {
      // Tab filter
      if (activeTab === "active" && incident.status === "resolved") return false
      if (activeTab === "resolved" && incident.status !== "resolved") return false

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          incident.id.toLowerCase().includes(query) ||
          incident.title.toLowerCase().includes(query) ||
          incident.source.toLowerCase().includes(query) ||
          incident.category.toLowerCase().includes(query) ||
          (incident.assignedTo?.toLowerCase().includes(query) ?? false)
        if (!matchesSearch) return false
      }

      // Severity filter
      if (severityFilter !== "all" && incident.severity !== severityFilter) {
        return false
      }

      // Source filter
      if (sourceFilter !== "all" && incident.source !== sourceFilter) {
        return false
      }

      if (majorFilter === "major" && !incident.isMajorIncident) {
        return false
      }

      if (ownershipFilter === "mine") {
        const mineKey = incidentActor.trim().toLowerCase()
        const assigneeKey = (incident.assignedTo ?? "").trim().toLowerCase()
        if (assigneeKey !== mineKey) {
          return false
        }
      }

      if (ownershipFilter === "unassigned" && incident.assignedTo?.trim()) {
        return false
      }

      return true
    })
  }, [
    incidents,
    activeTab,
    searchQuery,
    severityFilter,
    sourceFilter,
    majorFilter,
    ownershipFilter,
    incidentActor,
  ])

  const handleSelectIncident = async (incident: Incident) => {
    setSelectedIncident(incident)
    setSheetOpen(true)
    setDetailError(null)

    if (dataSource === "mock") {
      return
    }

    setIsDetailLoading(true)

    try {
      const result = await loadIncident(incident.id, incident)
      setSelectedIncident(result.incident)

      if (result.warning) {
        setDataSource("mock")
        setDetailError("Live incident details are unavailable. Showing cached data.")
      }
    } catch {
      setDetailError("Unable to refresh incident details. Showing the last available data.")
    } finally {
      setIsDetailLoading(false)
    }
  }

  const handleResolveIncident = async () => {
    if (!selectedIncident) {
      return
    }

    setActiveMutation("resolve")
    setDetailError(null)

    try {
      const result = await resolveIncidentWithFallback(selectedIncident, {}, incidentActor)

      setSelectedIncident(result.incident)
      setIncidents((currentIncidents) =>
        currentIncidents.map((incident) =>
          incident.id === result.incident.id ? result.incident : incident,
        ),
      )

      if (result.warning) {
        setDataSource("mock")
        setLoadWarning(result.warning)
        setDetailError("Incident was resolved locally using demo data.")
      }
    } catch {
      setDetailError("Unable to resolve the incident right now. Please try again.")
    } finally {
      setActiveMutation(null)
    }
  }

  const handleAcknowledgeIncident = async () => {
    if (!selectedIncident) {
      return
    }

    setActiveMutation("acknowledge")
    setDetailError(null)

    try {
      const result = await acknowledgeIncidentWithFallback(selectedIncident, {}, incidentActor)

      setSelectedIncident(result.incident)
      setIncidents((currentIncidents) =>
        currentIncidents.map((incident) =>
          incident.id === result.incident.id ? result.incident : incident,
        ),
      )

      if (result.warning) {
        setDataSource("mock")
        setLoadWarning(result.warning)
        setDetailError("Incident was acknowledged locally using demo data.")
      }
    } catch {
      setDetailError("Unable to acknowledge the incident right now. Please try again.")
    } finally {
      setActiveMutation(null)
    }
  }

  const handleReopenIncident = async () => {
    if (!selectedIncident) {
      return
    }

    setActiveMutation("reopen")
    setDetailError(null)

    try {
      const result = await reopenIncidentWithFallback(selectedIncident, {}, incidentActor)

      setSelectedIncident(result.incident)
      setIncidents((currentIncidents) =>
        currentIncidents.map((incident) =>
          incident.id === result.incident.id ? result.incident : incident,
        ),
      )

      if (result.warning) {
        setDataSource("mock")
        setLoadWarning(result.warning)
        setDetailError("Incident was reopened locally using demo data.")
      }
    } catch {
      setDetailError("Unable to reopen the incident right now. Please try again.")
    } finally {
      setActiveMutation(null)
    }
  }

  const handleAssignIncident = async (assignee: string) => {
    if (!selectedIncident) {
      return
    }

    setActiveMutation("assign")
    setDetailError(null)

    try {
      const result = await assignIncidentWithFallback(
        selectedIncident,
        { assignee },
        incidentActor,
      )

      setSelectedIncident(result.incident)
      setIncidents((currentIncidents) =>
        currentIncidents.map((incident) =>
          incident.id === result.incident.id ? result.incident : incident,
        ),
      )

      if (result.warning) {
        setDataSource("mock")
        setLoadWarning(result.warning)
        setDetailError("Incident assignment was updated locally using demo data.")
      }
    } catch {
      setDetailError("Unable to update assignment right now. Please try again.")
    } finally {
      setActiveMutation(null)
    }
  }

  const handleChangeSeverity = async (severity: Severity) => {
    if (!selectedIncident) {
      return
    }

    setActiveMutation("severity")
    setDetailError(null)

    try {
      const result = await changeIncidentSeverityWithFallback(
        selectedIncident,
        { severity },
        incidentActor,
      )

      setSelectedIncident(result.incident)
      setIncidents((currentIncidents) =>
        currentIncidents.map((incident) =>
          incident.id === result.incident.id ? result.incident : incident,
        ),
      )

      if (result.warning) {
        setDataSource("mock")
        setLoadWarning(result.warning)
        setDetailError("Incident severity was updated locally using demo data.")
      }
    } catch {
      setDetailError("Unable to change severity right now. Please try again.")
    } finally {
      setActiveMutation(null)
    }
  }

  const handleSaveIncidentReview = async (review: IncidentReview) => {
    if (!selectedIncident) {
      return
    }

    setActiveMutation("review")
    setDetailError(null)

    try {
      const result = await patchIncidentReviewWithFallback(selectedIncident, { review })

      setSelectedIncident(result.incident)
      setIncidents((currentIncidents) =>
        currentIncidents.map((incident) =>
          incident.id === result.incident.id ? result.incident : incident,
        ),
      )

      if (result.warning) {
        setDataSource("mock")
        setLoadWarning(result.warning)
        setDetailError("Review was saved locally using demo data.")
      }
    } catch {
      setDetailError("Unable to save the review right now. Please try again.")
    } finally {
      setActiveMutation(null)
    }
  }

  const handleToggleMajorIncident = async (nextMajor: boolean) => {
    if (!selectedIncident) {
      return
    }

    setActiveMutation("major")
    setDetailError(null)

    try {
      const result = await patchIncidentMajorWithFallback(
        selectedIncident,
        { isMajor: nextMajor },
        incidentActor,
      )

      setSelectedIncident(result.incident)
      setIncidents((currentIncidents) =>
        currentIncidents.map((incident) =>
          incident.id === result.incident.id ? result.incident : incident,
        ),
      )

      if (result.warning) {
        setDataSource("mock")
        setLoadWarning(result.warning)
        setDetailError("Major incident flag was updated locally using demo data.")
      }
    } catch {
      setDetailError(
        "Unable to update the major incident flag right now. Please try again.",
      )
    } finally {
      setActiveMutation(null)
    }
  }

  const handleAddIncidentNote = async (content: string) => {
    if (!selectedIncident) {
      return
    }

    setActiveMutation("note")
    setDetailError(null)

    try {
      const result = await addIncidentNoteWithFallback(
        selectedIncident,
        { content },
        incidentActor,
      )

      setSelectedIncident(result.incident)
      setIncidents((currentIncidents) =>
        currentIncidents.map((incident) =>
          incident.id === result.incident.id ? result.incident : incident,
        ),
      )

      if (result.warning) {
        setDataSource("mock")
        setLoadWarning(result.warning)
        setDetailError("Note was added locally using demo data.")
      }
    } catch {
      setDetailError("Unable to add a note right now. Please try again.")
      throw new Error("INCIDENT_NOTE_SUBMIT_FAILED")
    } finally {
      setActiveMutation(null)
    }
  }

  const handleStartRunbookExecution = async () => {
    if (!selectedIncident) {
      return
    }

    setActiveMutation("runbook_execution")
    setDetailError(null)

    try {
      await startRunbookExecutionFromIncident(selectedIncident.id)
      await refreshRunbookExecutionContext()
    } catch {
      setDetailError(
        "Unable to start runbook execution for this incident right now.",
      )
    } finally {
      setActiveMutation(null)
    }
  }

  const handlePatchRunbookExecution = async (input: {
    runbookId: string
    executionId: string
    completedStepIds?: string[]
    status?: RunbookExecutionStatus
  }) => {
    if (!selectedIncident || dataSource === "mock") {
      return
    }

    setIsRunbookCtxPatching(true)
    setDetailError(null)

    try {
      await updateRunbookExecution(input.runbookId, input.executionId, {
        completedStepIds: input.completedStepIds,
        status: input.status,
      })
      await refreshRunbookExecutionContext()
    } catch {
      setDetailError("Unable to update runbook execution.")
    } finally {
      setIsRunbookCtxPatching(false)
    }
  }

  const handleSheetOpenChange = (open: boolean) => {
    setSheetOpen(open)

    if (!open) {
      setDetailError(null)
      setIsDetailLoading(false)
      setActiveMutation(null)
      setWorkspaceEnrichment(null)
      setWorkspaceEnrichmentError(null)
      setIsWorkspaceEnrichmentLoading(false)
    }
  }

  const activeCount = incidents.filter((i) => i.status !== "resolved").length
  const resolvedCount = incidents.filter((i) => i.status === "resolved").length
  const overdueFollowUpCount = countOverdueOpenReviewActionItems(incidents)
  const sourceLabel = dataSource === "backend" ? "Live API" : "Limited data"

  const renderIncidentsContent = () => {
    if (isInitialLoading) {
      return (
        <Card className="border-border/70 bg-card/70">
          <CardContent className="flex items-center justify-center gap-3 py-12">
            <Spinner className="size-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Loading incidents…
            </span>
          </CardContent>
        </Card>
      )
    }

    if (loadError) {
      return (
        <Card className="border-border/70 bg-card/70">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <ServerCrash className="h-5 w-5 text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                Unable to load incidents
              </p>
              <p className="text-sm text-muted-foreground">{loadError}</p>
            </div>
            <Button variant="outline" onClick={() => void refreshIncidents()}>
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )
    }

    if (incidentsView === "board") {
      return (
        <IncidentsStatusBoard
          incidents={filteredIncidents}
          onSelectIncident={(incident) => {
            void handleSelectIncident(incident)
          }}
        />
      )
    }

    return (
      <IncidentsFullTable
        incidents={filteredIncidents}
        onSelectIncident={(incident) => {
          void handleSelectIncident(incident)
        }}
      />
    )
  }

  return (
    <>
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="space-y-1.5">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Incidents
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground/90">
            Primary queue: filters, board or table, lifecycle and post-incident review per row.
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="border-border/70 bg-secondary/40 text-[10px]">
              {sourceLabel}
            </Badge>
            <span>Last refreshed: {lastRefreshedAt ? new Date(lastRefreshedAt).toLocaleTimeString() : "—"}</span>
          </div>
        </div>

        {loadWarning && (
          <Alert className="border-border/70 bg-card/70">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <AlertTitle>Limited data</AlertTitle>
            <AlertDescription>{loadWarning}</AlertDescription>
          </Alert>
        )}
        {overdueFollowUpCount > 0 ? (
          <Alert className="border-red-500/35 bg-red-500/[0.06]">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <AlertTitle>Overdue follow-ups</AlertTitle>
            <AlertDescription>
              {overdueFollowUpCount} action item(s) are overdue across incidents.{" "}
              <a href="/follow-ups" className="font-medium text-primary underline-offset-2 hover:underline">
                Open Follow-ups
              </a>
              .
            </AlertDescription>
          </Alert>
        ) : null}

        {/* Tabs and Filters */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <TabsList className="h-auto w-fit rounded-lg border border-border/70 bg-secondary/60 p-1">
              <TabsTrigger value="all" className="px-3.5 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                All ({incidents.length})
              </TabsTrigger>
              <TabsTrigger value="active" className="px-3.5 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Active ({activeCount})
              </TabsTrigger>
              <TabsTrigger value="resolved" className="px-3.5 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Resolved ({resolvedCount})
              </TabsTrigger>
            </TabsList>
            <div
              className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3"
              role="group"
              aria-label="Incident list layout"
            >
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/80">
                Layout
              </span>
              <div className="inline-flex h-auto rounded-lg border border-border/70 bg-secondary/60 p-1">
                <button
                  type="button"
                  onClick={() => setIncidentsView("table")}
                  className={cn(
                    "rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors",
                    incidentsView === "table"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Table
                </button>
                <button
                  type="button"
                  onClick={() => setIncidentsView("board")}
                  className={cn(
                    "rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors",
                    incidentsView === "board"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Command board
                </button>
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <IncidentsFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              severityFilter={severityFilter}
              onSeverityChange={setSeverityFilter}
              sourceFilter={sourceFilter}
              onSourceChange={setSourceFilter}
              majorFilter={majorFilter}
              onMajorChange={setMajorFilter}
            />
            <IncidentsOperatorChips
              ownershipFilter={ownershipFilter}
              onOwnershipFilterChange={setOwnershipFilter}
              majorFilter={majorFilter}
              onMajorFilterChange={setMajorFilter}
              activeTab={activeTab}
              onActiveTabChange={setActiveTab}
              actorName={incidentActor}
              defaultActorName={OPSMATE_DEFAULT_ACTOR_NAME}
            />
          </div>

          <TabsContent value="all" className="mt-5">
            {renderIncidentsContent()}
          </TabsContent>
          <TabsContent value="active" className="mt-5">
            {renderIncidentsContent()}
          </TabsContent>
          <TabsContent value="resolved" className="mt-5">
            {renderIncidentsContent()}
          </TabsContent>
        </Tabs>
      </div>

      {/* Incident Detail Sheet */}
      <IncidentDetailSheet
        incident={selectedIncident}
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        isLoading={isDetailLoading}
        error={detailError}
        isAcknowledging={activeMutation === "acknowledge"}
        isAssigning={activeMutation === "assign"}
        isChangingSeverity={activeMutation === "severity"}
        isResolving={activeMutation === "resolve"}
        isReopening={activeMutation === "reopen"}
        isAddingNote={activeMutation === "note"}
        isSavingReview={activeMutation === "review"}
        isTogglingMajor={activeMutation === "major"}
        isStartingRunbookExecution={activeMutation === "runbook_execution"}
        availableAssignees={availableAssignees}
        availableSeverities={availableSeverities}
        onAcknowledge={() => void handleAcknowledgeIncident()}
        onAssign={(assignee) => void handleAssignIncident(assignee)}
        onChangeSeverity={(severity) => void handleChangeSeverity(severity)}
        onResolve={() => void handleResolveIncident()}
        onReopen={() => void handleReopenIncident()}
        onAddNote={handleAddIncidentNote}
        onSaveReview={(review) => void handleSaveIncidentReview(review)}
        onToggleMajor={(next) => void handleToggleMajorIncident(next)}
        onStartRunbookExecution={() => void handleStartRunbookExecution()}
        runbookExecutionContext={runbookExecutionContext}
        isRunbookExecutionLoading={isRunbookCtxLoading}
        onRefreshRunbookExecution={() => void refreshRunbookExecutionContext()}
        onPatchRunbookExecution={(input) => void handlePatchRunbookExecution(input)}
        isPatchingRunbookExecution={isRunbookCtxPatching}
        workspaceEnrichmentLive={dataSource === "backend"}
        workspaceEnrichment={workspaceEnrichment}
        isWorkspaceEnrichmentLoading={isWorkspaceEnrichmentLoading}
        workspaceEnrichmentError={workspaceEnrichmentError}
        showTeamOwnershipHint={assigneesFromLiveDirectory}
        canMutateIncidents={can("incidents:write")}
        canMutateRunbookExecution={can("runbooks:execute")}
      />
    </>
  )
}
