import type { WorkspaceConfigFlags } from '@/lib/types'

export function getWorkspaceConfigFlags(
  options: { databaseReachable: boolean },
): WorkspaceConfigFlags {
  const authRaw = process.env.AUTH_SECRET?.trim() ?? ''
  return {
    slackWebhookConfigured: Boolean(process.env.SLACK_WEBHOOK_URL?.trim()),
    customApiBaseUrlConfigured: Boolean(process.env.NEXT_PUBLIC_API_BASE_URL?.trim()),
    persistentDbConfigured: options.databaseReachable,
    sqliteCustomPathConfigured: Boolean(process.env.SQLITE_DB_PATH?.trim()),
    authSecretConfigured: authRaw.length >= 32,
    alertIngestConfigured: Boolean(process.env.ALERT_INGEST_SECRET?.trim()),
  }
}
