'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { User } from '@/lib/types'

type LoginFormProps = {
  users: User[]
}

export function LoginForm({ users }: LoginFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [userId, setUserId] = useState<string>(users[0]?.id ?? '')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) {
      setError('Choose a user to continue.')
      return
    }
    setError(null)
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const data = (await res.json().catch(() => null)) as { message?: string } | null
      if (!res.ok) {
        setError(data?.message ?? 'Sign-in failed.')
        return
      }
      const from = searchParams.get('from')?.trim()
      const safeFrom =
        from && from.startsWith('/') && !from.startsWith('//') ? from : '/'
      router.replace(safeFrom)
      router.refresh()
    } catch {
      setError('Unable to reach the server.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (users.length === 0) {
    return (
      <Card className="w-full max-w-md border-border/70 bg-card/90 shadow-lg shadow-black/20">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Sign in</CardTitle>
          <CardDescription>
            No seeded users are available. Ensure SQLite is initialized and the app has started at
            least once.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md border-border/70 bg-card/90 shadow-lg shadow-black/20">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl font-semibold">Sign in to OpsMate</CardTitle>
        <CardDescription>
          Demo auth: choose a seeded team member. Session is stored in a signed, HTTP-only cookie.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user">User</Label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger id="user" className="border-border/70 bg-secondary/40">
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    <span className="font-medium">{u.name}</span>
                    <span className="ml-2 text-muted-foreground">({u.role})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
            <LogIn className="h-4 w-4" />
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
