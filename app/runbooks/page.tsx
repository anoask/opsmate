'use client'

import { useState, useMemo } from 'react'
import { AppShell } from '@/components/app-shell'
import { runbooks as allRunbooks } from '@/lib/mock-data'
import { RunbooksFilters } from '@/components/runbooks/runbooks-filters'
import { RunbooksTable } from '@/components/runbooks/runbooks-table'
import { RunbookDetailSheet } from '@/components/runbooks/runbook-detail-sheet'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Runbook } from '@/lib/types'

export default function RunbooksPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedSeverity, setSelectedSeverity] = useState('all')
  const [selectedRunbook, setSelectedRunbook] = useState<Runbook | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const filteredRunbooks = useMemo(() => {
    return allRunbooks.filter((runbook) => {
      const matchesSearch =
        runbook.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        runbook.id.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory =
        selectedCategory === 'all' || runbook.category === selectedCategory

      const matchesSeverity =
        selectedSeverity === 'all' || runbook.severity === selectedSeverity

      return matchesSearch && matchesCategory && matchesSeverity
    })
  }, [searchQuery, selectedCategory, selectedSeverity])

  const stats = useMemo(() => {
    return {
      total: allRunbooks.length,
      avgSuccess:
        Math.round(
          allRunbooks.reduce((sum, rb) => sum + rb.successRate, 0) /
            allRunbooks.length
        ) + '%',
      totalUsage: allRunbooks.reduce((sum, rb) => sum + rb.usageCount, 0),
      criticalCount: allRunbooks.filter((rb) => rb.severity === 'critical')
        .length,
    }
  }, [])

  const handleSelectRunbook = (runbook: Runbook) => {
    setSelectedRunbook(runbook)
    setSheetOpen(true)
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
            Browse and manage operational runbooks for incident response
          </p>
        </div>

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
                Showing {filteredRunbooks.length} of {allRunbooks.length} runbooks
              </p>
            </div>

            {filteredRunbooks.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="pt-8 pb-8 text-center">
                  <p className="text-muted-foreground">
                    No runbooks found matching your filters.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <RunbooksTable
                runbooks={filteredRunbooks}
                onSelect={handleSelectRunbook}
              />
            )}
          </div>
        </div>
      </div>

      {/* Runbook Detail Sheet */}
      <RunbookDetailSheet
        runbook={selectedRunbook}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </AppShell>
  )
}
