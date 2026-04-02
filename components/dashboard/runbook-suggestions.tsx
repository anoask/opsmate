import { BookOpen, Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { runbookSuggestions } from "@/lib/mock-data"

export function RunbookSuggestions() {
  return (
    <Card className="bg-card border-border shadow-black/20">
      <CardHeader className="flex flex-row items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <CardTitle className="text-base font-semibold">
          AI Runbook Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {runbookSuggestions.map((runbook) => (
          <div
            key={runbook.id}
            className="rounded-lg border border-border/50 bg-secondary/55 p-3 shadow-sm shadow-black/5"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium leading-5 text-foreground">
                  {runbook.title}
                </span>
              </div>
              <Button variant="outline" size="sm" className="h-7 text-xs">
                Apply
              </Button>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Progress value={runbook.relevance} className="h-1.5" />
              <span className="text-[13px] leading-5 text-muted-foreground/90">
                {runbook.relevance}% match
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
