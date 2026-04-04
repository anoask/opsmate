"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertTriangle } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { KPICards } from "@/components/dashboard/kpi-cards"
import { IncidentsTable } from "@/components/dashboard/incidents-table"
import { SystemHealth } from "@/components/dashboard/system-health"
import { RunbookSuggestions } from "@/components/dashboard/runbook-suggestions"
import {
  IncidentTrendChart,
  CategoryDistributionChart,
} from "@/components/dashboard/incident-charts"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { defaultAnalyticsDateRange } from "@/lib/analytics/date-range"
import { loadIncidents } from "@/lib/api/incidents"
import { buildDashboardIncidentSnapshot } from "@/lib/dashboard/incidents"
import type { Incident } from "@/lib/types"

export default function DashboardPage() {
  const dashboardRange = defaultAnalyticsDateRange
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [isLoadingIncidents, setIsLoadingIncidents] = useState(true)
  const [incidentsWarning, setIncidentsWarning] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function refreshDashboardIncidents() {
      setIsLoadingIncidents(true)

      try {
        const result = await loadIncidents({ range: dashboardRange })

        if (!isMounted) {
          return
        }

        setIncidents(result.incidents)
        setIncidentsWarning(result.warning ?? null)
      } catch {
        if (!isMounted) {
          return
        }

        setIncidents([])
        setIncidentsWarning("Unable to load live incidents right now.")
      } finally {
        if (isMounted) {
          setIsLoadingIncidents(false)
        }
      }
    }

    void refreshDashboardIncidents()

    return () => {
      isMounted = false
    }
  }, [dashboardRange])

  const incidentSnapshot = useMemo(
    () => buildDashboardIncidentSnapshot(incidents),
    [incidents],
  )

  return (
    <AppShell mainClassName="p-6">
      {/* Page Header */}
      <div className="mb-8 space-y-1.5">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground/90">
          Monitor and manage incidents across your infrastructure
        </p>
      </div>

      {incidentsWarning && (
        <Alert className="mb-6 border-border/70 bg-card/70">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          <AlertTitle>Incident data notice</AlertTitle>
          <AlertDescription>{incidentsWarning}</AlertDescription>
        </Alert>
      )}

      {/* KPI Cards */}
      <KPICards
        activeAlerts={incidentSnapshot.activeAlerts}
        resolvedIncidents={incidentSnapshot.resolvedIncidents}
        investigatingIncidents={incidentSnapshot.investigatingIncidents}
        criticalActiveIncidents={incidentSnapshot.criticalActiveIncidents}
        isLoading={isLoadingIncidents}
      />

      {/* Main Content Grid */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Charts Section */}
        <div className="space-y-6 lg:col-span-2">
          <div className="grid gap-6 md:grid-cols-2">
            <IncidentTrendChart
              data={incidentSnapshot.incidentTrendData}
              isLoading={isLoadingIncidents}
            />
            <CategoryDistributionChart
              data={incidentSnapshot.categoryData}
              isLoading={isLoadingIncidents}
            />
          </div>
          {/* Incidents Table */}
          <IncidentsTable
            incidents={incidentSnapshot.recentIncidents}
            isLoading={isLoadingIncidents}
          />
        </div>

        {/* Right Sidebar Panels */}
        <div className="space-y-6">
          <SystemHealth />
          <RunbookSuggestions />
        </div>
      </div>
    </AppShell>
  )
}
