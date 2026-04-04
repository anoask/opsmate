'use client'

import { integrations } from '@/lib/mock-data'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, RotateCw } from 'lucide-react'
import { useState } from 'react'

export function IntegrationsSettings() {
  const [syncing, setSyncing] = useState<Record<string, boolean>>({})

  const handleSync = (id: string) => {
    setSyncing(prev => ({ ...prev, [id]: true }))
    setTimeout(() => setSyncing(prev => ({ ...prev, [id]: false })), 2000)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-900/30 text-green-400 border-green-800'
      case 'disconnected':
        return 'bg-gray-900/30 text-gray-400 border-gray-800'
      case 'error':
        return 'bg-red-900/30 text-red-400 border-red-800'
      default:
        return ''
    }
  }

  return (
    <Card className="bg-card border-border shadow-black/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Integrations</CardTitle>
          <CardDescription>Connect external services and platforms</CardDescription>
        </div>
        <Button size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Add Integration
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {integrations.map((integration) => (
            <div key={integration.id} className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/35 p-4 shadow-sm shadow-black/5 transition-colors hover:bg-secondary/50">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-medium text-foreground">{integration.name}</h4>
                  <Badge variant="secondary" className="capitalize text-xs">
                    {integration.type}
                  </Badge>
                  <Badge className={`capitalize text-xs border ${getStatusColor(integration.status)}`}>
                    {integration.status}
                  </Badge>
                </div>
                {integration.lastSync && (
                  <p className="text-sm leading-6 text-muted-foreground/90">
                    Last synced: {integration.lastSync}
                  </p>
                )}
              </div>
              {integration.status === 'connected' ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSync(integration.id)}
                  disabled={syncing[integration.id]}
                  className="gap-2"
                >
                  <RotateCw className={`w-4 h-4 ${syncing[integration.id] ? 'animate-spin' : ''}`} />
                  {syncing[integration.id] ? 'Syncing...' : 'Sync'}
                </Button>
              ) : (
                <Button size="sm">Connect</Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
