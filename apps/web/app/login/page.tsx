import { Suspense } from 'react'
import { LoginForm } from '@/components/auth/login-form'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { listStoredUsers } from '@/lib/server/users/store'
import type { User } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  let users: User[] = []
  try {
    users = listStoredUsers().filter((u) => u.status === 'active')
  } catch {
    users = []
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">OpsMate</h1>
        <p className="mt-1 text-sm text-muted-foreground">Incident operations console</p>
      </div>
      <Suspense
        fallback={
          <Card className="w-full max-w-md border-border/70 bg-card/90">
            <CardHeader />
            <CardContent className="flex justify-center py-8">
              <Spinner className="size-6 text-muted-foreground" />
            </CardContent>
          </Card>
        }
      >
        <LoginForm users={users} />
      </Suspense>
    </div>
  )
}
