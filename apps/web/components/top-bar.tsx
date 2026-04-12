"use client"

import { useCallback, useEffect, useState } from "react"
import { Bell, Search, UserCircle } from "lucide-react"
import Link from "next/link"
import { useActor } from "@/components/actor-context"
import { getNotificationFeed } from "@/lib/api/notifications"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { incidentSeverityBadgeStyles } from "@/lib/presentation"
import type { IncidentNotification } from "@/lib/types"

function formatNotificationTimestamp(createdAt: string) {
  const date = new Date(createdAt)

  if (Number.isNaN(date.getTime())) {
    return createdAt
  }

  return date.toLocaleString([], {
    day: "numeric",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "short",
  })
}

export function TopBar() {
  const { actorName, sessionUser, sessionReady, currentRole, signOut } = useActor()
  const [notifications, setNotifications] = useState<IncidentNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true)

  const refreshNotifications = useCallback(async () => {
    try {
      const feed = await getNotificationFeed(8)
      setNotifications(feed.notifications)
      setUnreadCount(feed.unreadCount)
    } catch {
      // Keep the top bar non-blocking when notifications are unavailable.
    } finally {
      setIsLoadingNotifications(false)
    }
  }, [])

  useEffect(() => {
    void refreshNotifications()

    const intervalId = window.setInterval(() => {
      void refreshNotifications()
    }, 30000)

    return () => window.clearInterval(intervalId)
  }, [refreshNotifications])

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/70 bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      {/* Search */}
      <div className="relative w-full max-w-lg">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search incidents, runbooks..."
          className="h-10 border-border/70 bg-secondary/70 pl-9"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Environment Selector */}
        <Select defaultValue="prod">
          <SelectTrigger className="h-10 w-[132px] border-border/70 bg-secondary/70">
            <SelectValue placeholder="Environment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="prod">Production</SelectItem>
            <SelectItem value="staging">Staging</SelectItem>
            <SelectItem value="dev">Development</SelectItem>
          </SelectContent>
        </Select>

        {sessionReady && sessionUser ? (
          <div className="hidden items-center gap-2 md:flex">
            <UserCircle className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Signed in
              </span>
              <div className="flex h-9 max-w-[240px] items-center gap-2 rounded-md border border-border/70 bg-secondary/70 px-2">
                <span className="truncate text-xs font-medium text-foreground">{actorName}</span>
                {currentRole ? (
                  <Badge variant="secondary" className="shrink-0 text-[10px] capitalize">
                    {currentRole}
                  </Badge>
                ) : null}
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 border-border/70 text-xs"
              onClick={() => void signOut()}
            >
              Sign out
            </Button>
          </div>
        ) : null}

        {/* Notifications */}
        <DropdownMenu onOpenChange={(open) => open && void refreshNotifications()}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-muted-foreground">
              <Bell className="h-5 w-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-[380px] border-border/70 bg-card p-0"
          >
            <div className="border-b border-border/70 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Notifications</p>
                  <p className="text-xs text-muted-foreground">
                    Operational updates from incident lifecycle activity
                  </p>
                </div>
                {unreadCount > 0 && (
                  <Badge variant="outline" className="border-border/70 bg-secondary/40">
                    {unreadCount} unread
                  </Badge>
                )}
              </div>
            </div>
            <ScrollArea className="max-h-96">
              <div className="space-y-2 p-3">
                {isLoadingNotifications ? (
                  <p className="px-1 py-6 text-center text-sm text-muted-foreground">
                    Loading notifications...
                  </p>
                ) : notifications.length === 0 ? (
                  <p className="px-1 py-6 text-center text-sm text-muted-foreground">
                    No incident notifications yet.
                  </p>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="rounded-lg border border-border/60 bg-secondary/25 p-3"
                    >
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">
                            {notification.title}
                          </p>
                          <Link
                            href={`/incidents?incident=${encodeURIComponent(notification.incidentId)}`}
                            className="text-xs font-mono text-primary underline-offset-2 hover:underline"
                          >
                            {notification.incidentId}
                          </Link>
                        </div>
                        <Badge
                          variant="outline"
                          className={incidentSeverityBadgeStyles[notification.incidentSeverity]}
                        >
                          {notification.incidentSeverity}
                        </Badge>
                      </div>
                      <p className="text-sm leading-5 text-muted-foreground">
                        {notification.message}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {formatNotificationTimestamp(notification.createdAt)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
            <div className="border-t border-border/70 p-2">
              <Button asChild variant="ghost" className="w-full justify-center">
                <Link href="/notifications">Open notification center</Link>
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Avatar */}
        <Avatar className="h-8 w-8 cursor-pointer">
          <AvatarImage src="https://github.com/shadcn.png" alt="User" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
