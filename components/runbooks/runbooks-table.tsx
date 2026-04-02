'use client'

import { Badge } from '@/components/ui/badge'
import { Clock3, Percent, TrendingUp } from 'lucide-react'
import { runbookSeverityBadgeStyles } from '@/lib/presentation'
import type { Runbook } from '@/lib/types'

interface RunbooksTableProps {
  runbooks: Runbook[]
  onSelect: (runbook: Runbook) => void
}

export function RunbooksTable({ runbooks, onSelect }: RunbooksTableProps) {
  return (
    <div className="space-y-3">
      {runbooks.map((runbook) => (
        <button
          key={runbook.id}
          onClick={() => onSelect(runbook)}
          className="w-full rounded-xl border border-border/80 bg-card/95 p-4 text-left shadow-sm shadow-black/10 transition-[background-color,border-color,box-shadow] hover:border-border hover:bg-sidebar/70 hover:shadow-md hover:shadow-black/15"
        >
          <div className="flex items-start justify-between gap-5">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2.5">
                <span className="font-mono text-[13px] font-medium leading-5 text-muted-foreground/90">
                  {runbook.id}
                </span>
                <Badge className={runbookSeverityBadgeStyles[runbook.severity]}>
                  {runbook.severity}
                </Badge>
                <Badge variant="outline" className="bg-background border-border">
                  {runbook.category}
                </Badge>
              </div>
              <p className="text-base font-semibold leading-6 text-foreground">
                {runbook.title}
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground/90">
                {runbook.description}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {runbook.tags.slice(0, 3).map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="border-border/70 bg-background/70 text-[11px] capitalize text-muted-foreground/95"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="w-44 flex-shrink-0 rounded-lg border border-border/50 bg-secondary/35 px-3.5 py-3">
              <div className="flex items-center justify-between whitespace-nowrap text-[13px] leading-5">
                <div className="flex items-center gap-1 text-green-400">
                  <Percent className="w-3 h-3" />
                  <span className="font-semibold">{runbook.successRate}%</span>
                </div>
                <div className="flex items-center gap-1 text-blue-400">
                  <TrendingUp className="w-3 h-3" />
                  <span className="font-semibold">{runbook.usageCount}</span>
                </div>
              </div>
              <div className="mt-3 space-y-1.5 text-[13px] leading-5 text-muted-foreground/90">
                <p>By {runbook.createdBy}</p>
                <p className="flex items-center gap-1.5">
                  <Clock3 className="h-3 w-3" />
                  Avg {runbook.avgExecutionTime}
                </p>
                {runbook.lastExecuted && <p>Last run {runbook.lastExecuted.slice(0, 10)}</p>}
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
