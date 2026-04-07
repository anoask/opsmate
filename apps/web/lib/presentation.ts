import {
  AlertCircle,
  AlertTriangle,
  ArrowUpCircle,
  CheckCircle,
  CheckCircle2,
  Clock,
  MessageSquare,
  Repeat2,
  RotateCcw,
  User,
  XCircle,
  type LucideIcon,
} from 'lucide-react'

import type {
  IncidentTimelineEvent,
  RunbookExecutionStatus,
  Severity,
  Status,
  SystemHealthItem,
} from '@/lib/types'

export const incidentSeverityBadgeStyles: Record<Severity, string> = {
  critical: 'bg-red-500/15 text-red-500 border-red-500/30',
  high: 'bg-orange-500/15 text-orange-500 border-orange-500/30',
  medium: 'bg-yellow-500/15 text-yellow-500 border-yellow-500/30',
  low: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
}

export const incidentStatusBadgeStyles: Record<Status, string> = {
  open: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  acknowledged: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  investigating: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  resolved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
}

export const runbookSeverityBadgeStyles: Record<Severity, string> = {
  critical: 'bg-red-900 text-red-200',
  high: 'bg-orange-900 text-orange-200',
  medium: 'bg-yellow-900 text-yellow-200',
  low: 'bg-green-900 text-green-200',
}

export const severityChartColors: Record<Severity, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
}

export const incidentTimelineIconStyles: Record<
  IncidentTimelineEvent['type'],
  { icon: LucideIcon; className: string }
> = {
  created: { icon: AlertTriangle, className: 'text-muted-foreground' },
  acknowledged: { icon: CheckCircle2, className: 'text-amber-400' },
  updated: { icon: Clock, className: 'text-primary' },
  alert_merged: { icon: Repeat2, className: 'text-sky-400' },
  assigned: { icon: User, className: 'text-blue-400' },
  escalated: { icon: ArrowUpCircle, className: 'text-orange-400' },
  severity_changed: { icon: ArrowUpCircle, className: 'text-orange-400' },
  resolved: { icon: CheckCircle, className: 'text-emerald-400' },
  reopened: { icon: RotateCcw, className: 'text-blue-400' },
  comment: { icon: MessageSquare, className: 'text-muted-foreground' },
}

export const systemHealthStatusMeta: Record<
  SystemHealthItem['status'],
  { icon: LucideIcon; color: string; label: string }
> = {
  operational: {
    icon: CheckCircle2,
    color: 'text-emerald-500',
    label: 'Operational',
  },
  degraded: {
    icon: AlertTriangle,
    color: 'text-yellow-500',
    label: 'Degraded',
  },
  down: {
    icon: XCircle,
    color: 'text-red-500',
    label: 'Down',
  },
}

export const runbookExecutionStatusMeta: Record<
  RunbookExecutionStatus,
  { icon: LucideIcon; iconClassName: string; badgeClassName: string }
> = {
  success: {
    icon: CheckCircle2,
    iconClassName: 'text-green-400',
    badgeClassName: 'bg-green-900 text-green-200',
  },
  failed: {
    icon: AlertCircle,
    iconClassName: 'text-red-400',
    badgeClassName: 'bg-red-900 text-red-200',
  },
  partial: {
    icon: AlertCircle,
    iconClassName: 'text-yellow-400',
    badgeClassName: 'bg-yellow-900 text-yellow-200',
  },
}
