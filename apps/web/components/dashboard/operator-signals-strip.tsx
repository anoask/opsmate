"use client"

import Link from "next/link"
import { ListTodo, UserCheck, UserRound } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface OperatorSignalsStripProps {
  unassignedActive: number
  unassignedHighSeverity: number
  mineActive: number
  overdueFollowUps: number
  isLoading?: boolean
  mineDisabled?: boolean
}

export function OperatorSignalsStrip({
  unassignedActive,
  unassignedHighSeverity,
  mineActive,
  overdueFollowUps,
  isLoading = false,
  mineDisabled = false,
}: OperatorSignalsStripProps) {
  return (
    <div className="mb-6 flex flex-col gap-3 rounded-xl border border-border/70 bg-card/70 p-4 shadow-sm shadow-black/10 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/85">
          Needs attention
        </span>
        {isLoading ? (
          <span className="text-sm text-muted-foreground">Loading…</span>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <Link
          href="/incidents"
          className={cn(
            "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-secondary/50",
            unassignedActive > 0
              ? "border-amber-500/35 bg-amber-500/[0.06] text-foreground"
              : "border-border/60 bg-secondary/20 text-muted-foreground",
          )}
        >
          <UserRound className="h-4 w-4 shrink-0 text-amber-500/90" aria-hidden />
          <span>
            <span className="font-semibold tabular-nums text-foreground">
              {isLoading ? "—" : unassignedActive}
            </span>
            <span className="text-muted-foreground"> unassigned active</span>
          </span>
          {unassignedHighSeverity > 0 && !isLoading ? (
            <Badge
              variant="outline"
              className="ml-0.5 border-red-500/35 text-[10px] text-red-600 dark:text-red-400"
            >
              {unassignedHighSeverity} high/critical
            </Badge>
          ) : null}
        </Link>
        <div
          className={cn(
            "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
            mineDisabled
              ? "border-border/50 bg-secondary/15 text-muted-foreground/70"
              : mineActive > 0
                ? "border-primary/30 bg-primary/5 text-foreground"
                : "border-border/60 bg-secondary/20 text-muted-foreground",
          )}
          title={
            mineDisabled
              ? "Use “Acting as” in the header to select yourself for “Yours” counts."
              : undefined
          }
        >
          <UserCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          <span>
            <span className="font-semibold tabular-nums text-foreground">
              {isLoading ? "—" : mineActive}
            </span>
            <span className="text-muted-foreground"> yours (active)</span>
          </span>
        </div>
        <Link
          href="/follow-ups"
          className={cn(
            "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-secondary/50",
            overdueFollowUps > 0
              ? "border-red-500/30 bg-red-500/[0.06] text-foreground"
              : "border-border/60 bg-secondary/20 text-muted-foreground",
          )}
        >
          <ListTodo className="h-4 w-4 shrink-0 text-red-500/90" aria-hidden />
          <span>
            <span className="font-semibold tabular-nums text-foreground">
              {isLoading ? "—" : overdueFollowUps}
            </span>
            <span className="text-muted-foreground"> overdue follow-ups</span>
          </span>
          {overdueFollowUps > 0 && !isLoading ? (
            <Badge
              variant="outline"
              className="ml-0.5 border-red-500/35 text-[10px] text-red-600 dark:text-red-400"
            >
              Due
            </Badge>
          ) : null}
        </Link>
      </div>
    </div>
  )
}
