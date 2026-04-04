import type {
  Incident,
  Integration,
  Notification,
  Runbook,
  RunbookSuggestion,
  SystemHealthItem,
  User,
} from './types'

export type {
  Incident,
  IncidentCategory,
  IncidentTimelineEvent,
  Integration,
  MetricCard,
  Notification,
  NotificationRule,
  Runbook,
  RunbookSuggestion,
  ServiceStatus,
  Severity,
  Status,
  SystemHealthItem,
  TeamMember,
  User,
} from './types'

export const incidents: Incident[] = [
  {
    id: "INC-2847",
    source: "Datadog",
    title: "High CPU usage on api-prod-01",
    description: "CPU utilization has exceeded 95% threshold on api-prod-01 for the past 10 minutes. This is causing increased latency on API responses and potential request timeouts.",
    severity: "critical",
    status: "investigating",
    category: "infrastructure",
    assignedRunbook: "CPU Spike Remediation",
    assignedTo: "Sarah Chen",
    createdAt: "2024-01-15T14:32:00Z",
    updatedAt: "2 min ago",
    resolvedAt: null,
    timeline: [
      { id: "t1", timestamp: "14:32", type: "created", description: "Incident created from Datadog alert" },
      { id: "t2", timestamp: "14:33", type: "assigned", description: "Auto-assigned to Sarah Chen based on on-call schedule", user: "System" },
      { id: "t3", timestamp: "14:35", type: "updated", description: "Severity escalated from High to Critical", user: "Sarah Chen" },
      { id: "t4", timestamp: "14:38", type: "comment", description: "Investigating potential memory leak in latest deployment", user: "Sarah Chen" },
    ],
    notes: [
      { id: "n1", user: "Sarah Chen", timestamp: "14:38", content: "Initial investigation shows spike coincides with v2.4.1 deployment. Checking for memory leaks." },
      { id: "n2", user: "Mike Torres", timestamp: "14:40", content: "I noticed similar behavior in staging last week. Could be related to the new caching layer." },
    ],
  },
  {
    id: "INC-2846",
    source: "PagerDuty",
    title: "Database connection pool exhausted",
    description: "PostgreSQL connection pool on db-primary has reached maximum capacity. New connections are being rejected, causing service degradation.",
    severity: "high",
    status: "open",
    category: "database",
    assignedRunbook: "DB Connection Recovery",
    assignedTo: null,
    createdAt: "2024-01-15T14:26:00Z",
    updatedAt: "8 min ago",
    resolvedAt: null,
    timeline: [
      { id: "t1", timestamp: "14:26", type: "created", description: "Incident created from PagerDuty alert" },
      { id: "t2", timestamp: "14:28", type: "comment", description: "Connection count: 100/100. Investigating stale connections.", user: "System" },
    ],
    notes: [
      { id: "n1", user: "System", timestamp: "14:28", content: "Automated analysis: 23 connections appear stale (idle > 30 minutes)" },
    ],
  },
  {
    id: "INC-2845",
    source: "CloudWatch",
    title: "Elevated error rate in auth-service",
    description: "Error rate in auth-service has increased to 5.2%, above the 2% threshold. Users may experience intermittent login failures.",
    severity: "high",
    status: "investigating",
    category: "application",
    assignedRunbook: null,
    assignedTo: "Alex Kim",
    createdAt: "2024-01-15T14:19:00Z",
    updatedAt: "15 min ago",
    resolvedAt: null,
    timeline: [
      { id: "t1", timestamp: "14:19", type: "created", description: "Incident created from CloudWatch alarm" },
      { id: "t2", timestamp: "14:21", type: "assigned", description: "Assigned to Alex Kim", user: "Sarah Chen" },
      { id: "t3", timestamp: "14:25", type: "updated", description: "Status changed to Investigating", user: "Alex Kim" },
    ],
    notes: [],
  },
  {
    id: "INC-2844",
    source: "Sentry",
    title: "Unhandled exception in payment flow",
    description: "NullPointerException being thrown in PaymentProcessor.processTransaction(). Affecting approximately 2% of checkout attempts.",
    severity: "medium",
    status: "open",
    category: "application",
    assignedRunbook: "Payment Error Triage",
    assignedTo: null,
    createdAt: "2024-01-15T14:02:00Z",
    updatedAt: "32 min ago",
    resolvedAt: null,
    timeline: [
      { id: "t1", timestamp: "14:02", type: "created", description: "Incident created from Sentry error spike" },
    ],
    notes: [],
  },
  {
    id: "INC-2843",
    source: "Prometheus",
    title: "Memory leak detected in worker pods",
    description: "Worker pods showing gradual memory increase over past 6 hours. Current utilization at 78%, projected to hit limits in 4 hours.",
    severity: "medium",
    status: "investigating",
    category: "infrastructure",
    assignedRunbook: "Memory Leak Investigation",
    assignedTo: "Jordan Lee",
    createdAt: "2024-01-15T13:34:00Z",
    updatedAt: "1 hr ago",
    resolvedAt: null,
    timeline: [
      { id: "t1", timestamp: "13:34", type: "created", description: "Incident created from Prometheus alert" },
      { id: "t2", timestamp: "13:45", type: "assigned", description: "Assigned to Jordan Lee", user: "Sarah Chen" },
      { id: "t3", timestamp: "13:50", type: "updated", description: "Status changed to Investigating", user: "Jordan Lee" },
    ],
    notes: [
      { id: "n1", user: "Jordan Lee", timestamp: "13:55", content: "Taking heap dumps for analysis. Will compare with baseline from last week." },
    ],
  },
  {
    id: "INC-2842",
    source: "Datadog",
    title: "Slow response times on /api/users",
    description: "P95 latency on /api/users endpoint has increased from 120ms to 450ms. No immediate user impact but monitoring closely.",
    severity: "low",
    status: "open",
    category: "application",
    assignedRunbook: null,
    assignedTo: null,
    createdAt: "2024-01-15T12:34:00Z",
    updatedAt: "2 hr ago",
    resolvedAt: null,
    timeline: [
      { id: "t1", timestamp: "12:34", type: "created", description: "Incident created from Datadog latency alert" },
    ],
    notes: [],
  },
  {
    id: "INC-2841",
    source: "CloudWatch",
    title: "S3 bucket access denied errors",
    description: "IAM role for lambda functions returning AccessDenied on s3:GetObject operations. Issue traced to recent IAM policy change.",
    severity: "low",
    status: "resolved",
    category: "security",
    assignedRunbook: "S3 Permission Fix",
    assignedTo: "Taylor Smith",
    createdAt: "2024-01-15T11:00:00Z",
    updatedAt: "3 hr ago",
    resolvedAt: "2024-01-15T11:45:00Z",
    timeline: [
      { id: "t1", timestamp: "11:00", type: "created", description: "Incident created from CloudWatch errors" },
      { id: "t2", timestamp: "11:15", type: "assigned", description: "Assigned to Taylor Smith", user: "Sarah Chen" },
      { id: "t3", timestamp: "11:30", type: "comment", description: "Root cause identified: IAM policy update removed s3:GetObject permission", user: "Taylor Smith" },
      { id: "t4", timestamp: "11:45", type: "resolved", description: "IAM policy corrected, permissions restored", user: "Taylor Smith" },
    ],
    notes: [
      { id: "n1", user: "Taylor Smith", timestamp: "11:30", content: "IAM policy was updated by automated Terraform apply. Adding guardrails to prevent this." },
    ],
  },
  {
    id: "INC-2840",
    source: "PagerDuty",
    title: "Redis cluster failover completed",
    description: "Primary Redis node became unresponsive. Automatic failover to replica completed successfully. Brief period of increased latency observed.",
    severity: "medium",
    status: "resolved",
    category: "database",
    assignedRunbook: "Redis Failover Procedure",
    assignedTo: "Mike Torres",
    createdAt: "2024-01-15T09:15:00Z",
    updatedAt: "5 hr ago",
    resolvedAt: "2024-01-15T09:25:00Z",
    timeline: [
      { id: "t1", timestamp: "09:15", type: "created", description: "Incident created - Redis primary unresponsive" },
      { id: "t2", timestamp: "09:16", type: "updated", description: "Automatic failover initiated", user: "System" },
      { id: "t3", timestamp: "09:18", type: "assigned", description: "Assigned to Mike Torres", user: "System" },
      { id: "t4", timestamp: "09:25", type: "resolved", description: "Failover complete, services restored", user: "Mike Torres" },
    ],
    notes: [
      { id: "n1", user: "Mike Torres", timestamp: "09:30", content: "Post-mortem: Primary node OOM killed due to memory pressure. Increasing instance size." },
    ],
  },
]

export const runbooks: Runbook[] = [
  {
    id: "RB-101",
    title: "High CPU Remediation",
    category: "Infrastructure",
    description: "Step-by-step guide to diagnose and resolve high CPU usage on production servers.",
    severity: "critical",
    tags: ["cpu", "performance", "infrastructure"],
    steps: [
      {
        id: "s1",
        order: 1,
        title: "Identify affected host",
        description: "Check which host(s) are experiencing high CPU usage using Datadog dashboard or CloudWatch metrics.",
      },
      {
        id: "s2",
        order: 2,
        title: "Check running processes",
        description: "SSH into the affected host and run 'top' to identify CPU-heavy processes.",
        command: "ssh prod-host && top -b -n 1 | head -20",
      },
      {
        id: "s3",
        order: 3,
        title: "Review application logs",
        description: "Check application logs for errors or unusual patterns that might explain the spike.",
        command: "tail -f /var/log/application.log",
      },
      {
        id: "s4",
        order: 4,
        title: "Check for memory leaks",
        description: "If the process is a long-running service, check for gradual memory growth indicating a memory leak.",
      },
      {
        id: "s5",
        order: 5,
        title: "Restart service if needed",
        description: "If a memory leak is detected, restart the affected service to free memory.",
        command: "systemctl restart myapp",
      },
    ],
    createdAt: "2024-01-10T10:30:00Z",
    updatedAt: "2024-01-14T15:20:00Z",
    createdBy: "Sarah Chen",
    successRate: 94,
    avgExecutionTime: "8 minutes",
    usageCount: 47,
    lastExecuted: "2024-01-15T14:35:00Z",
    executions: [
      { id: "e1", timestamp: "2024-01-15T14:35:00Z", executedBy: "Sarah Chen", duration: "7 minutes", status: "success", incidentId: "INC-2847" },
      { id: "e2", timestamp: "2024-01-12T09:20:00Z", executedBy: "Mike Torres", duration: "9 minutes", status: "success" },
      { id: "e3", timestamp: "2024-01-08T16:45:00Z", executedBy: "Alex Kim", duration: "12 minutes", status: "partial" },
    ],
  },
  {
    id: "RB-087",
    title: "Database Connection Recovery",
    category: "Database",
    description: "Procedures to recover from exhausted database connection pools and restore service.",
    severity: "high",
    tags: ["database", "connections", "recovery"],
    steps: [
      {
        id: "s1",
        order: 1,
        title: "Verify connection pool status",
        description: "Connect to the database and check current connection count.",
        command: "SELECT count(*) FROM pg_stat_activity;",
      },
      {
        id: "s2",
        order: 2,
        title: "Identify idle connections",
        description: "Find and list idle connections that can be safely closed.",
        command: "SELECT pid, usename, application_name, state FROM pg_stat_activity WHERE state = 'idle';",
      },
      {
        id: "s3",
        order: 3,
        title: "Terminate idle connections",
        description: "Terminate idle connections to free up connection slots.",
        command: "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND query_start < now() - interval '30 minutes';",
      },
      {
        id: "s4",
        order: 4,
        title: "Monitor service recovery",
        description: "Monitor error logs and metrics to confirm service recovery.",
      },
      {
        id: "s5",
        order: 5,
        title: "Increase pool size if needed",
        description: "If issue recurs, consider increasing the connection pool size in application configuration.",
      },
    ],
    createdAt: "2024-01-08T14:00:00Z",
    updatedAt: "2024-01-13T11:15:00Z",
    createdBy: "Jordan Lee",
    successRate: 98,
    avgExecutionTime: "5 minutes",
    usageCount: 23,
    lastExecuted: "2024-01-14T13:10:00Z",
    executions: [
      { id: "e1", timestamp: "2024-01-14T13:10:00Z", executedBy: "Jordan Lee", duration: "4 minutes", status: "success" },
      { id: "e2", timestamp: "2024-01-11T10:25:00Z", executedBy: "Taylor Smith", duration: "6 minutes", status: "success" },
    ],
  },
  {
    id: "RB-054",
    title: "Auth Service Restart Procedure",
    category: "Application",
    description: "Safe restart procedure for auth service with zero-downtime deployment considerations.",
    severity: "high",
    tags: ["auth", "service", "deployment"],
    steps: [
      {
        id: "s1",
        order: 1,
        title: "Check current deployment status",
        description: "Verify current version and health of auth service pods.",
        command: "kubectl get pods -l app=auth-service",
      },
      {
        id: "s2",
        order: 2,
        title: "Enable maintenance mode",
        description: "Notify users of potential brief service interruption.",
      },
      {
        id: "s3",
        order: 3,
        title: "Restart pods gracefully",
        description: "Perform rolling restart of auth service pods to ensure high availability.",
        command: "kubectl rollout restart deployment/auth-service",
      },
      {
        id: "s4",
        order: 4,
        title: "Wait for pod health checks",
        description: "Monitor pod startup and readiness probes.",
        command: "kubectl rollout status deployment/auth-service",
      },
      {
        id: "s5",
        order: 5,
        title: "Verify service is responding",
        description: "Test authentication endpoints to confirm proper operation.",
        command: "curl https://api.example.com/health/auth",
      },
      {
        id: "s6",
        order: 6,
        title: "Disable maintenance mode",
        description: "Resume normal service operations.",
      },
    ],
    createdAt: "2024-01-05T09:00:00Z",
    updatedAt: "2024-01-12T16:30:00Z",
    createdBy: "Mike Torres",
    successRate: 100,
    avgExecutionTime: "3 minutes",
    usageCount: 12,
    lastExecuted: "2024-01-10T11:45:00Z",
    executions: [
      { id: "e1", timestamp: "2024-01-10T11:45:00Z", executedBy: "Mike Torres", duration: "3 minutes", status: "success" },
      { id: "e2", timestamp: "2024-01-06T14:20:00Z", executedBy: "Sarah Chen", duration: "3 minutes", status: "success" },
    ],
  },
  {
    id: "RB-042",
    title: "Payment Service Error Triage",
    category: "Application",
    description: "Debug and triage errors in the payment processing service.",
    severity: "critical",
    tags: ["payment", "errors", "troubleshooting"],
    steps: [
      {
        id: "s1",
        order: 1,
        title: "Check error logs in Sentry",
        description: "Review recent errors in Sentry to identify the root cause pattern.",
      },
      {
        id: "s2",
        order: 2,
        title: "Examine payment service metrics",
        description: "Check error rate, latency, and transaction volume in monitoring dashboards.",
      },
      {
        id: "s3",
        order: 3,
        title: "Verify external dependencies",
        description: "Check payment gateway API status and connectivity.",
      },
      {
        id: "s4",
        order: 4,
        title: "Review recent deployments",
        description: "Check if recent code changes are related to the error spike.",
      },
      {
        id: "s5",
        order: 5,
        title: "Implement fix or rollback",
        description: "Deploy fix if identified, or rollback recent changes if needed.",
      },
    ],
    createdAt: "2024-01-02T13:20:00Z",
    updatedAt: "2024-01-15T09:00:00Z",
    createdBy: "Alex Kim",
    successRate: 89,
    avgExecutionTime: "12 minutes",
    usageCount: 34,
    lastExecuted: "2024-01-15T14:10:00Z",
    executions: [
      { id: "e1", timestamp: "2024-01-15T14:10:00Z", executedBy: "Alex Kim", duration: "10 minutes", status: "success", incidentId: "INC-2844" },
      { id: "e2", timestamp: "2024-01-13T15:35:00Z", executedBy: "Jordan Lee", duration: "15 minutes", status: "partial" },
      { id: "e3", timestamp: "2024-01-10T08:50:00Z", executedBy: "Taylor Smith", duration: "11 minutes", status: "success" },
    ],
  },
  {
    id: "RB-029",
    title: "Memory Leak Investigation",
    category: "Infrastructure",
    description: "Procedures to investigate and remediate memory leaks in application processes.",
    severity: "medium",
    tags: ["memory", "leak", "investigation"],
    steps: [
      {
        id: "s1",
        order: 1,
        title: "Monitor memory usage over time",
        description: "Use monitoring dashboards to track memory growth pattern.",
      },
      {
        id: "s2",
        order: 2,
        title: "Generate heap dump",
        description: "Create a heap dump for analysis.",
        command: "jmap -dump:live,format=b,file=heap.bin <pid>",
      },
      {
        id: "s3",
        order: 3,
        title: "Analyze heap dump",
        description: "Use heap analysis tool to identify retained objects.",
      },
      {
        id: "s4",
        order: 4,
        title: "Review recent code changes",
        description: "Check git history for recent changes that might cause the leak.",
      },
      {
        id: "s5",
        order: 5,
        title: "Implement fix",
        description: "Deploy fix and monitor memory to verify the leak is resolved.",
      },
    ],
    createdAt: "2024-01-01T10:00:00Z",
    updatedAt: "2024-01-15T13:45:00Z",
    createdBy: "Jordan Lee",
    successRate: 92,
    avgExecutionTime: "20 minutes",
    usageCount: 18,
    lastExecuted: "2024-01-15T13:45:00Z",
    executions: [
      { id: "e1", timestamp: "2024-01-15T13:45:00Z", executedBy: "Jordan Lee", duration: "22 minutes", status: "success", incidentId: "INC-2843" },
      { id: "e2", timestamp: "2024-01-12T16:10:00Z", executedBy: "Mike Torres", duration: "18 minutes", status: "success" },
    ],
  },
]

export const serviceStatuses: SystemHealthItem[] = [
  { name: "API Gateway", status: "operational" },
  { name: "Auth Service", status: "degraded" },
  { name: "Database Cluster", status: "operational" },
  { name: "Cache Layer", status: "operational" },
  { name: "Message Queue", status: "operational" },
]

export const runbookSuggestions: RunbookSuggestion[] = [
  { id: "RB-101", title: "High CPU Remediation", relevance: 95 },
  { id: "RB-087", title: "Database Connection Recovery", relevance: 88 },
  { id: "RB-054", title: "Auth Service Restart Procedure", relevance: 72 },
]

export const notificationRules: Notification[] = [
  {
    id: "nr-1",
    name: "Critical Incidents",
    enabled: true,
    trigger: "Critical severity incident created",
    channels: ["email", "slack", "sms"],
  },
  {
    id: "nr-2",
    name: "High Priority Updates",
    enabled: true,
    trigger: "High severity incident status change",
    channels: ["email", "slack"],
  },
  {
    id: "nr-3",
    name: "MTTR Threshold Exceeded",
    enabled: true,
    trigger: "Incident MTTR exceeds 1 hour",
    channels: ["slack"],
  },
  {
    id: "nr-4",
    name: "Daily Summary",
    enabled: false,
    trigger: "Every day at 9 AM",
    channels: ["email"],
  },
  {
    id: "nr-5",
    name: "Team Member Assigned",
    enabled: true,
    trigger: "You are assigned to an incident",
    channels: ["email", "slack", "sms"],
  },
]

export const teamMembers: User[] = [
  {
    id: "tm-1",
    name: "Sarah Chen",
    email: "sarah.chen@company.com",
    role: "admin",
    status: "active",
    joinedAt: "2023-06-15",
  },
  {
    id: "tm-2",
    name: "Mike Torres",
    email: "mike.torres@company.com",
    role: "manager",
    status: "active",
    joinedAt: "2023-08-22",
  },
  {
    id: "tm-3",
    name: "Jordan Lee",
    email: "jordan.lee@company.com",
    role: "responder",
    status: "active",
    joinedAt: "2023-10-10",
  },
  {
    id: "tm-4",
    name: "Alex Kim",
    email: "alex.kim@company.com",
    role: "responder",
    status: "active",
    joinedAt: "2023-11-05",
  },
  {
    id: "tm-5",
    name: "Taylor Smith",
    email: "taylor.smith@company.com",
    role: "responder",
    status: "active",
    joinedAt: "2024-01-02",
  },
  {
    id: "tm-6",
    name: "Casey Johnson",
    email: "casey.johnson@company.com",
    role: "viewer",
    status: "inactive",
    joinedAt: "2023-09-18",
  },
]

export const integrations: Integration[] = [
  {
    id: "int-1",
    name: "Datadog",
    type: "Monitoring",
    status: "connected",
    lastSync: "2 minutes ago",
  },
  {
    id: "int-2",
    name: "PagerDuty",
    type: "Alerting",
    status: "connected",
    lastSync: "5 minutes ago",
  },
  {
    id: "int-3",
    name: "Slack",
    type: "Communication",
    status: "connected",
    lastSync: "1 minute ago",
  },
  {
    id: "int-4",
    name: "CloudWatch",
    type: "Monitoring",
    status: "connected",
    lastSync: "3 minutes ago",
  },
  {
    id: "int-5",
    name: "Sentry",
    type: "Error Tracking",
    status: "connected",
    lastSync: "10 minutes ago",
  },
  {
    id: "int-6",
    name: "GitHub",
    type: "Version Control",
    status: "disconnected",
  },
]

export const incidentTrendData = [
  { date: "Mon", incidents: 12, resolved: 10 },
  { date: "Tue", incidents: 18, resolved: 15 },
  { date: "Wed", incidents: 8, resolved: 9 },
  { date: "Thu", incidents: 22, resolved: 18 },
  { date: "Fri", incidents: 15, resolved: 14 },
  { date: "Sat", incidents: 6, resolved: 7 },
  { date: "Sun", incidents: 4, resolved: 5 },
]

export const categoryData = [
  { category: "Infrastructure", count: 35, fill: "var(--color-chart-1)" },
  { category: "Application", count: 28, fill: "var(--color-chart-2)" },
  { category: "Database", count: 18, fill: "var(--color-chart-3)" },
  { category: "Network", count: 12, fill: "var(--color-chart-4)" },
  { category: "Security", count: 7, fill: "var(--color-chart-5)" },
]

export interface MTTRDataPoint {
  week: string
  mttr: number
}

export interface IncidentVolumeDataPoint {
  date: string
  total: number
  critical: number
  high: number
  medium: number
  low: number
}

export interface TeamPerformance {
  name: string
  resolvedCount: number
  avgMTTR: number
  successRate: number
  avgResponseTime: number
}

export interface IncidentCategoryBreakdown {
  category: string
  incidents: number
  avgMTTR: number
  resolution: number
}

export const kpiData = {
  activeAlerts: 14,
  resolvedToday: 23,
  avgMTTR: "18m",
  criticalIncidents: 2,
}

export const mttrTrendData: MTTRDataPoint[] = [
  { week: "Week 1", mttr: 32 },
  { week: "Week 2", mttr: 28 },
  { week: "Week 3", mttr: 35 },
  { week: "Week 4", mttr: 24 },
  { week: "Week 5", mttr: 18 },
  { week: "Week 6", mttr: 22 },
  { week: "Week 7", mttr: 19 },
]

export const incidentVolumeData: IncidentVolumeDataPoint[] = [
  { date: "Jan 1", total: 12, critical: 1, high: 3, medium: 5, low: 3 },
  { date: "Jan 2", total: 14, critical: 2, high: 4, medium: 5, low: 3 },
  { date: "Jan 3", total: 8, critical: 0, high: 2, medium: 4, low: 2 },
  { date: "Jan 4", total: 18, critical: 1, high: 5, medium: 8, low: 4 },
  { date: "Jan 5", total: 11, critical: 0, high: 3, medium: 5, low: 3 },
  { date: "Jan 6", total: 9, critical: 1, high: 2, medium: 4, low: 2 },
  { date: "Jan 7", total: 13, critical: 0, high: 3, medium: 6, low: 4 },
  { date: "Jan 8", total: 16, critical: 2, high: 4, medium: 7, low: 3 },
  { date: "Jan 9", total: 10, critical: 1, high: 2, medium: 4, low: 3 },
  { date: "Jan 10", total: 15, critical: 1, high: 4, medium: 7, low: 3 },
  { date: "Jan 11", total: 12, critical: 0, high: 3, medium: 5, low: 4 },
  { date: "Jan 12", total: 19, critical: 2, high: 5, medium: 8, low: 4 },
  { date: "Jan 13", total: 14, critical: 1, high: 3, medium: 6, low: 4 },
  { date: "Jan 14", total: 11, critical: 0, high: 2, medium: 5, low: 4 },
  { date: "Jan 15", total: 17, critical: 1, high: 4, medium: 7, low: 5 },
]

export const teamPerformance: TeamPerformance[] = [
  { name: "Sarah Chen", resolvedCount: 24, avgMTTR: 16, successRate: 98, avgResponseTime: 12 },
  { name: "Mike Torres", resolvedCount: 19, avgMTTR: 19, successRate: 95, avgResponseTime: 15 },
  { name: "Jordan Lee", resolvedCount: 17, avgMTTR: 21, successRate: 92, avgResponseTime: 18 },
  { name: "Alex Kim", resolvedCount: 15, avgMTTR: 22, successRate: 90, avgResponseTime: 20 },
  { name: "Taylor Smith", resolvedCount: 21, avgMTTR: 17, successRate: 96, avgResponseTime: 14 },
]

export const incidentCategoryBreakdown: IncidentCategoryBreakdown[] = [
  { category: "Infrastructure", incidents: 35, avgMTTR: 16, resolution: 94 },
  { category: "Application", incidents: 28, avgMTTR: 19, resolution: 92 },
  { category: "Database", incidents: 18, avgMTTR: 15, resolution: 96 },
  { category: "Network", incidents: 12, avgMTTR: 22, resolution: 88 },
  { category: "Security", incidents: 7, avgMTTR: 12, resolution: 100 },
]
