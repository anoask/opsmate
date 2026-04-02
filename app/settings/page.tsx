'use client'

import { AppShell } from '@/components/app-shell'
import { NotificationsSettings } from '@/components/settings/notifications-settings'
import { TeamMembersSettings } from '@/components/settings/team-members-settings'
import { IntegrationsSettings } from '@/components/settings/integrations-settings'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Bell, Users, Link as LinkIcon, Sliders } from 'lucide-react'

export default function SettingsPage() {
  return (
    <AppShell>
      {/* Header */}
      <div className="sticky top-0 bg-background z-10 pt-6 px-6 border-b border-border pb-4">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-sm leading-6 text-muted-foreground/90">
          Configure notifications, team, and integrations
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pb-6">
        <Tabs defaultValue="notifications" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="team" className="gap-2">
              <Users className="w-4 h-4" />
              Team
            </TabsTrigger>
            <TabsTrigger value="integrations" className="gap-2">
              <LinkIcon className="w-4 h-4" />
              Integrations
            </TabsTrigger>
            <TabsTrigger value="preferences" className="gap-2">
              <Sliders className="w-4 h-4" />
              Preferences
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notifications" className="space-y-6">
            <NotificationsSettings />
          </TabsContent>

          <TabsContent value="team" className="space-y-6">
            <TeamMembersSettings />
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            <IntegrationsSettings />
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <Card className="bg-card border-border shadow-black/20">
              <CardHeader>
                <CardTitle>Display Preferences</CardTitle>
                <CardDescription>Customize how OpsMate looks and behaves</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">Theme</label>
                    <Select defaultValue="dark">
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">Default Environment</label>
                    <Select defaultValue="prod">
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="prod">Production</SelectItem>
                        <SelectItem value="staging">Staging</SelectItem>
                        <SelectItem value="dev">Development</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">Auto-refresh Interval</label>
                    <Select defaultValue="30s">
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10s">10 seconds</SelectItem>
                        <SelectItem value="30s">30 seconds</SelectItem>
                        <SelectItem value="1m">1 minute</SelectItem>
                        <SelectItem value="5m">5 minutes</SelectItem>
                        <SelectItem value="manual">Manual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-black/20">
              <CardHeader>
                <CardTitle>Danger Zone</CardTitle>
                <CardDescription>Irreversible actions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/10">
                  <h4 className="font-medium text-destructive mb-2">Reset All Settings</h4>
                  <p className="text-sm text-muted-foreground mb-3">This will reset all your preferences to default values.</p>
                  <Button variant="outline" className="border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive">
                    Reset Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
