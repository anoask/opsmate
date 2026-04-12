'use client'

import type { Notification } from '@/lib/types'
import Link from 'next/link'

import { notificationRules } from '@/lib/mock-data'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit2, Plus } from 'lucide-react'
import { useState } from 'react'

export function NotificationsSettings() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    Object.fromEntries(notificationRules.map(r => [r.id, r.enabled]))
  )

  const toggleRule = (id: Notification['id']) => {
    setEnabled(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <Card className="bg-card border-border shadow-black/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Notification Rules</CardTitle>
          <CardDescription>
            Demo list for layout only—toggles do not persist. Real Slack delivery uses{' '}
            <Link href="/team" className="text-primary underline-offset-2 hover:underline">
              Team
            </Link>{' '}
            (critical, assignment, lifecycle) plus server routing; audit outcomes in{' '}
            <Link href="/notifications" className="text-primary underline-offset-2 hover:underline">
              Notification center
            </Link>
            .
          </CardDescription>
        </div>
        <Button size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          New Rule
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-border/70 bg-secondary/30">
          <AlertTitle className="text-sm">Illustrative rules</AlertTitle>
          <AlertDescription className="text-xs leading-relaxed text-muted-foreground">
            To change who gets pinged, edit teammates on Team. Alert ingestion and incident workflows
            are separate from this panel.
          </AlertDescription>
        </Alert>
        {notificationRules.map((rule) => (
          <div key={rule.id} className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/35 p-4 shadow-sm shadow-black/5 transition-colors hover:bg-secondary/50">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h4 className="font-medium text-foreground">{rule.name}</h4>
                <input
                  type="checkbox"
                  checked={enabled[rule.id]}
                  onChange={() => toggleRule(rule.id)}
                  className="w-4 h-4 rounded cursor-pointer"
                />
              </div>
              <p className="mb-2 text-sm leading-6 text-muted-foreground/90">
                {rule.trigger}
              </p>
              <div className="flex gap-2 flex-wrap">
                {rule.channels.map((channel) => (
                  <Badge key={channel} variant="secondary" className="capitalize text-xs">
                    {channel}
                  </Badge>
                ))}
              </div>
            </div>
            <Button variant="ghost" size="sm">
              <Edit2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
