'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  Bell,
  ClipboardList,
  LayoutDashboard,
  Radio,
  ShieldAlert,
  Users,
} from 'lucide-react'
import { useActor } from '@/components/actor-context'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { WorkspaceGovernanceCard } from '@/components/settings/workspace-governance-card'
import { getApiBaseUrl } from '@/lib/config'
import type { WorkspaceConfigFlags } from '@/lib/types'

function parseWorkspaceFlags(value: unknown): WorkspaceConfigFlags | null {
  if (!value || typeof value !== 'object') return null
  const o = value as Record<string, unknown>
  const keys: (keyof WorkspaceConfigFlags)[] = [
    'slackWebhookConfigured',
    'customApiBaseUrlConfigured',
    'persistentDbConfigured',
    'sqliteCustomPathConfigured',
    'authSecretConfigured',
    'alertIngestConfigured',
  ]
  for (const k of keys) {
    if (typeof o[k] !== 'boolean') return null
  }
  return {
    slackWebhookConfigured: o.slackWebhookConfigured as boolean,
    customApiBaseUrlConfigured: o.customApiBaseUrlConfigured as boolean,
    persistentDbConfigured: o.persistentDbConfigured as boolean,
    sqliteCustomPathConfigured: o.sqliteCustomPathConfigured as boolean,
    authSecretConfigured: o.authSecretConfigured as boolean,
    alertIngestConfigured: o.alertIngestConfigured as boolean,
  }
}

const quickLinks = [
  { href: '/team', label: 'Team & Slack prefs', icon: Users },
  { href: '/notifications', label: 'Notification center', icon: Bell },
  { href: '/follow-ups', label: 'Follow-ups', icon: ClipboardList },
  { href: '/alerts', label: 'Alerts history', icon: Radio },
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/incidents', label: 'Incidents', icon: ShieldAlert },
] as const

function FlagRow({ label, on }: { label: string; on: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className={on ? 'font-medium text-foreground' : 'text-muted-foreground'}>
        {on ? 'Yes' : 'No'}
      </span>
    </div>
  )
}

export function WorkspaceSettingsOverview() {
  const { can, sessionReady } = useActor()
  const showGovernance = sessionReady && can('team:roles')
  const apiBase = getApiBaseUrl()
  const [workspaceFlags, setWorkspaceFlags] = useState<WorkspaceConfigFlags | null>(null)
  const [flagsStatus, setFlagsStatus] = useState<'loading' | 'ok' | 'error'>('loading')
  const [healthHttpOk, setHealthHttpOk] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    void fetch('/api/health', { cache: 'no-store' })
      .then(async (res) => {
        const data: unknown = await res.json().catch(() => null)
        if (cancelled) return
        setHealthHttpOk(res.ok)
        const parsed = parseWorkspaceFlags(
          data && typeof data === 'object' ? (data as { workspace?: unknown }).workspace : null,
        )
        setWorkspaceFlags(parsed)
        setFlagsStatus(parsed ? 'ok' : 'error')
      })
      .catch(() => {
        if (!cancelled) {
          setWorkspaceFlags(null)
          setFlagsStatus('error')
          setHealthHttpOk(null)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const clientApiBaseMatchesServer =
    workspaceFlags !== null && !!apiBase === workspaceFlags.customApiBaseUrlConfigured

  return (
    <>
    <Card className="border-border/70 bg-card/80 shadow-sm shadow-black/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Workspace overview</CardTitle>
        <CardDescription className="text-sm leading-relaxed">
          OpsMate keeps incidents as the system of record. Settings here mix{' '}
          <span className="font-medium text-foreground">live</span> roster data with some{' '}
          <span className="font-medium text-foreground">illustrative</span> controls that are not
          persisted yet—see each section for details.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-border/70 bg-secondary/30">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertTitle className="text-sm">Live vs demo data</AlertTitle>
          <AlertDescription className="text-xs leading-relaxed text-muted-foreground">
            If the incidents API is unavailable, lists fall back to demo data and you may see a notice
            on the dashboard or incidents page. Team roster and user notification preferences use
            the users API when available.
          </AlertDescription>
        </Alert>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Workspace signals (this deployment)
          </p>
          <p className="mb-2 text-[11px] leading-relaxed text-muted-foreground">
            From <code className="rounded bg-secondary/80 px-1">/api/health</code> — booleans only; no
            secrets. Presence of an env var does not guarantee Slack delivery or API reachability.
          </p>
          {flagsStatus === 'loading' && (
            <p className="text-xs text-muted-foreground">Loading…</p>
          )}
          {flagsStatus === 'error' && (
            <p className="text-xs text-amber-600 dark:text-amber-500">
              Could not read workspace flags{healthHttpOk === false ? ' (health check reported an error).' : '.'}
            </p>
          )}
          {workspaceFlags && (
            <div className="space-y-2 rounded-md border border-border/60 bg-secondary/25 px-3 py-2.5">
              <FlagRow
                label="Slack webhook env (SLACK_WEBHOOK_URL)"
                on={workspaceFlags.slackWebhookConfigured}
              />
              <FlagRow
                label="Custom public API base (NEXT_PUBLIC_API_BASE_URL)"
                on={workspaceFlags.customApiBaseUrlConfigured}
              />
              <FlagRow label="SQLite datastore reachable" on={workspaceFlags.persistentDbConfigured} />
              <FlagRow
                label="Custom DB path env (SQLITE_DB_PATH)"
                on={workspaceFlags.sqliteCustomPathConfigured}
              />
              <FlagRow
                label="AUTH_SECRET configured (32+ chars)"
                on={workspaceFlags.authSecretConfigured}
              />
              <FlagRow
                label="Alert ingest secret (ALERT_INGEST_SECRET)"
                on={workspaceFlags.alertIngestConfigured}
              />
            </div>
          )}
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            API base (client)
          </p>
          <p className="rounded-md border border-border/60 bg-secondary/40 px-3 py-2 font-mono text-xs text-muted-foreground">
            {apiBase ? apiBase : 'Same origin (default) — requests use this app’s /api routes'}
          </p>
          <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
            Set <code className="rounded bg-secondary/80 px-1">NEXT_PUBLIC_API_BASE_URL</code> only if
            the browser must call a separate API host.
            {workspaceFlags && !clientApiBaseMatchesServer && (
              <span className="mt-1 block text-amber-600 dark:text-amber-500">
                Server health reports a different custom-API-base flag than this browser build —
                rebuild or align env if unexpected.
              </span>
            )}
          </p>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Related workflows
          </p>
          <div className="flex flex-wrap gap-2">
            {quickLinks.map(({ href, label, icon: Icon }) => (
              <Button key={href} variant="outline" size="sm" className="h-8 gap-1.5" asChild>
                <Link href={href}>
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  {label}
                </Link>
              </Button>
            ))}
          </div>
        </div>

        <p className="text-[11px] leading-relaxed text-muted-foreground border-t border-border/50 pt-3">
          <span className="font-medium text-foreground">Slack:</span> outbound webhooks use server
          env <code className="rounded bg-secondary/80 px-1">SLACK_WEBHOOK_URL</code>. Whether a
          notification is sent also depends on teammate preferences on{' '}
          <Link href="/team" className="text-primary underline-offset-2 hover:underline">
            Team
          </Link>{' '}
          and routing rules in code. Use{' '}
          <Link href="/notifications" className="text-primary underline-offset-2 hover:underline">
            Notification center
          </Link>{' '}
          to audit delivery.
        </p>
      </CardContent>
    </Card>
    {showGovernance ? (
      <div className="mt-6">
        <WorkspaceGovernanceCard
          workspaceFlags={workspaceFlags}
          healthHttpOk={healthHttpOk}
          flagsStatus={flagsStatus}
        />
      </div>
    ) : null}
  </>
  )
}
