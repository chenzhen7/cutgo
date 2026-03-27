"use client"

import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Film, ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useScriptShotsStore } from "@/store/script-shot-store"
import {
  buildEpisodeDisplayNumberMap,
  sortEpisodesByChapterAndIndex,
} from "@/lib/episode-display"

export function EpisodeSelector() {
  const episodes = useScriptShotsStore((s) => s.episodes)
  const scriptShotPlans = useScriptShotsStore((s) => s.scriptShotPlans)
  const activeEpisodeId = useScriptShotsStore((s) => s.activeEpisodeId)
  const setActiveEpisodeId = useScriptShotsStore((s) => s.setActiveEpisodeId)
  const setActiveShotId = useScriptShotsStore((s) => s.setActiveShotId)

  const orderedEpisodes = useMemo(
    () => sortEpisodesByChapterAndIndex(episodes),
    [episodes]
  )
  const displayNumberById = useMemo(
    () => buildEpisodeDisplayNumberMap(episodes),
    [episodes]
  )

  const activeEpisode = episodes.find((e) => e.id === activeEpisodeId)
  const activeDisplayN = activeEpisode
    ? displayNumberById.get(activeEpisode.id)
    : undefined

  const getEpisodeShotCount = (episodeId: string) => {
    const plans = scriptShotPlans.filter((plan) => plan.episodeId === episodeId)
    if (plans.length === 0) return null
    return plans.flatMap((plan) => plan.shots).length
  }

  if (episodes.length === 0) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
          <Film className="size-3.5" />
          {activeEpisode
            ? `第${activeDisplayN ?? 1}集 · ${activeEpisode.title}`
            : "选择分集"}
          <ChevronDown className="size-3.5 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {orderedEpisodes.map((episode) => {
          const displayN = displayNumberById.get(episode.id) ?? 1
          const shotCount = getEpisodeShotCount(episode.id)

          return (
            <DropdownMenuItem
              key={episode.id}
              onClick={() => {
                setActiveEpisodeId(episode.id)
                setActiveShotId(null)
              }}
              className={cn(activeEpisodeId === episode.id && "bg-accent")}
            >
              <span className="flex-1 truncate">
                第{displayN}集 · {episode.title}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {shotCount === null ? "--" : `${shotCount} 个镜头`}
              </span>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
