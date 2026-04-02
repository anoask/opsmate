"use client"

import { useState, useMemo } from "react"
import { AppShell } from "@/components/app-shell"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IncidentsFilters } from "@/components/incidents/incidents-filters"
import { IncidentsFullTable } from "@/components/incidents/incidents-full-table"
import { IncidentDetailSheet } from "@/components/incidents/incident-detail-sheet"
import { incidents } from "@/lib/mock-data"
import type { Incident } from "@/lib/types"

export default function IncidentsPage() {
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [severityFilter, setSeverityFilter] = useState("all")
  const [sourceFilter, setSourceFilter] = useState("all")

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
          incident.source.toLowerCase().includes(query)
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
  }, [activeTab, searchQuery, severityFilter, sourceFilter])

  const handleSelectIncident = (incident: Incident) => {
    setSelectedIncident(incident)
    setSheetOpen(true)
  }

  const activeCount = incidents.filter((i) => i.status !== "resolved").length
  const resolvedCount = incidents.filter((i) => i.status === "resolved").length

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
            <IncidentsFullTable
              incidents={filteredIncidents}
              onSelectIncident={handleSelectIncident}
            />
          </TabsContent>
          <TabsContent value="active" className="mt-5">
            <IncidentsFullTable
              incidents={filteredIncidents}
              onSelectIncident={handleSelectIncident}
            />
          </TabsContent>
          <TabsContent value="resolved" className="mt-5">
            <IncidentsFullTable
              incidents={filteredIncidents}
              onSelectIncident={handleSelectIncident}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Incident Detail Sheet */}
      <IncidentDetailSheet
        incident={selectedIncident}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </AppShell>
  )
}
