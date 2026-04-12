'use client'

import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { TeamRosterCard } from '@/components/team/team-roster-card'
import { Button } from '@/components/ui/button'

export function TeamMembersSettings() {
  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-muted-foreground">
        Roster below uses live users when the API is available. Assignees and Slack subscribers come
        from the same records—open the full Team page to edit roles and notification preferences
        (critical, assignment, lifecycle).
      </p>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button variant="outline" size="sm" className="gap-2" asChild>
          <Link href="/team">
            Open Team page
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
      <TeamRosterCard />
    </div>
  )
}
