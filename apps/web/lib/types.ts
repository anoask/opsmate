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

export type IncidentReviewStatus = 'not_started' | 'draft' | 'completed'

export type IncidentReviewActionItemStatus = 'open' | 'done' | 'dropped'

/** Trackable follow-up on a post-incident review (stored inside review_json). */
export interface IncidentReviewActionItem {
  id: string
  title: string
  owner: string
  status: IncidentReviewActionItemStatus
  /** Date-only (YYYY-MM-DD) or ISO string; null if unset. */
  dueAt: string | null
}

/** Lightweight post-incident review (resolved incidents). */
export interface IncidentReview {
  summary: string
  rootCause: string
  /** Free-form notes; structured work lives in actionItems. */
  followUps: string
  status: IncidentReviewStatus
  actionItems: IncidentReviewActionItem[]
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
  /** Cross-team visibility for severe or customer-impacting incidents. */
  isMajorIncident: boolean
  createdAt: string
  updatedAt: string
  resolvedAt: string | null
  timeline: IncidentTimelineEvent[]
  notes: IncidentNote[]
  review: IncidentReview
}

/** Per-incident workspace payload (alerts ingest history + notifications). */
export interface IncidentWorkspaceEnrichment {
  alertIngests: AlertHistoryItem[]
  notifications: IncidentNotification[]
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

export type RunbookExecutionStatus = 'in_progress' | 'success' | 'failed' | 'partial'

export interface RunbookExecution {
  id: string
  timestamp: string
  executedBy: string
  duration: string
  status: RunbookExecutionStatus
  incidentId?: string
  startedAt?: string
  completedAt?: string
  startedBy?: string
  completedStepIds?: string[]
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

/** Runbook execution state for one incident (from persisted runbook + executions). */
export interface IncidentRunbookExecutionContext {
  runbookId: string | null
  runbookTitle: string | null
  steps: RunbookStep[]
  activeExecution: RunbookExecution | null
  history: RunbookExecution[]
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

/**
 * Gates shared Slack webhook delivery per category: if no active teammate (excl. system bot)
 * has a flag on, new notifications of that category skip Slack (in-app feed unchanged).
 */
export interface UserNotificationPrefs {
  notifyOnCritical: boolean
  notifyOnAssignment: boolean
  notifyOnLifecycle: boolean
}

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  joinedAt: string
  notificationPrefs: UserNotificationPrefs
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
  | 'incident_major_updated'

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

export type SlackDeliveryStatus = 'delivered' | 'failed' | 'skipped' | 'not_attempted'

export interface NotificationCenterItem extends IncidentNotification {
  slackDeliveryStatus: SlackDeliveryStatus
  slackAttemptedAt: string | null
  slackDeliveryDetail: string | null
  retryEligible: boolean
}

export interface NotificationCenterFeed {
  items: NotificationCenterItem[]
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

export type AlertIngestDisposition = 'incident_created' | 'incident_merged'

export interface AlertHistoryItem {
  id: string
  source: string
  category: IncidentCategory
  title: string
  severity: Severity
  description: string
  dedupKey: string
  disposition: AlertIngestDisposition
  incidentId: string
  ingestedAt: string
}

export interface AlertHistoryFeed {
  items: AlertHistoryItem[]
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

/** Booleans only — safe for `/api/health` and settings UI (no secrets). */
export type WorkspaceConfigFlags = {
  slackWebhookConfigured: boolean
  customApiBaseUrlConfigured: boolean
  persistentDbConfigured: boolean
  sqliteCustomPathConfigured: boolean
  /** `AUTH_SECRET` present and at least 32 chars (required for secure sessions in production). */
  authSecretConfigured: boolean
  /** `ALERT_INGEST_SECRET` set; ingest accepts Bearer auth when configured. */
  alertIngestConfigured: boolean
}

export type TimelineEvent = IncidentTimelineEvent
export type ServiceStatus = SystemHealthItem
export type TeamMember = User
export type NotificationRule = Notification
