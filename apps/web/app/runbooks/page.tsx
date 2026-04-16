'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, RefreshCw, ServerCrash } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { RunbooksFilters } from '@/components/runbooks/runbooks-filters'
import { RunbooksTable } from '@/components/runbooks/runbooks-table'
import { RunbookDetailSheet } from '@/components/runbooks/runbook-detail-sheet'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import {
  type RunbooksDataSource,
  loadRunbook,
  loadRunbooks,
} from '@/lib/api/runbooks'
import type { Runbook } from '@/lib/types'

export default function RunbooksPage() {
  const [runbooks, setRunbooks] = useState<Runbook[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedSeverity, setSelectedSeverity] = useState('all')
  const [selectedRunbook, setSelectedRunbook] = useState<Runbook | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loadWarning, setLoadWarning] = useState<string | null>(null)
  const [dataSource, setDataSource] = useState<RunbooksDataSource>('backend')
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)

  const refreshRunbooks = useCallback(async () => {
    setIsInitialLoading(true)
    setLoadError(null)

    try {
      const result = await loadRunbooks()
      setRunbooks(result.runbooks)
      setDataSource(result.source)
      setLoadWarning(result.warning ?? null)
    } catch {
      setRunbooks([])
      setDataSource('mock')
      setLoadWarning(null)
      setLoadError('Unable to load runbooks right now. Please try again.')
    } finally {
      setIsInitialLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshRunbooks()
  }, [refreshRunbooks])

  const filteredRunbooks = useMemo(() => {
    return runbooks.filter((runbook) => {
      const matchesSearch =
        runbook.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        runbook.id.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory =
        selectedCategory === 'all' || runbook.category === selectedCategory

      const matchesSeverity =
        selectedSeverity === 'all' || runbook.severity === selectedSeverity

      return matchesSearch && matchesCategory && matchesSeverity
    })
  }, [runbooks, searchQuery, selectedCategory, selectedSeverity])

  const stats = useMemo(() => {
    if (runbooks.length === 0) {
      return {
        total: 0,
        avgSuccess: '0%',
        totalUsage: 0,
        criticalCount: 0,
      }
    }

    return {
      total: runbooks.length,
      avgSuccess:
        Math.round(
          runbooks.reduce((sum, rb) => sum + rb.successRate, 0) / runbooks.length
        ) + '%',
      totalUsage: runbooks.reduce((sum, rb) => sum + rb.usageCount, 0),
      criticalCount: runbooks.filter((rb) => rb.severity === 'critical').length,
    }
  }, [runbooks])

  const handleSelectRunbook = async (runbook: Runbook) => {
    setSelectedRunbook(runbook)
    setSheetOpen(true)
    setDetailError(null)

    if (dataSource === 'mock') {
      return
    }

    setIsDetailLoading(true)

    try {
      const result = await loadRunbook(runbook.id, runbook)
      setSelectedRunbook(result.runbook)

      if (result.warning) {
        setDataSource('mock')
        setLoadWarning(result.warning)
        setDetailError('Live runbook details are unavailable. Showing cached data.')
      }
    } catch {
      setDetailError('Unable to refresh runbook details. Showing the last available data.')
    } finally {
      setIsDetailLoading(false)
    }
  }

  const handleSheetOpenChange = (open: boolean) => {
    setSheetOpen(open)

    if (!open) {
      setDetailError(null)
      setIsDetailLoading(false)
    }
  }

  const renderRunbooksContent = () => {
    if (isInitialLoading) {
      return (
        <Card className="bg-card border-border">
          <CardContent className="flex items-center justify-center gap-3 py-12">
            <Spinner className="size-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Loading runbooks…
            </span>
          </CardContent>
        </Card>
      )
    }

    if (loadError) {
      return (
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <ServerCrash className="h-5 w-5 text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                Unable to load runbooks
              </p>
              <p className="text-sm text-muted-foreground">{loadError}</p>
            </div>
            <Button variant="outline" onClick={() => void refreshRunbooks()}>
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )
    }

    if (filteredRunbooks.length === 0) {
      return (
        <Card className="bg-card border-border">
          <CardContent className="pt-8 pb-8 text-center">
            <p className="text-muted-foreground">
              No runbooks match filters.
            </p>
          </CardContent>
        </Card>
      )
    }

    return (
      <RunbooksTable
        runbooks={filteredRunbooks}
        onSelect={(runbook) => {
          void handleSelectRunbook(runbook)
        }}
      />
    )
  }

  return (
    <AppShell mainClassName="p-6">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-1.5">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Runbooks
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground/90">
            Checklists linked from incidents; each execution is tied to an incident row.
          </p>
        </div>

        {loadWarning && (
          <Alert className="border-border/70 bg-card/70">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <AlertTitle>Limited data</AlertTitle>
            <AlertDescription>{loadWarning}</AlertDescription>
          </Alert>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card className="bg-card border-border">
            <CardContent className="pt-4">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/80">
                Total Runbooks
              </p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-blue-400">
                {stats.total}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-4">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/80">
                Avg Success Rate
              </p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-green-400">
                {stats.avgSuccess}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-4">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/80">
                Total Executions
              </p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-purple-400">
                {stats.totalUsage}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-4">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/80">
                Critical Runbooks
              </p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-red-400">
                {stats.criticalCount}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-card border-border sticky top-20">
              <CardHeader>
                <CardTitle className="text-base">Filters</CardTitle>
                <p className="text-sm leading-6 text-muted-foreground/90">
                  Narrow the library by title, category, and severity.
                </p>
              </CardHeader>
              <CardContent>
                <RunbooksFilters
                  onSearchChange={setSearchQuery}
                  onCategoryChange={setSelectedCategory}
                  onSeverityChange={setSelectedSeverity}
                />
              </CardContent>
            </Card>
          </div>

          {/* Runbooks List */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card/60 px-4 py-3">
              <p className="text-sm leading-6 text-muted-foreground/90">
                Showing {filteredRunbooks.length} of {runbooks.length} runbooks
              </p>
            </div>

            {renderRunbooksContent()}
          </div>
        </div>
      </div>

      {/* Runbook Detail Sheet */}
      <RunbookDetailSheet
        runbook={selectedRunbook}
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        isLoading={isDetailLoading}
        error={detailError}
      />
    </AppShell>
  )
}
