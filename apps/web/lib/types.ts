import type { LucideIcon } from 'lucide-react'

export type Severity = 'critical' | 'high' | 'medium' | 'low'
export type Status = 'open' | 'acknowledged' | 'investigating' | 'resolved'
export type IncidentCategory =
  | 'application'
  | 'database'
  | 'infrastructure'
  | 'network'
  | 'security'

export type IncidentTimelineEventType =
  | 'created'
  | 'acknowledged'
  | 'updated'
  | 'alert_merged'
  | 'assigned'
  | 'escalated'
  | 'severity_changed'
  | 'resolved'
  | 'reopened'
  | 'comment'

export interface IncidentTimelineEvent {
  id: string
  timestamp: string
  type: IncidentTimelineEventType
  description: string
  user?: string
}

export interface IncidentNote {
  id: string
  user: string
  timestamp: string
  content: string
}

export interface Incident {
  id: string
  source: string
  title: string
  description: string
  severity: Severity
  status: Status
  category: IncidentCategory
  assignedRunbook: string | null
  assignedTo: string | null
  /** Number of alert-ingest merges (dedup repeats) applied to this incident. */
  alertMergeCount: number
  createdAt: string
  updatedAt: string
  resolvedAt: string | null
  timeline: IncidentTimelineEvent[]
  notes: IncidentNote[]
}

export type SystemHealthStatus = 'operational' | 'degraded' | 'down'

export interface SystemHealthItem {
  name: string
  status: SystemHealthStatus
}

export interface RunbookStep {
  id: string
  order: number
  title: string
  description: string
  command?: string
  expectedOutput?: string
}

export type RunbookExecutionStatus = 'success' | 'failed' | 'partial'

export interface RunbookExecution {
  id: string
  timestamp: string
  executedBy: string
  duration: string
  status: RunbookExecutionStatus
  incidentId?: string
}

export interface Runbook {
  id: string
  title: string
  category: string
  description: string
  severity: Severity
  tags: string[]
  steps: RunbookStep[]
  createdAt: string
  updatedAt: string
  createdBy: string
  successRate: number
  avgExecutionTime: string
  usageCount: number
  lastExecuted?: string
  executions: RunbookExecution[]
}

export interface MetricCard {
  label: string
  value: string | number
  icon: LucideIcon
  color: string
  bgColor: string
  trend?: string
  trendColor?: string
}

export type UserRole = 'admin' | 'manager' | 'responder' | 'viewer'
export type UserStatus = 'active' | 'inactive'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  joinedAt: string
}

export type NotificationChannel = 'email' | 'slack' | 'sms'

export interface Notification {
  id: string
  name: string
  enabled: boolean
  trigger: string
  channels: NotificationChannel[]
}

export type IncidentNotificationType =
  | 'incident_created_critical'
  | 'incident_assigned'
  | 'incident_reopened'
  | 'incident_resolved'

export interface IncidentNotification {
  id: string
  incidentId: string
  eventId: string | null
  type: IncidentNotificationType
  title: string
  message: string
  incidentTitle: string
  incidentSeverity: Severity
  createdAt: string
  readAt: string | null
}

export interface IncidentNotificationFeed {
  notifications: IncidentNotification[]
  unreadCount: number
}

export type AlertActivityType = 'incident_created' | 'alert_merged'

export interface AlertActivityItem {
  id: string
  incidentId: string
  incidentTitle: string
  incidentSeverity: Severity
  incidentSource: string
  type: AlertActivityType
  description: string
  mergeCount: number
  createdAt: string
}

export interface AlertActivityFeed {
  items: AlertActivityItem[]
}

export interface RunbookSuggestion {
  id: string
  title: string
  relevance: number
}

export interface Integration {
  id: string
  name: string
  type: string
  status: 'connected' | 'disconnected' | 'error'
  lastSync?: string
}

export type TimelineEvent = IncidentTimelineEvent
export type ServiceStatus = SystemHealthItem
export type TeamMember = User
export type NotificationRule = Notification
