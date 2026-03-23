"use client"

import { useMemo } from "react"
import { CheckCircle2, Circle, Clock, ChevronRight, Film } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Episode, Script, Storyboard } from "@/lib/types"
import {
  buildEpisodeDisplayNumberMap,
  sortEpisodesByChapterAndIndex,
} from "@/lib/episode-display"

interface EpisodeSelectViewProps {
  episodes: Episode[]
  scripts: Script[]
  storyboards: Storyboard[]
  onSelectEpisode: (episodeId: string) => void
}

export function EpisodeSelectView({
  episodes,
  scripts,
  storyboards,
  onSelectEpisode,
}: EpisodeSelectViewProps) {
  const orderedEpisodes = useMemo(
    () => sortEpisodesByChapterAndIndex(episodes),
    [episodes]
  )
  const displayNumberById = useMemo(
    () => buildEpisodeDisplayNumberMap(episodes),
    [episodes]
  )

  const getEpisodeInfo = (episodeId: string) => {
    const epScripts = scripts.filter((s) => s.episodeId === episodeId)
    const scriptIds = epScripts.map((s) => s.id)
    const epStoryboards = storyboards.filter(
      (sb) => scriptIds.includes(sb.scriptId) && sb.shots.length > 0
    )
    const shotCount = epStoryboards.reduce((sum, sb) => sum + sb.shots.length, 0)

    let status: "none" | "partial" | "generated" = "none"
    if (epStoryboards.length > 0 && epStoryboards.length >= scriptIds.length) status = "generated"
    else if (epStoryboards.length > 0) status = "partial"

    return { scriptCount: scriptIds.length, shotCount, status }
  }

  const statusConfig = {
    generated: {
      icon: CheckCircle2,
      label: "已生成",
      className: "text-green-600",
      badgeClass: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800",
    },
    partial: {
      icon: Clock,
      label: "部分生成",
      className: "text-yellow-600",
      badgeClass: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-800",
    },
    none: {
      icon: Circle,
      label: "未生成",
      className: "text-muted-foreground",
      badgeClass: "bg-muted text-muted-foreground border-border",
    },
  }

  return (
    <div className="flex h-full flex-col px-2.5 py-4 sm:px-3">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground">分镜设置</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          根据剧本自动生成分镜设计，可直接为每个镜头生成画面。选择分集开始编辑。
        </p>
      </div>

      {episodes.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-center">
          <Film className="size-12 text-muted-foreground mb-4" />
          <h3 className="text-base font-medium mb-2">暂无分集</h3>
          <p className="text-sm text-muted-foreground">
            请先在「剧本生成」中按章节创建分集并生成剧本
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {orderedEpisodes.map((ep) => {
            const info = getEpisodeInfo(ep.id)
            const config = statusConfig[info.status]
            const StatusIcon = config.icon
            const displayN = displayNumberById.get(ep.id) ?? 1

            return (
              <button
                key={ep.id}
                onClick={() => onSelectEpisode(ep.id)}
                className={cn(
                  "group relative flex flex-col text-left rounded-xl border bg-card p-5 transition-all duration-200",
                  "hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                )}
              >
                {/* Status badge */}
                <div className="flex items-center justify-between mb-3">
                  <span className={cn(
                    "inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border",
                    config.badgeClass
                  )}>
                    <StatusIcon className="size-3" />
                    {config.label}
                  </span>
                  <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>

                {/* Episode title */}
                <div className="mb-2">
                  <p className="text-xs text-muted-foreground mb-0.5">第 {displayN} 集</p>
                  <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-snug">
                    {ep.title || `第${displayN}集`}
                  </h3>
                </div>

                {/* Synopsis */}
                {ep.outline && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3 flex-1">
                    {ep.outline}
                  </p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-3 mt-auto pt-3 border-t border-border/60">
                  <span className="text-xs text-muted-foreground">
                    {info.scriptCount} 个场景
                  </span>
                  {info.shotCount > 0 && (
                    <>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">
                        {info.shotCount} 个镜头
                      </span>
                    </>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
