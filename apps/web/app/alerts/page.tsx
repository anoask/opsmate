"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AlertTriangle } from "lucide-react"

import { AppShell } from "@/components/app-shell"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getAlertHistory } from "@/lib/api/alerts"
import { incidentSeverityBadgeStyles } from "@/lib/presentation"
import type { AlertHistoryItem, AlertIngestDisposition } from "@/lib/types"

type DispositionFilter = "all" | AlertIngestDisposition

function formatTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString([], {
    day: "numeric",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "short",
  })
}

export default function AlertsHistoryPage() {
  const [items, setItems] = useState<AlertHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(null)
  const [limit, setLimit] = useState("30")
  const [disposition, setDisposition] = useState<DispositionFilter>("all")

  useEffect(() => {
    let isMounted = true

    async function load() {
      setIsLoading(true)
      setError(null)

      try {
        const feed = await getAlertHistory(
          Number(limit),
          disposition === "all" ? undefined : disposition,
        )

        if (!isMounted) {
          return
        }
        setItems(feed.items)
        setLastRefreshedAt(new Date().toISOString())
      } catch {
        if (!isMounted) {
          return
        }
        setItems([])
        setError("Unable to load alert history right now.")
        setLastRefreshedAt(new Date().toISOString())
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      isMounted = false
    }
  }, [disposition, limit])

  return (
    <AppShell mainClassName="p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Alerts
          </h1>
          <p className="text-sm text-muted-foreground">
            Ingest log: new incidents vs merges into an open incident.
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="border-border/70 bg-secondary/40 text-[10px]">
              Live API
            </Badge>
            <span>Last refreshed: {lastRefreshedAt ? new Date(lastRefreshedAt).toLocaleTimeString() : "—"}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={disposition} onValueChange={(value) => setDisposition(value as DispositionFilter)}>
            <SelectTrigger className="w-[220px] bg-secondary border-border">
              <SelectValue placeholder="Disposition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All dispositions</SelectItem>
              <SelectItem value="incident_created">Created incidents</SelectItem>
              <SelectItem value="incident_merged">Merged into incidents</SelectItem>
            </SelectContent>
          </Select>
          <Select value={limit} onValueChange={setLimit}>
            <SelectTrigger className="w-[160px] bg-secondary border-border">
              <SelectValue placeholder="Limit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="20">20 results</SelectItem>
              <SelectItem value="30">30 results</SelectItem>
              <SelectItem value="50">50 results</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {error && (
          <Alert className="border-border/70 bg-card/70">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <AlertTitle>Couldn’t load</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="border-border/70 bg-card/70">
          <CardHeader>
            <CardTitle className="text-base">Ingest log</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No rows in this range.</p>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-border/60 bg-secondary/30 p-3 space-y-2"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={incidentSeverityBadgeStyles[item.severity]}>
                      {item.severity}
                    </Badge>
                    <Badge variant="outline">
                      {item.disposition === "incident_created" ? "Created" : "Merged"}
                    </Badge>
                    <Badge variant="secondary">{item.category}</Badge>
                    <span className="text-xs text-muted-foreground">{formatTime(item.ingestedAt)}</span>
                  </div>
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.source}</p>
                  <div className="text-xs text-muted-foreground">
                    Incident:{" "}
                    <Link href="/incidents" className="text-primary hover:underline">
                      {item.incidentId}
                    </Link>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
