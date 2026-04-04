'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { teamPerformance } from '@/lib/mock-data'
import { Users } from 'lucide-react'

export function TeamPerformance() {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Team Performance
        </CardTitle>
        <CardDescription>Individual member resolution metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {teamPerformance.map((member) => (
            <div key={member.name} className="border border-border rounded-lg p-4 bg-background/50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-foreground">{member.name}</h4>
                <span className="text-xs font-medium bg-accent/10 text-accent px-2 py-1 rounded">
                  {member.successRate}% success
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Resolved</p>
                  <p className="text-lg font-semibold text-foreground">{member.resolvedCount}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Avg MTTR</p>
                  <p className="text-lg font-semibold text-foreground">{member.avgMTTR}m</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Response Time</p>
                  <p className="text-lg font-semibold text-foreground">{member.avgResponseTime}m</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Success Rate</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full"
                        style={{ width: `${member.successRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
