"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { AlertTriangle } from "lucide-react"
import { useActor, OPSMATE_DEFAULT_ACTOR_NAME } from "@/components/actor-context"
import { AppShell } from "@/components/app-shell"
import { KPICards } from "@/components/dashboard/kpi-cards"
import { MajorIncidentSpotlight } from "@/components/dashboard/major-incident-spotlight"
import { OperatorSignalsStrip } from "@/components/dashboard/operator-signals-strip"
import { IncidentsTable } from "@/components/dashboard/incidents-table"
import { SystemHealth } from "@/components/dashboard/system-health"
import { RunbookSuggestions } from "@/components/dashboard/runbook-suggestions"
import { AlertsActivity } from "@/components/dashboard/alerts-activity"
import { AlertsHistory } from "@/components/dashboard/alerts-history"
import {
  IncidentTrendChart,
  CategoryDistributionChart,
} from "@/components/dashboard/incident-charts"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { defaultAnalyticsDateRange } from "@/lib/analytics/date-range"
import { getAlertActivity, getAlertHistory } from "@/lib/api/alerts"
import { loadIncidents } from "@/lib/api/incidents"
import { buildDashboardIncidentSnapshot } from "@/lib/dashboard/incidents"
import { countOverdueOpenReviewActionItems } from "@/lib/follow-ups"
import type { IncidentsDataSource } from "@/lib/api/incidents"
import type { AlertActivityItem, AlertHistoryItem, Incident } from "@/lib/types"

export default function DashboardPage() {
  return (
    <AppShell mainClassName="p-6">
      <DashboardPageContent />
    </AppShell>
  )
}

function DashboardPageContent() {
  const { actorName } = useActor()
  const dashboardRange = '30d' satisfies typeof defaultAnalyticsDateRange
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [isLoadingIncidents, setIsLoadingIncidents] = useState(true)
  const [incidentsWarning, setIncidentsWarning] = useState<string | null>(null)
  const [dataSource, setDataSource] = useState<IncidentsDataSource>("backend")
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(null)
  const [alertActivity, setAlertActivity] = useState<AlertActivityItem[]>([])
  const [isLoadingAlertActivity, setIsLoadingAlertActivity] = useState(true)
  const [alertHistory, setAlertHistory] = useState<AlertHistoryItem[]>([])
  const [isLoadingAlertHistory, setIsLoadingAlertHistory] = useState(true)

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
        setDataSource(result.source)
        setLastRefreshedAt(new Date().toISOString())
      } catch {
        if (!isMounted) {
          return
        }

        setIncidents([])
        setDataSource("mock")
        setIncidentsWarning("Unable to load live incidents right now.")
        setLastRefreshedAt(new Date().toISOString())
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

  useEffect(() => {
    let isMounted = true

    async function refreshAlertActivity() {
      setIsLoadingAlertActivity(true)

      try {
        const feed = await getAlertActivity(8)
        if (!isMounted) {
          return
        }
        setAlertActivity(feed.items)
      } catch {
        if (!isMounted) {
          return
        }
        setAlertActivity([])
      } finally {
        if (isMounted) {
          setIsLoadingAlertActivity(false)
        }
      }
    }

    void refreshAlertActivity()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    async function refreshAlertHistory() {
      setIsLoadingAlertHistory(true)

      try {
        const feed = await getAlertHistory(6)
        if (!isMounted) {
          return
        }
        setAlertHistory(feed.items)
      } catch {
        if (!isMounted) {
          return
        }
        setAlertHistory([])
      } finally {
        if (isMounted) {
          setIsLoadingAlertHistory(false)
        }
      }
    }

    void refreshAlertHistory()

    return () => {
      isMounted = false
    }
  }, [])

  const incidentSnapshot = useMemo(
    () => buildDashboardIncidentSnapshot(incidents),
    [incidents],
  )

  const mineActiveIncidents = useMemo(() => {
    if (actorName.trim() === OPSMATE_DEFAULT_ACTOR_NAME) {
      return 0
    }
    const key = actorName.trim().toLowerCase()
    return incidents.filter(
      (i) =>
        i.status !== "resolved" &&
        (i.assignedTo ?? "").trim().toLowerCase() === key,
    ).length
  }, [incidents, actorName])

  const overdueFollowUpCount = useMemo(
    () => countOverdueOpenReviewActionItems(incidents),
    [incidents],
  )
  const unassignedHighSeverityCount = useMemo(
    () =>
      incidents.filter(
        (i) =>
          i.status !== "resolved" &&
          !i.assignedTo?.trim() &&
          (i.severity === "critical" || i.severity === "high"),
      ).length,
    [incidents],
  )
  const sourceLabel = dataSource === "backend" ? "Live API" : "Limited data"

  return (
    <>
      {/* Page Header */}
      <div className="mb-8 space-y-1.5">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Home
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground/90">
          Snapshot: unassigned load, your open rows, overdue post-incident review items. Full queue and lifecycle are
          in{" "}
          <Link href="/incidents" className="font-medium text-primary underline-offset-2 hover:underline">
            Incidents
          </Link>
          .
        </p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="border-border/70 bg-secondary/40 text-[10px]">
            {sourceLabel}
          </Badge>
          <span>Last refreshed: {lastRefreshedAt ? new Date(lastRefreshedAt).toLocaleTimeString() : "—"}</span>
        </div>
      </div>

      {incidentsWarning && (
        <Alert className="mb-6 border-border/70 bg-card/70">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          <AlertTitle>Limited data</AlertTitle>
          <AlertDescription>{incidentsWarning}</AlertDescription>
        </Alert>
      )}
      {overdueFollowUpCount > 0 ? (
        <Alert className="mb-6 border-red-500/35 bg-red-500/[0.06]">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <AlertTitle>Overdue follow-ups</AlertTitle>
          <AlertDescription>
            {overdueFollowUpCount} action item(s) are past due.{" "}
            <Link href="/follow-ups" className="font-medium text-primary underline-offset-2 hover:underline">
              Open Follow-ups
            </Link>
            .
          </AlertDescription>
        </Alert>
      ) : null}

      {/* KPI Cards */}
      <KPICards
        activeAlerts={incidentSnapshot.activeAlerts}
        resolvedIncidents={incidentSnapshot.resolvedIncidents}
        investigatingIncidents={incidentSnapshot.investigatingIncidents}
        criticalActiveIncidents={incidentSnapshot.criticalActiveIncidents}
        majorActiveIncidents={incidentSnapshot.majorActiveIncidents}
        isLoading={isLoadingIncidents}
      />

      <OperatorSignalsStrip
        unassignedActive={incidentSnapshot.unassignedActiveIncidents}
        unassignedHighSeverity={unassignedHighSeverityCount}
        mineActive={mineActiveIncidents}
        overdueFollowUps={overdueFollowUpCount}
        isLoading={isLoadingIncidents}
        mineDisabled={actorName.trim() === OPSMATE_DEFAULT_ACTOR_NAME}
      />

      <MajorIncidentSpotlight
        incidents={incidents}
        majorActiveCount={incidentSnapshot.majorActiveIncidents}
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
          <AlertsActivity items={alertActivity} isLoading={isLoadingAlertActivity} />
          <AlertsHistory items={alertHistory} isLoading={isLoadingAlertHistory} />
          <RunbookSuggestions />
        </div>
      </div>
    </>
  )
}
