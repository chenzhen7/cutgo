"use client"

import Link from "next/link"
import { useParams, usePathname } from "next/navigation"
import { ArrowLeft, Film } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PIPELINE_STEPS } from "@/lib/pipeline"
import { cn } from "@/lib/utils"

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const pathname = usePathname()
  const projectId = params.id as string

  // 从 pathname 推断当前步骤
  const currentStepKey = pathname.split("/").pop() || "import"

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-sidebar">
        {/* Sidebar Header */}
        <div className="flex items-center gap-2 border-b border-sidebar-border px-4 py-3">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Film className="h-4 w-4 text-sidebar-foreground" />
            <span className="text-sm font-semibold text-sidebar-foreground">CutGo</span>
          </div>
        </div>

        {/* Project name */}
        <div className="border-b border-sidebar-border px-4 py-3">
          <p className="truncate text-sm font-medium text-sidebar-foreground">
            项目 #{projectId}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">抖音 / 60s</p>
        </div>

        {/* Pipeline Steps */}
        <nav className="flex flex-1 flex-col gap-1 px-2 py-3">
          {PIPELINE_STEPS.map((step) => {
            const isActive = currentStepKey === step.key
            const Icon = step.icon
            return (
              <Link
                key={step.key}
                href={`/project/${projectId}/${step.key}`}
              >
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded text-xs font-medium">
                    {step.step}
                  </span>
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{step.label}</span>
                </div>
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
