import { AppShell } from "@/components/app-shell"
import { KPICards } from "@/components/dashboard/kpi-cards"
import { IncidentsTable } from "@/components/dashboard/incidents-table"
import { SystemHealth } from "@/components/dashboard/system-health"
import { RunbookSuggestions } from "@/components/dashboard/runbook-suggestions"
import {
  IncidentTrendChart,
  CategoryDistributionChart,
} from "@/components/dashboard/incident-charts"

export default function DashboardPage() {
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

      {/* KPI Cards */}
      <KPICards />

      {/* Main Content Grid */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Charts Section */}
        <div className="space-y-6 lg:col-span-2">
          <div className="grid gap-6 md:grid-cols-2">
            <IncidentTrendChart />
            <CategoryDistributionChart />
          </div>
          {/* Incidents Table */}
          <IncidentsTable />
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
