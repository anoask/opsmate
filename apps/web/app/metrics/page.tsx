'use client'

import { useEffect, useMemo, useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { MetricsKPIs } from '@/components/metrics/metrics-kpis'
import { MTTRChart } from '@/components/metrics/mttr-chart'
import { IncidentVolumeChart } from '@/components/metrics/incident-volume-chart'
import { TeamPerformance } from '@/components/metrics/team-performance'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  defaultAnalyticsDateRange,
  type AnalyticsDateRange,
} from '@/lib/analytics/date-range'
import { loadIncidents } from '@/lib/api/incidents'
import { buildMetricsIncidentSnapshot } from '@/lib/metrics/incidents'
import type { Incident } from '@/lib/types'
import { AlertTriangle, Calendar } from 'lucide-react'

export default function MetricsPage() {
  const [selectedRange, setSelectedRange] = useState<AnalyticsDateRange>(
    defaultAnalyticsDateRange,
  )
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [isLoadingIncidents, setIsLoadingIncidents] = useState(true)
  const [incidentsWarning, setIncidentsWarning] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function refreshMetricIncidents() {
      setIsLoadingIncidents(true)

      try {
        const result = await loadIncidents({ range: selectedRange })

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
        setIncidentsWarning('Unable to load live incident metrics right now.')
      } finally {
        if (isMounted) {
          setIsLoadingIncidents(false)
        }
      }
    }

    void refreshMetricIncidents()

    return () => {
      isMounted = false
    }
  }, [selectedRange])

  const incidentMetrics = useMemo(
    () => buildMetricsIncidentSnapshot(incidents, selectedRange),
    [incidents, selectedRange],
  )

  return (
    <AppShell>
      {/* Header */}
      <div className="sticky top-0 bg-background z-10 pt-6 px-6 border-b border-border pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Metrics</h1>
            <p className="text-muted-foreground mt-1">Track MTTR, incident trends, and team performance</p>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Select
              value={selectedRange}
              onValueChange={(value) => setSelectedRange(value as AnalyticsDateRange)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pb-6 space-y-6">
        {incidentsWarning && (
          <Alert className="border-border/70 bg-card/70">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <AlertTitle>Incident metrics notice</AlertTitle>
            <AlertDescription>{incidentsWarning}</AlertDescription>
          </Alert>
        )}

        {/* KPIs */}
        <MetricsKPIs
          kpis={incidentMetrics.kpis}
          isLoading={isLoadingIncidents}
        />

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MTTRChart
            data={incidentMetrics.mttrTrendData}
            isLoading={isLoadingIncidents}
          />
          <IncidentVolumeChart
            data={incidentMetrics.incidentVolumeData}
            isLoading={isLoadingIncidents}
          />
        </div>

        {/* Team Performance */}
        <TeamPerformance />

        {/* Category Performance Card */}
        <Card className="bg-card border-border shadow-black/20">
          <CardHeader>
            <CardTitle>Incident Category Breakdown</CardTitle>
            <CardDescription>Incidents by category with resolution metrics</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingIncidents ? (
              <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
                Loading category metrics...
              </div>
            ) : incidentMetrics.incidentCategoryBreakdown.length === 0 ? (
              <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
                No incident category metrics available yet.
              </div>
            ) : (
              <div className="space-y-3">
                {incidentMetrics.incidentCategoryBreakdown.map((cat) => (
                  <div key={cat.category} className="flex items-center justify-between rounded-lg border border-transparent px-3 py-3 hover:border-border/40 hover:bg-secondary/30 last:border-b-0">
                    <div>
                      <h4 className="font-medium text-foreground">{cat.category}</h4>
                      <p className="text-sm text-muted-foreground">{cat.incidents} incidents</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm font-medium text-foreground">{cat.avgMTTR}m</p>
                        <p className="text-xs text-muted-foreground">Avg MTTR</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-2 bg-background rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 rounded-full"
                              style={{ width: `${cat.resolution}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-foreground">{cat.resolution}%</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Resolution</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
