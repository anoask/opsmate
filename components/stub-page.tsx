import { AppSidebar } from "@/components/app-sidebar"
import { TopBar } from "@/components/top-bar"
import { Construction } from "lucide-react"

interface StubPageProps {
  title: string
  description: string
}

export function StubPage({ title, description }: StubPageProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex flex-1 flex-col pl-64">
        <TopBar />
        <main className="flex flex-1 flex-col items-center justify-center p-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="rounded-full bg-secondary p-4">
              <Construction className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </div>
            <p className="max-w-md text-sm text-muted-foreground">
              This page is coming soon. Check back later for updates.
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}
