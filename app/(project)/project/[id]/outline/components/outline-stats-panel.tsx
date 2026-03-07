"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Film, Clock, Users, BookOpen, Layers } from "lucide-react"
import type { Episode, Chapter } from "@/lib/types"

interface OutlineStatsPanelProps {
  episodes: Episode[]
  chapters: Chapter[]
}

export function OutlineStatsPanel({ episodes, chapters }: OutlineStatsPanelProps) {
  const totalScenes = episodes.reduce((sum, ep) => sum + ep.scenes.length, 0)
  const totalDuration = episodes.reduce((sum, ep) => sum + (parseInt(ep.duration) || 0), 0)

  const allCharacters = new Set<string>()
  for (const ep of episodes) {
    for (const s of ep.scenes) {
      try {
        const chars = JSON.parse(s.characters || "[]")
        for (const c of chars) allCharacters.add(c)
      } catch { /* ignore */ }
    }
  }

  const coveredChapterIds = new Set(episodes.map((ep) => ep.chapterId))
  const selectedChapters = chapters.filter((ch) => ch.selected)

  const stats = [
    { label: "总集数", value: episodes.length, icon: Film },
    { label: "总场景", value: totalScenes, icon: Layers },
    { label: "总时长", value: `${totalDuration}s`, icon: Clock },
    { label: "涉及角色", value: allCharacters.size, icon: Users },
    { label: "章节覆盖", value: `${coveredChapterIds.size}/${selectedChapters.length}`, icon: BookOpen },
  ]

  return (
    <div className="grid grid-cols-5 gap-3">
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
