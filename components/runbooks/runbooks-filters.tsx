'use client'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search } from 'lucide-react'

interface RunbooksFiltersProps {
  onSearchChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onSeverityChange: (value: string) => void
}

export function RunbooksFilters({
  onSearchChange,
  onCategoryChange,
  onSeverityChange,
}: RunbooksFiltersProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/80">
          Search
        </p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title or ID..."
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-10 border-border/70 bg-card/80 pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/80">
            Category
          </p>
          <Select onValueChange={onCategoryChange} defaultValue="all">
            <SelectTrigger className="h-10 border-border/70 bg-card/80">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Infrastructure">Infrastructure</SelectItem>
              <SelectItem value="Database">Database</SelectItem>
              <SelectItem value="Application">Application</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/80">
            Severity
          </p>
          <Select onValueChange={onSeverityChange} defaultValue="all">
            <SelectTrigger className="h-10 border-border/70 bg-card/80">
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
        </div>
      </div>
    </div>
  )
}
