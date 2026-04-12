"use client"

import { UserRound, UserX, Flag, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

export type IncidentsOwnershipQuickFilter = "all" | "mine" | "unassigned"

interface IncidentsOperatorChipsProps {
  ownershipFilter: IncidentsOwnershipQuickFilter
  onOwnershipFilterChange: (value: IncidentsOwnershipQuickFilter) => void
  majorFilter: string
  onMajorFilterChange: (value: string) => void
  activeTab: string
  onActiveTabChange: (value: string) => void
  actorName: string
  defaultActorName: string
}

export function IncidentsOperatorChips({
  ownershipFilter,
  onOwnershipFilterChange,
  majorFilter,
  onMajorFilterChange,
  activeTab,
  onActiveTabChange,
  actorName,
  defaultActorName,
}: IncidentsOperatorChipsProps) {
  const mineDisabled = actorName.trim() === defaultActorName.trim()

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border/70 bg-secondary/25 px-3 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/85 shrink-0">
        Quick filters
      </span>
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          disabled={mineDisabled}
          title={
            mineDisabled
              ? "Select a teammate under “Acting as” to filter incidents assigned to you."
              : undefined
          }
          onClick={() =>
            onOwnershipFilterChange(ownershipFilter === "mine" ? "all" : "mine")
          }
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
            ownershipFilter === "mine"
              ? "border-primary/40 bg-primary text-primary-foreground"
              : "border-border/60 bg-card/80 text-muted-foreground hover:bg-secondary/80 hover:text-foreground",
            mineDisabled && "pointer-events-none opacity-50",
          )}
        >
          <UserRound className="h-3.5 w-3.5" aria-hidden />
          Mine
        </button>
        <button
          type="button"
          onClick={() =>
            onOwnershipFilterChange(
              ownershipFilter === "unassigned" ? "all" : "unassigned",
            )
          }
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
            ownershipFilter === "unassigned"
              ? "border-amber-500/45 bg-amber-500/15 text-foreground"
              : "border-border/60 bg-card/80 text-muted-foreground hover:bg-secondary/80 hover:text-foreground",
          )}
        >
          <UserX className="h-3.5 w-3.5" aria-hidden />
          Unassigned
        </button>
        <button
          type="button"
          onClick={() =>
            onMajorFilterChange(majorFilter === "major" ? "all" : "major")
          }
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
            majorFilter === "major"
              ? "border-rose-500/45 bg-rose-500/15 text-rose-100"
              : "border-border/60 bg-card/80 text-muted-foreground hover:bg-secondary/80 hover:text-foreground",
          )}
        >
          <Flag className="h-3.5 w-3.5" aria-hidden />
          Major
        </button>
        <button
          type="button"
          onClick={() =>
            onActiveTabChange(activeTab === "active" ? "all" : "active")
          }
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
            activeTab === "active"
              ? "border-orange-500/40 bg-orange-500/15 text-foreground"
              : "border-border/60 bg-card/80 text-muted-foreground hover:bg-secondary/80 hover:text-foreground",
          )}
        >
          <Zap className="h-3.5 w-3.5" aria-hidden />
          Active
        </button>
      </div>
    </div>
  )
}
