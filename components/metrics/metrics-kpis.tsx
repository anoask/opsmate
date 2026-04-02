'use client'

import { Card, CardContent } from '@/components/ui/card'
import { kpiData } from '@/lib/mock-data'
import type { MetricCard } from '@/lib/types'
import { Clock, CheckCircle, AlertCircle, TrendingDown } from 'lucide-react'

export function MetricsKPIs() {
  const kpis: MetricCard[] = [
    {
      label: 'Avg MTTR',
      value: kpiData.avgMTTR,
      icon: Clock,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      trend: '↓ 2m from last week',
      trendColor: 'text-green-500',
    },
    {
      label: 'Incidents Resolved Today',
      value: kpiData.resolvedToday,
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      trend: '↑ 4 from yesterday',
      trendColor: 'text-green-500',
    },
    {
      label: 'Active Incidents',
      value: kpiData.activeAlerts,
      icon: AlertCircle,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      trend: '↓ 1 from 2 hours ago',
      trendColor: 'text-green-500',
    },
    {
      label: 'Critical Incidents',
      value: kpiData.criticalIncidents,
      icon: TrendingDown,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      trend: 'No critical incidents this week',
      trendColor: 'text-green-500',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon
        return (
          <Card key={kpi.label} className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
                  <p className="text-3xl font-bold text-foreground mt-2">{kpi.value}</p>
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
