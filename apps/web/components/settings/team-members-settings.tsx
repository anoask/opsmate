'use client'

import type { ComponentProps } from 'react'
import type { User } from '@/lib/types'

import { teamMembers } from '@/lib/mock-data'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Plus, Mail } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function TeamMembersSettings() {
  const roleColors: Record<
    User['role'],
    ComponentProps<typeof Badge>['variant']
  > = {
    admin: 'destructive',
    manager: 'default',
    responder: 'secondary',
    viewer: 'outline',
  }

  return (
    <Card className="bg-card border-border shadow-black/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>Manage team access and permissions</CardDescription>
        </div>
        <Button size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Invite Member
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {teamMembers.map((member) => (
            <div key={member.id} className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/35 p-4 shadow-sm shadow-black/5 transition-colors hover:bg-secondary/50">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h4 className="font-medium text-foreground">{member.name}</h4>
                  <Badge variant={roleColors[member.role]} className="capitalize text-xs">
                    {member.role}
                  </Badge>
                  {member.status === 'inactive' && (
                    <Badge variant="outline" className="text-xs">Inactive</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm leading-6 text-muted-foreground/90">
                  <Mail className="w-4 h-4" />
                  {member.email}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Edit</DropdownMenuItem>
                  <DropdownMenuItem>Change Role</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">Remove</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
