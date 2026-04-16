import { AlertTriangle, GitMerge } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AlertActivityItem } from '@/lib/types'

function formatActivityTime(value: string) {
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

export function AlertsActivity({
  items,
  isLoading,
}: {
  items: AlertActivityItem[]
  isLoading?: boolean
}) {
  return (
    <Card className="border-border bg-card shadow-black/20">
      <CardHeader className="flex flex-row items-center gap-2">
        <GitMerge className="h-4 w-4 text-primary" />
        <CardTitle className="text-base font-semibold">Ingest activity</CardTitle>
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
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {item.incidentId} - {item.incidentTitle}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatActivityTime(item.createdAt)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="h-6">
                  {item.type === 'alert_merged' ? (
                    <GitMerge className="mr-1 h-3 w-3 text-sky-400" />
                  ) : (
                    <AlertTriangle className="mr-1 h-3 w-3 text-amber-400" />
                  )}
                  {item.type === 'alert_merged' ? 'Merged' : 'Created'}
                </Badge>
                <Badge variant="secondary" className="h-6 px-2">
                  {item.incidentSource}
                </Badge>
                <Badge variant="outline" className="h-6 px-2">
                  merges {item.mergeCount}
                </Badge>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
