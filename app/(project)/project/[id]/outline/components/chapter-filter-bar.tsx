"use client"

import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Circle, Loader2, AlertCircle } from "lucide-react"
import type { Chapter, Episode } from "@/lib/types"
import { cn } from "@/lib/utils"

interface ChapterFilterBarProps {
  chapters: Chapter[]
  episodes: Episode[]
  filterChapterIds: string[]
  generatingChapterId?: string | null
  onFilterChange: (chapterIds: string[]) => void
}

export function ChapterFilterBar({
  chapters,
  episodes,
  filterChapterIds,
  generatingChapterId,
  onFilterChange,
}: ChapterFilterBarProps) {
  const selectedChapters = chapters.filter((ch) => ch.selected)
  const isAllSelected = filterChapterIds.length === 0

  const chapterEpisodeCounts = new Map<string, number>()
  for (const ep of episodes) {
    chapterEpisodeCounts.set(ep.chapterId, (chapterEpisodeCounts.get(ep.chapterId) || 0) + 1)
  }

  const toggleChapter = (chapterId: string) => {
    if (filterChapterIds.includes(chapterId)) {
      const next = filterChapterIds.filter((id) => id !== chapterId)
      onFilterChange(next)
    } else {
      onFilterChange([...filterChapterIds, chapterId])
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge
        variant={isAllSelected ? "default" : "outline"}
        className={cn(
          "cursor-pointer select-none transition-colors",
          isAllSelected && "bg-primary text-primary-foreground"
        )}
        onClick={() => onFilterChange([])}
      >
        全部 ({episodes.length})
      </Badge>
      {selectedChapters.map((ch) => {
        const count = chapterEpisodeCounts.get(ch.id) || 0
        const hasEpisodes = count > 0
        const isGenerating = generatingChapterId === ch.id
        const isActive = filterChapterIds.includes(ch.id)

        return (
          <Badge
            key={ch.id}
            variant={isActive ? "default" : "outline"}
            className={cn(
              "cursor-pointer select-none gap-1.5 transition-colors",
              isActive && "bg-primary text-primary-foreground",
              !hasEpisodes && !isGenerating && "opacity-60"
            )}
            onClick={() => toggleChapter(ch.id)}
          >
            {isGenerating ? (
              <Loader2 className="size-3 animate-spin" />
            ) : hasEpisodes ? (
              <CheckCircle2 className="size-3" />
            ) : (
              <Circle className="size-3" />
            )}
            {ch.title || `第${ch.index + 1}章`}
            {hasEpisodes && ` (${count})`}
            {!hasEpisodes && !isGenerating && (
              <span className="text-[10px] opacity-70">未生成</span>
            )}
          </Badge>
        )
      })}
    </div>
  )
}
