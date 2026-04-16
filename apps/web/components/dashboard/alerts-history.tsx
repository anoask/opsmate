import { ArrowRight, History } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AlertHistoryItem } from '@/lib/types'

function formatTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
  })
}

export function AlertsHistory({
  items,
  isLoading,
}: {
  items: AlertHistoryItem[]
  isLoading?: boolean
}) {
  return (
    <Card className="border-border bg-card shadow-black/20">
      <CardHeader className="flex flex-row items-center gap-2">
        <History className="h-4 w-4 text-primary" />
        <CardTitle className="text-base font-semibold">Recent ingests</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-muted-foreground">No recent ingests.</div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="space-y-2 rounded-lg border border-border/50 bg-secondary/55 p-3 shadow-sm shadow-black/5"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="truncate text-sm font-medium text-foreground">
                  {item.source} <ArrowRight className="mx-1 inline h-3 w-3" /> {item.incidentId}
                </p>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatTime(item.ingestedAt)}
                </span>
              </div>
              <p className="truncate text-xs text-muted-foreground">{item.title}</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="h-6 px-2">
                  {item.disposition === 'incident_created' ? 'Created' : 'Merged'}
                </Badge>
                <Badge variant="secondary" className="h-6 px-2">
                  {item.category}
                </Badge>
                <Badge variant="outline" className="h-6 px-2">
                  {item.severity}
                </Badge>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
