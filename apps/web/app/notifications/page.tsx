"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { AlertTriangle, RefreshCw } from "lucide-react"

import { useActor } from "@/components/actor-context"
import { AppShell } from "@/components/app-shell"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  getNotificationCenterFeed,
  retryRecentFailedSlackNotifications,
  retrySlackNotification,
} from "@/lib/api/notifications"
import {
  formatSlackDeliveryDetail,
  incidentNotificationTypeLabels,
  slackDeliveryStatusBadgeClassName,
  slackDeliveryStatusLabels,
  slackRetryHint,
} from "@/lib/notification-center-present"
import { incidentSeverityBadgeStyles } from "@/lib/presentation"
import { cn } from "@/lib/utils"
import type { NotificationCenterItem, SlackDeliveryStatus } from "@/lib/types"

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

export default function NotificationsPage() {
  return (
    <AppShell mainClassName="p-6">
      <NotificationsPageInner />
    </AppShell>
  )
}

function NotificationsPageInner() {
  const { can } = useActor()
  const canReplaySlack = can("notifications:replay")
  const [items, setItems] = useState<NotificationCenterItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeRetryId, setActiveRetryId] = useState<string | null>(null)
  const [isRetryingBatch, setIsRetryingBatch] = useState(false)
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(null)
  const [readFilter, setReadFilter] = useState<"all" | "unread" | "read">("all")
  const [slackFilter, setSlackFilter] = useState<"all" | SlackDeliveryStatus | "attention">(
    "all",
  )

  const refresh = useCallback(async () => {
    setError(null)
    setIsLoading(true)
    try {
      const feed = await getNotificationCenterFeed(40)
      setItems(feed.items)
      setUnreadCount(feed.unreadCount)
      setLastRefreshedAt(new Date().toISOString())
    } catch {
      setItems([])
      setUnreadCount(0)
      setError("Unable to load notifications right now.")
      setLastRefreshedAt(new Date().toISOString())
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const handleRetrySingle = async (notificationId: string) => {
    setActiveRetryId(notificationId)
    setError(null)
    try {
      await retrySlackNotification(notificationId)
      await refresh()
    } catch {
      setError("Unable to retry Slack delivery for this notification.")
    } finally {
      setActiveRetryId(null)
    }
  }

  const failedSlackInFeed = useMemo(
    () => items.filter((i) => i.slackDeliveryStatus === "failed").length,
    [items],
  )

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (readFilter === "unread" && item.readAt) return false
      if (readFilter === "read" && !item.readAt) return false
      if (slackFilter === "all") return true
      if (slackFilter === "attention") {
        return item.slackDeliveryStatus === "failed" || item.slackDeliveryStatus === "skipped"
      }
      return item.slackDeliveryStatus === slackFilter
    })
  }, [items, readFilter, slackFilter])

  const sortedItems = useMemo(() => {
    const rank = (s: SlackDeliveryStatus) =>
      s === "failed" ? 0 : s === "skipped" ? 1 : s === "not_attempted" ? 2 : 3
    return [...filteredItems].sort((a, b) => {
      const rd = rank(a.slackDeliveryStatus) - rank(b.slackDeliveryStatus)
      if (rd !== 0) return rd
      if (Boolean(a.readAt) !== Boolean(b.readAt)) {
        return a.readAt ? 1 : -1
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [filteredItems])

  const handleRetryBatch = async () => {
    setIsRetryingBatch(true)
    setError(null)
    try {
      await retryRecentFailedSlackNotifications(5)
      await refresh()
    } catch {
      setError("Unable to retry recent failed Slack deliveries.")
    } finally {
      setIsRetryingBatch(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Notifications
            </h1>
            <p className="text-sm text-muted-foreground">
              In-app feed and Slack delivery audit; retry failed deliveries.
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="border-border/70 bg-secondary/40 text-[10px]">
                Live API
              </Badge>
              <span>Last refreshed: {lastRefreshedAt ? new Date(lastRefreshedAt).toLocaleTimeString() : "—"}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-border/70 bg-secondary/40">
              {unreadCount} unread
            </Badge>
            <Button
              variant="outline"
              onClick={() => void handleRetryBatch()}
              disabled={!canReplaySlack || isRetryingBatch || isLoading}
              title={
                !canReplaySlack
                  ? "Viewers cannot replay Slack deliveries."
                  : `${failedSlackInFeed} failed (Slack) in the loaded feed — batch retry uses recent failures from the server.`
              }
            >
              {isRetryingBatch ? "Retrying…" : "Retry recent Slack failures"}
            </Button>
            <Button variant="outline" onClick={() => void refresh()} disabled={isLoading}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <Alert className="border-border/70 bg-card/70">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <AlertTitle>Couldn’t load</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="border-border/70 bg-card/70">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base">Feed</CardTitle>
              <p className="text-xs text-muted-foreground">
                Includes Slack status per row; open incident from id link. Read/unread is stored
                state only.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select
                value={readFilter}
                onValueChange={(v) => setReadFilter(v as "all" | "unread" | "read")}
                disabled={isLoading || items.length === 0}
              >
                <SelectTrigger className="h-9 w-[130px] border-border/70 bg-secondary/70 text-xs">
                  <SelectValue placeholder="Read" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={slackFilter}
                onValueChange={(v) =>
                  setSlackFilter(v as "all" | SlackDeliveryStatus | "attention")
                }
                disabled={isLoading || items.length === 0}
              >
                <SelectTrigger className="h-9 w-[168px] border-border/70 bg-secondary/70 text-xs">
                  <SelectValue placeholder="Slack" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Slack: All</SelectItem>
                  <SelectItem value="attention">Slack: Needs attention</SelectItem>
                  <SelectItem value="failed">Slack: Failed</SelectItem>
                  <SelectItem value="skipped">Slack: Skipped</SelectItem>
                  <SelectItem value="delivered">Slack: Delivered</SelectItem>
                  <SelectItem value="not_attempted">Slack: Not sent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner className="size-4" />
                Loading…
              </div>
            ) : items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No rows returned.</p>
            ) : sortedItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No rows match filters.
              </p>
            ) : (
              sortedItems.map((item) => {
                const detailText = formatSlackDeliveryDetail(item.slackDeliveryDetail)
                const retryNote = slackRetryHint(item)
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "rounded-lg border border-border/60 bg-secondary/30 p-3 space-y-2",
                      !item.readAt && "border-l-2 border-l-primary/40",
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <Badge
                        variant="outline"
                        className={incidentSeverityBadgeStyles[item.incidentSeverity]}
                      >
                        {item.incidentSeverity}
                      </Badge>
                      <Badge variant="outline" className="border-border/70 bg-card/50 text-[10px]">
                        {incidentNotificationTypeLabels[item.type]}
                      </Badge>
                      <Badge variant={item.readAt ? "secondary" : "outline"}>
                        {item.readAt ? "Read" : "Unread"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.message}</p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                      <Link
                        href={`/incidents?incident=${encodeURIComponent(item.incidentId)}`}
                        className="font-mono text-primary underline-offset-2 hover:underline"
                      >
                        {item.incidentId}
                      </Link>
                      <span className="text-border">·</span>
                      <span className="max-w-[min(100%,280px)] truncate">{item.incidentTitle}</span>
                      <span className="text-border">·</span>
                      <span className="tabular-nums">{formatTime(item.createdAt)}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px]",
                          slackDeliveryStatusBadgeClassName[item.slackDeliveryStatus],
                        )}
                      >
                        {slackDeliveryStatusLabels[item.slackDeliveryStatus]}
                      </Badge>
                      {item.slackAttemptedAt ? (
                        <span className="text-xs text-muted-foreground">
                          Last attempt {formatTime(item.slackAttemptedAt)}
                        </span>
                      ) : null}
                      {detailText ? (
                        <span className="text-xs text-muted-foreground">({detailText})</span>
                      ) : null}
                      {item.retryEligible ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!canReplaySlack || activeRetryId === item.id}
                          title={
                            !canReplaySlack
                              ? "Viewers cannot replay Slack deliveries."
                              : "Replay Slack for this failed delivery"
                          }
                          onClick={() => void handleRetrySingle(item.id)}
                        >
                          {activeRetryId === item.id ? "Retrying..." : "Retry Slack"}
                        </Button>
                      ) : retryNote ? (
                        <span className="text-[11px] text-muted-foreground">{retryNote}</span>
                      ) : null}
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>
  )
}
