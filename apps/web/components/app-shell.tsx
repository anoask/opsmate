"use client"

import type { ReactNode } from "react"

import { ActorProvider } from "@/components/actor-context"
import { AppSidebar } from "@/components/app-sidebar"
import { TopBar } from "@/components/top-bar"
import { cn } from "@/lib/utils"

interface AppShellProps {
  children: ReactNode
  mainClassName?: string
}

export function AppShell({ children, mainClassName }: AppShellProps) {
  return (
    <ActorProvider>
      <div className="flex min-h-screen bg-background">
        <AppSidebar />
        <div className="flex min-h-screen flex-1 flex-col pl-64">
          <TopBar />
          <main className={cn("flex flex-1 flex-col", mainClassName)}>
            {children}
          </main>
        </div>
      </div>
    </ActorProvider>
  )
}
