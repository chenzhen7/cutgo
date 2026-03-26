"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"
import { CheckCircle2, Circle, Clock } from "lucide-react"
import type { Episode, ScriptShotPlan } from "@/lib/types"
import { buildEpisodeDisplayNumberMap } from "@/lib/episode-display"

interface EpisodeNavListProps {
  episodes: Episode[]
  scriptShotPlans: ScriptShotPlan[]
  activeEpisodeId: string | null
  onSelectEpisode: (episodeId: string) => void
}

export function EpisodeNavList({
  episodes,
  scriptShotPlans,
  activeEpisodeId,
  onSelectEpisode,
}: EpisodeNavListProps) {
  const displayNumberById = useMemo(
    () => buildEpisodeDisplayNumberMap(episodes),
    [episodes]
  )

  const getEpisodeInfo = (episode: Episode) => {
    const plan = scriptShotPlans.find((sb) => sb.episodeId === episode.id)
    const shotCount = plan?.shots.length ?? 0
    const hasScript = !!episode.script

    let status: "none" | "partial" | "generated" = "none"
    if (shotCount > 0) status = "generated"
    else if (hasScript) status = "partial"

    return { hasScript, shotCount, status }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2.5 border-b">
        <h3 className="text-sm font-semibold">分集导航</h3>
      </div>
      <div className="flex-1 overflow-y-auto py-1 pb-12">
        {episodes.map((ep) => {
          const info = getEpisodeInfo(ep)
          const isActive = activeEpisodeId === ep.id
          const displayN = displayNumberById.get(ep.id) ?? 1

          return (
            <button
              key={ep.id}
              onClick={() => onSelectEpisode(ep.id)}
              className={cn(
                "w-full text-left px-3 py-2.5 transition-colors hover:bg-muted/50",
                isActive && "bg-primary/5 border-r-2 border-primary"
              )}
            >
              <div className="flex items-center gap-2">
                {info.status === "generated" && (
                  <CheckCircle2 className="size-3.5 text-green-600 shrink-0" />
                )}
                {info.status === "partial" && (
                  <Clock className="size-3.5 text-yellow-600 shrink-0" />
                )}
                {info.status === "none" && (
                  <Circle className="size-3.5 text-muted-foreground shrink-0" />
                )}
                <span className="text-sm font-medium truncate">
                  第{displayN}集
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5 ml-5">
                {ep.title}
              </p>
              <div className="flex items-center gap-2 mt-1 ml-5">
                <span className="text-xs text-muted-foreground">
                  {info.hasScript ? `${ep.script.length}字剧本` : "无剧本"}
                </span>
                {info.shotCount > 0 && (
                  <>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">
                      {info.shotCount}个画面
                    </span>
                  </>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
