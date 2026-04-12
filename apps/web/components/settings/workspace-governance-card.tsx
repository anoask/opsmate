'use client'

import Link from 'next/link'
import {
  AlertTriangle,
  Bell,
  BookOpen,
  History,
  Shield,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { WorkspaceConfigFlags } from '@/lib/types'

const governanceLinks = [
  {
    href: '/team',
    label: 'Team & roles',
    hint: 'Assign roles; only admins change roles. Managers edit Slack routing prefs.',
    icon: Users,
  },
  {
    href: '/notifications',
    label: 'Notification center',
    hint: 'Audit delivery; Slack retries need notifications:replay (admins, managers, responders).',
    icon: Bell,
  },
  {
    href: '/alerts',
    label: 'Alerts & ingest',
    hint: 'Ingest history; POST /api/ingest/alerts uses ALERT_INGEST_SECRET (Bearer).',
    icon: History,
  },
  {
    href: '/incidents',
    label: 'Incidents',
    hint: 'Mark or clear major incidents from incident detail.',
    icon: AlertTriangle,
  },
  {
    href: '/runbooks',
    label: 'Runbooks',
    hint: 'Execution is blocked once an incident is resolved.',
    icon: BookOpen,
  },
] as const

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <Badge
      variant="outline"
      className={
        ok
          ? 'border-emerald-500/40 text-emerald-600/90 dark:text-emerald-400/90'
          : 'border-amber-500/40 text-amber-700/90 dark:text-amber-500/90'
      }
    >
      {label}
    </Badge>
  )
}

export function WorkspaceGovernanceCard(props: {
  workspaceFlags: WorkspaceConfigFlags | null
  healthHttpOk: boolean | null
  flagsStatus: 'loading' | 'ok' | 'error'
}) {
  const { workspaceFlags, healthHttpOk, flagsStatus } = props

  return (
    <Card className="border-primary/25 bg-card shadow-sm shadow-black/10">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15">
              <Shield className="h-4 w-4 text-primary" aria-hidden />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Workspace governance</CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                Admin-only checklist: configuration signals, operational links, and who can change
                what.
              </CardDescription>
            </div>
          </div>
          {flagsStatus === 'loading' ? (
            <Badge variant="outline" className="text-muted-foreground">
              Loading…
            </Badge>
          ) : healthHttpOk === true ? (
            <StatusBadge ok={true} label="Health OK" />
          ) : healthHttpOk === false ? (
            <StatusBadge ok={false} label="Health error" />
          ) : (
            <StatusBadge ok={false} label="Health unknown" />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Deployment readiness (from /api/health)
          </p>
          {flagsStatus !== 'ok' || !workspaceFlags ? (
            <p className="text-xs text-muted-foreground">
              Open <span className="font-mono text-[11px]">Workspace overview</span> above once
              signals load, or check server logs if health fails.
            </p>
          ) : (
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-foreground">SQLite</span>
                {workspaceFlags.persistentDbConfigured ? (
                  <span>reachable</span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-500">not reachable — incidents API may fail</span>
                )}
              </li>
              <li className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-foreground">AUTH_SECRET</span>
                {workspaceFlags.authSecretConfigured ? (
                  <span>32+ chars set (production-safe sessions)</span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-500">
                    missing or short — dev fallback may be in use
                  </span>
                )}
              </li>
              <li className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-foreground">Slack outbound</span>
                <span>{workspaceFlags.slackWebhookConfigured ? 'webhook env set' : 'not configured'}</span>
              </li>
              <li className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-foreground">Alert ingest</span>
                <span>
                  {workspaceFlags.alertIngestConfigured
                    ? 'secret env set (Bearer ingest enabled)'
                    : 'not configured — POST /api/ingest/alerts returns 503'}
                </span>
              </li>
            </ul>
          )}
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Operational shortcuts
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {governanceLinks.map(({ href, label, hint, icon: Icon }) => (
              <Button key={href} variant="outline" size="sm" className="h-auto min-h-9 justify-start gap-2 py-2" asChild>
                <Link href={href} title={hint}>
                  <Icon className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                  <span className="text-left">{label}</span>
                </Link>
              </Button>
            ))}
          </div>
        </div>

        <p className="text-[11px] leading-relaxed text-muted-foreground border-t border-border/50 pt-3">
          <span className="font-medium text-foreground">Roles:</span> admins hold{' '}
          <code className="rounded bg-secondary/80 px-1">team:roles</code> and{' '}
          <code className="rounded bg-secondary/80 px-1">team:prefs</code>; managers and admins can
          edit notification prefs; only admins change roles. HTTP API details live in the repo under{' '}
          <code className="rounded bg-secondary/80 px-1">docs/API.md</code>.
        </p>
      </CardContent>
    </Card>
  )
}
