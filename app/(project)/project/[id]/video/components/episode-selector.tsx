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
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onKeyDown={(e) => {
            // 如果按下的是空格，且当前焦点在按钮上，阻止默认行为
            // 这样可以防止空格键在按钮聚焦时触发下拉菜单（由 Radix UI 默认处理）
            // 之后事件会冒泡到 window 被 VideoPreview 捕获处理播放/暂停
            if (e.code === "Space") {
              e.preventDefault()
            }
          }}
        >
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
              onClick={(e) => {
                setActiveEpisodeId(ep.id)
                // 延迟失焦，确保点击事件处理完成后焦点不再留在触发按钮上
                setTimeout(() => {
                  if (document.activeElement instanceof HTMLElement) {
                    document.activeElement.blur()
                  }
                }, 0)
              }}
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
