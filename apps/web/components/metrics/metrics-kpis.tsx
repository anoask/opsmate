'use client'

import { Card, CardContent } from '@/components/ui/card'
import type { MetricCard } from '@/lib/types'
import { Clock, CheckCircle, AlertCircle, TrendingDown } from 'lucide-react'
import type { MetricsIncidentKpi } from '@/lib/metrics/incidents'

interface MetricsKPIsProps {
  kpis: MetricsIncidentKpi
  isLoading?: boolean
}

export function MetricsKPIs({ kpis, isLoading = false }: MetricsKPIsProps) {
  const metricCards: MetricCard[] = [
    {
      label: 'Avg MTTR',
      value: kpis.avgMttr,
      icon: Clock,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      trend: 'From resolved incidents',
      trendColor: 'text-muted-foreground',
    },
    {
      label: 'Incidents Resolved Today',
      value: kpis.resolvedToday,
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      trend: 'Backend-backed daily count',
      trendColor: 'text-muted-foreground',
    },
    {
      label: 'Active Incidents',
      value: kpis.activeIncidents,
      icon: AlertCircle,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      trend: 'Open or investigating',
      trendColor: 'text-muted-foreground',
    },
    {
      label: 'Critical Incidents',
      value: kpis.criticalIncidents,
      icon: TrendingDown,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      trend: 'Active critical incidents',
      trendColor: 'text-muted-foreground',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metricCards.map((kpi) => {
        const Icon = kpi.icon
        return (
          <Card key={kpi.label} className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
                  <p className="text-3xl font-bold text-foreground mt-2">
                    {isLoading ? '...' : kpi.value}
                  </p>
                  <p className={`text-xs mt-2 ${kpi.trendColor}`}>{kpi.trend}</p>
                </div>
                <div className={`${kpi.bgColor} p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${kpi.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
