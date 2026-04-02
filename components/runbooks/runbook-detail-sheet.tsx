'use client'

import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, Download, Play } from 'lucide-react'
import {
  runbookExecutionStatusMeta,
  runbookSeverityBadgeStyles,
} from '@/lib/presentation'
import type { Runbook } from '@/lib/types'

interface RunbookDetailSheetProps {
  runbook: Runbook | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RunbookDetailSheet({
  runbook,
  open,
  onOpenChange,
}: RunbookDetailSheetProps) {
  const [executing, setExecuting] = useState(false)

  if (!runbook) return null

  const handleExecute = () => {
    setExecuting(true)
    setTimeout(() => setExecuting(false), 1500)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <SheetTitle className="text-2xl">{runbook.title}</SheetTitle>
                <p className="mt-1 text-[13px] leading-5 text-muted-foreground/90">
                  {runbook.id}
                </p>
              </div>
              <Badge className={runbookSeverityBadgeStyles[runbook.severity]}>
                {runbook.severity}
              </Badge>
            </div>
            <p className="text-sm leading-6 text-muted-foreground/90">
              {runbook.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-card border-border">
              <CardContent className="pt-4">
                <p className="text-sm leading-5 text-muted-foreground/90">Success Rate</p>
                <p className="text-2xl font-bold text-green-400 mt-1">
                  {runbook.successRate}%
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="pt-4">
                <p className="text-sm leading-5 text-muted-foreground/90">Avg Execution</p>
                <p className="text-2xl font-bold text-blue-400 mt-1">
                  {runbook.avgExecutionTime}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="pt-4">
                <p className="text-sm leading-5 text-muted-foreground/90">Usage Count</p>
                <p className="text-2xl font-bold text-purple-400 mt-1">
                  {runbook.usageCount}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="pt-4">
                <p className="text-sm leading-5 text-muted-foreground/90">Created By</p>
                <p className="mt-1 truncate text-sm font-semibold leading-5">
                  {runbook.createdBy}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleExecute}
              disabled={executing}
              className="gap-2 flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Play className="w-4 h-4" />
              {executing ? 'Executing...' : 'Execute Runbook'}
            </Button>
            <Button variant="outline" size="icon" className="border-border">
              <Download className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-1">
            {runbook.tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="bg-background border-border text-foreground"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </SheetHeader>

        <Tabs defaultValue="steps" className="mt-6 space-y-4">
          <TabsList className="grid w-full grid-cols-2 bg-sidebar border-border">
            <TabsTrigger value="steps">Steps</TabsTrigger>
            <TabsTrigger value="executions">Executions</TabsTrigger>
          </TabsList>

          <TabsContent value="steps" className="space-y-4">
            {runbook.steps.map((step) => (
              <Card key={step.id} className="bg-card border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-sidebar font-semibold text-sm">
                      {step.order}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base">{step.title}</CardTitle>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground/90">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                {step.command && (
                  <CardContent className="pt-0">
                    <div className="bg-background border border-border rounded p-3 font-mono text-xs text-foreground/80 overflow-x-auto">
                      <code>{step.command}</code>
                    </div>
                    {step.expectedOutput && (
                      <p className="mt-2 text-[13px] leading-5 text-muted-foreground/90">
                        Expected: {step.expectedOutput}
                      </p>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="executions" className="space-y-4">
            {runbook.executions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                No execution history yet.
              </p>
            ) : (
              runbook.executions.map((exec) => (
                <Card key={exec.id} className="bg-card border-border">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        {(() => {
                          const {
                            icon: StatusIcon,
                            iconClassName,
                          } = runbookExecutionStatusMeta[exec.status]

                          return <StatusIcon className={`w-4 h-4 ${iconClassName}`} />
                        })()}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-sm">
                              {exec.executedBy}
                            </p>
                            <span className="text-[13px] leading-5 text-muted-foreground/90">
                              {exec.timestamp}
                            </span>
                          </div>
                          {exec.incidentId && (
                            <p className="mt-1 text-[13px] leading-5 text-blue-400">
                              Incident: {exec.incidentId}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span className="text-[13px] leading-5 text-muted-foreground/90">
                              {exec.duration}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge
                        className={runbookExecutionStatusMeta[exec.status].badgeClassName}
                      >
                        {exec.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
