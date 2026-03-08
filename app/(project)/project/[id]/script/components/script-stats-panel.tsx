"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Film, BarChart3, FileText } from "lucide-react"
import type { Script, Episode } from "@/lib/types"

interface ScriptStatsPanelProps {
  scripts: Script[]
  episodes: Episode[]
}

export function ScriptStatsPanel({ scripts, episodes }: ScriptStatsPanelProps) {
  const totalWords = scripts.reduce((sum, s) => sum + s.content.length, 0)

  const stats = [
    { label: "已生成", value: `${scripts.length}/${episodes.length}`, icon: Film },
    { label: "总字数", value: `${totalWords}字`, icon: FileText },
    { label: "生成覆盖", value: `${Math.round((scripts.length / Math.max(episodes.length, 1)) * 100)}%`, icon: BarChart3 },
  ]

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="flex items-center gap-3 py-3 px-4">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <stat.icon className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold leading-none">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
