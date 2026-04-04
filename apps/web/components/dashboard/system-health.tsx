import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { serviceStatuses } from "@/lib/mock-data"
import { systemHealthStatusMeta } from "@/lib/presentation"

export function SystemHealth() {
  return (
    <Card className="bg-card border-border shadow-black/20">
      <CardHeader>
        <CardTitle className="text-base font-semibold">System Health</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {serviceStatuses.map((service) => {
          const config = systemHealthStatusMeta[service.status]
          const Icon = config.icon
          return (
            <div
              key={service.name}
              className="flex items-center justify-between rounded-lg border border-border/50 bg-secondary/65 px-3 py-2.5 shadow-sm shadow-black/5"
            >
              <span className="text-sm font-medium leading-5 text-foreground">
                {service.name}
              </span>
              <div className="flex items-center gap-1.5">
                <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                <span className={`text-[13px] leading-5 ${config.color}`}>
                  {config.label}
                </span>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
