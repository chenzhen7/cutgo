"use client"

import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle2,
  Circle,
  Loader2,
  Sparkles,
  BookOpen,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Episode, Script, ScriptGenerateStatus } from "@/lib/types"

interface EpisodeNavListProps {
  episodes: Episode[]
  scripts: Script[]
  activeScriptId: string | null
  generateStatus: ScriptGenerateStatus
  onSelectScript: (scriptId: string) => void
  onGenerateEpisode: (episodeId: string) => void
}

export function EpisodeNavList({
  episodes,
  scripts,
  activeScriptId,
  generateStatus,
  onSelectScript,
  onGenerateEpisode,
}: EpisodeNavListProps) {
  const scriptMap = useMemo(() => {
    const map = new Map<string, Script>()
    for (const s of scripts) map.set(s.episodeId, s)
    return map
  }, [scripts])

  const chapterGroups = useMemo(() => {
    const groups = new Map<string, { chapter: Episode["chapter"]; episodes: Episode[] }>()
    for (const ep of episodes) {
      const key = ep.chapterId
      if (!groups.has(key)) {
        groups.set(key, { chapter: ep.chapter, episodes: [] })
      }
      groups.get(key)!.episodes.push(ep)
    }
    return Array.from(groups.values()).sort(
      (a, b) => a.chapter.index - b.chapter.index
    )
  }, [episodes])

  const isGenerating = generateStatus === "generating"

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden">
      <div className="flex flex-col gap-1 p-2">
        {chapterGroups.map((group) => (
          <div key={group.chapter.id} className="mb-2">
            <div className="flex items-center gap-1.5 px-2 py-1.5 min-w-0">
              <BookOpen className="size-3 shrink-0 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground truncate">
                {group.chapter.title || `第${group.chapter.index + 1}章`}
              </span>
            </div>
            {group.episodes.map((ep) => {
              const script = scriptMap.get(ep.id)
              const hasScript = !!script
              const isActive = script?.id === activeScriptId

              return (
                <div
                  key={ep.id}
                  className={cn(
                    "flex flex-col gap-1 rounded-md px-2 py-2 cursor-pointer transition-colors",
                    isActive
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-muted/50"
                  )}
                  onClick={() => {
                    if (script) onSelectScript(script.id)
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isGenerating ? (
                      <Loader2 className="size-3.5 shrink-0 animate-spin text-primary" />
                    ) : hasScript ? (
                      <CheckCircle2 className="size-3.5 shrink-0 text-green-500" />
                    ) : (
                      <Circle className="size-3.5 shrink-0 text-muted-foreground" />
                    )}
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      第{ep.index}集
                    </span>
                    <span className="text-sm font-medium truncate">
                      {ep.title}
                    </span>
                  </div>

                  {hasScript ? (
                    <div className="flex items-center gap-2 ml-5.5">
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1">
                        {script.content.length}字
                      </Badge>
                    </div>
                  ) : (
                    <div className="ml-5.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs px-2"
                        disabled={isGenerating}
                        onClick={(e) => {
                          e.stopPropagation()
                          onGenerateEpisode(ep.id)
                        }}
                      >
                        <Sparkles className="size-3" />
                        生成剧本
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
