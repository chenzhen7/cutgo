"use client"

import { useVideoEditorStore } from "@/store/video-editor-store"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Film, ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function EpisodeSelector() {
  const { episodes, activeEpisodeId, setActiveEpisodeId, storyboards } = useVideoEditorStore()

  const activeEpisode = episodes.find((e) => e.id === activeEpisodeId)

  const getEpisodeVideoCount = (episodeId: string) => {
    return storyboards
      .filter((sb) => sb.script?.episode?.id === episodeId)
      .flatMap((sb) => sb.shots)
      .filter((s) => s.videoUrl)
      .length
  }

  if (episodes.length === 0) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
          <Film className="size-3.5" />
          {activeEpisode
            ? `第${activeEpisode.index + 1}集 · ${activeEpisode.title}`
            : "选择分集"}
          <ChevronDown className="size-3.5 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {episodes.map((ep) => {
          const count = getEpisodeVideoCount(ep.id)
          return (
            <DropdownMenuItem
              key={ep.id}
              onClick={() => setActiveEpisodeId(ep.id)}
              className={cn(activeEpisodeId === ep.id && "bg-accent")}
            >
              <span className="flex-1 truncate">
                第{ep.index + 1}集 · {ep.title}
              </span>
              <span className="text-xs text-muted-foreground shrink-0">
                {count} 个视频
              </span>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
