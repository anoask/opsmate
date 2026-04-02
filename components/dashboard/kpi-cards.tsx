import { AlertCircle, CheckCircle2, Clock, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { kpiData } from "@/lib/mock-data"
import type { MetricCard } from "@/lib/types"

const kpis: MetricCard[] = [
  {
    label: "Active Alerts",
    value: kpiData.activeAlerts,
    icon: AlertCircle,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  {
    label: "Resolved Today",
    value: kpiData.resolvedToday,
    icon: CheckCircle2,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    label: "Avg MTTR",
    value: kpiData.avgMTTR,
    icon: Clock,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    label: "Critical Incidents",
    value: kpiData.criticalIncidents,
    icon: AlertTriangle,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
]

export function KPICards() {
  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon
        return (
          <Card key={kpi.label} className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/80">
                {kpi.label}
              </CardTitle>
              <div className={`rounded-lg p-2 ${kpi.bgColor}`}>
                <Icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-semibold tracking-tight text-foreground">
                {kpi.value}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
