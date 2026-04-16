import { AppShell } from '@/components/app-shell'
import { TeamRosterCard } from '@/components/team/team-roster-card'

export default function TeamPage() {
  return (
    <AppShell mainClassName="p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Team</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground/90">
            Roster for assignment, roles, and Slack routing prefs (who gets which signals).
          </p>
        </div>
        <TeamRosterCard />
      </div>
    </AppShell>
  )
}
