"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface IncidentsFiltersProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  severityFilter: string
  onSeverityChange: (value: string) => void
  sourceFilter: string
  onSourceChange: (value: string) => void
  majorFilter: string
  onMajorChange: (value: string) => void
}

export function IncidentsFilters({
  searchQuery,
  onSearchChange,
  severityFilter,
  onSeverityChange,
  sourceFilter,
  onSourceChange,
  majorFilter,
  onMajorChange,
}: IncidentsFiltersProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card/70 p-4 shadow-sm shadow-black/10 sm:flex-row">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search incidents…"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-10 border-border/70 bg-secondary/70 pl-9"
        />
      </div>
      <Select value={severityFilter} onValueChange={onSeverityChange}>
        <SelectTrigger className="h-10 w-full border-border/70 bg-secondary/70 sm:w-[160px]">
          <SelectValue placeholder="Severity" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Severities</SelectItem>
          <SelectItem value="critical">Critical</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="low">Low</SelectItem>
        </SelectContent>
      </Select>
      <Select value={sourceFilter} onValueChange={onSourceChange}>
        <SelectTrigger className="h-10 w-full border-border/70 bg-secondary/70 sm:w-[160px]">
          <SelectValue placeholder="Source" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Sources</SelectItem>
          <SelectItem value="Datadog">Datadog</SelectItem>
          <SelectItem value="PagerDuty">PagerDuty</SelectItem>
          <SelectItem value="CloudWatch">CloudWatch</SelectItem>
          <SelectItem value="Sentry">Sentry</SelectItem>
          <SelectItem value="Prometheus">Prometheus</SelectItem>
        </SelectContent>
      </Select>
      <Select value={majorFilter} onValueChange={onMajorChange}>
        <SelectTrigger className="h-10 w-full border-border/70 bg-secondary/70 sm:w-[160px]">
          <SelectValue placeholder="Major" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All incidents</SelectItem>
          <SelectItem value="major">Major only</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
