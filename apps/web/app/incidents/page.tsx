"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AlertTriangle, RefreshCw, ServerCrash } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { IncidentsFilters } from "@/components/incidents/incidents-filters"
import { IncidentsFullTable } from "@/components/incidents/incidents-full-table"
import { IncidentDetailSheet } from "@/components/incidents/incident-detail-sheet"
import { Spinner } from "@/components/ui/spinner"
import {
  type IncidentsDataSource,
  loadIncident,
  loadIncidents,
  resolveIncidentWithFallback,
} from "@/lib/api/incidents"
import type { Incident } from "@/lib/types"

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [severityFilter, setSeverityFilter] = useState("all")
  const [sourceFilter, setSourceFilter] = useState("all")
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loadWarning, setLoadWarning] = useState<string | null>(null)
  const [dataSource, setDataSource] = useState<IncidentsDataSource>("backend")
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [isResolving, setIsResolving] = useState(false)

  const refreshIncidents = useCallback(async () => {
    setIsInitialLoading(true)
    setLoadError(null)

    try {
      const result = await loadIncidents()
      setIncidents(result.incidents)
      setDataSource(result.source)
      setLoadWarning(result.warning ?? null)
    } catch {
      setIncidents([])
      setDataSource("mock")
      setLoadWarning(null)
      setLoadError("Unable to load incidents right now. Please try again.")
    } finally {
      setIsInitialLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshIncidents()
  }, [refreshIncidents])

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

      return true
    })
  }, [incidents, activeTab, searchQuery, severityFilter, sourceFilter])

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

    setIsResolving(true)
    setDetailError(null)

    try {
      const result = await resolveIncidentWithFallback(selectedIncident)

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
      setIsResolving(false)
    }
  }

  const handleSheetOpenChange = (open: boolean) => {
    setSheetOpen(open)

    if (!open) {
      setDetailError(null)
      setIsDetailLoading(false)
      setIsResolving(false)
    }
  }

  const activeCount = incidents.filter((i) => i.status !== "resolved").length
  const resolvedCount = incidents.filter((i) => i.status === "resolved").length

  const renderIncidentsContent = () => {
    if (isInitialLoading) {
      return (
        <Card className="border-border/70 bg-card/70">
          <CardContent className="flex items-center justify-center gap-3 py-12">
            <Spinner className="size-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Loading incidents...
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
    <AppShell mainClassName="p-6">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="space-y-1.5">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Incidents
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground/90">
            Manage and track all incidents across your infrastructure
          </p>
        </div>

        {loadWarning && (
          <Alert className="border-border/70 bg-card/70">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <AlertTitle>Demo mode</AlertTitle>
            <AlertDescription>{loadWarning}</AlertDescription>
          </Alert>
        )}

        {/* Tabs and Filters */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <TabsList className="h-auto rounded-lg border border-border/70 bg-secondary/60 p-1">
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
          </div>

          <div className="mt-5">
            <IncidentsFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              severityFilter={severityFilter}
              onSeverityChange={setSeverityFilter}
              sourceFilter={sourceFilter}
              onSourceChange={setSourceFilter}
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
        isResolving={isResolving}
        onResolve={() => void handleResolveIncident()}
      />
    </AppShell>
  )
}
