'use client'

import { AppShell } from '@/components/app-shell'
import { MetricsKPIs } from '@/components/metrics/metrics-kpis'
import { MTTRChart } from '@/components/metrics/mttr-chart'
import { IncidentVolumeChart } from '@/components/metrics/incident-volume-chart'
import { TeamPerformance } from '@/components/metrics/team-performance'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { incidentCategoryBreakdown } from '@/lib/mock-data'
import { Calendar } from 'lucide-react'

export default function MetricsPage() {
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
            <Select defaultValue="7d">
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
        {/* KPIs */}
        <MetricsKPIs />

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MTTRChart />
          <IncidentVolumeChart />
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
            <div className="space-y-3">
              {incidentCategoryBreakdown.map((cat) => (
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
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
