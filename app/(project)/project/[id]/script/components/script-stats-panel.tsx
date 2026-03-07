"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Film, Clock, Users, Layers, FileText, BarChart3 } from "lucide-react"
import type { Script, Episode } from "@/lib/types"

interface ScriptStatsPanelProps {
  scripts: Script[]
  episodes: Episode[]
}

export function ScriptStatsPanel({ scripts, episodes }: ScriptStatsPanelProps) {
  const totalScenes = scripts.reduce((sum, s) => sum + s.scenes.length, 0)
  const totalLines = scripts.reduce(
    (sum, s) => sum + s.scenes.reduce((ss, sc) => ss + sc.lines.length, 0),
    0
  )
  const totalDuration = scripts.reduce(
    (sum, s) => sum + s.scenes.reduce((ss, sc) => ss + (parseInt(sc.duration) || 0), 0),
    0
  )

  const characters = new Set<string>()
  for (const s of scripts) {
    for (const sc of s.scenes) {
      for (const l of sc.lines) {
        if (l.type === "dialogue" && l.character) characters.add(l.character)
      }
    }
  }

  const stats = [
    { label: "剧本", value: `${scripts.length}/${episodes.length}`, icon: Film },
    { label: "总场景", value: totalScenes, icon: Layers },
    { label: "总台词", value: `${totalLines}行`, icon: FileText },
    { label: "总时长", value: `${totalDuration}s`, icon: Clock },
    { label: "涉及角色", value: characters.size, icon: Users },
    { label: "生成覆盖", value: `${scripts.length}/${episodes.length}`, icon: BarChart3 },
  ]

  return (
    <div className="grid grid-cols-6 gap-3">
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
