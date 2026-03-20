"use client"

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
    <div className="flex items-center gap-4">
      {stats.map((stat, i) => (
        <div key={stat.label} className="flex items-center gap-1.5">
          {i > 0 && <span className="mr-2.5 h-3 w-px bg-border" />}
          <stat.icon className="size-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{stat.label}</span>
          <span className="text-xs font-medium">{stat.value}</span>
        </div>
      ))}
    </div>
  )
}
