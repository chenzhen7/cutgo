"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sparkles, ChevronDown, Loader2, Paintbrush, ImageIcon, CheckCircle2, Circle, Clock, Video, Type, Film } from "lucide-react"
import { cn } from "@/lib/utils"
import type { StoryboardGenerateStatus, Episode, Script, Storyboard } from "@/lib/types"
import type { ShotCardDisplayMode } from "./shot-card"

interface StoryboardToolbarProps {
  generateStatus: StoryboardGenerateStatus
  batchImageStatus: "idle" | "generating" | "completed" | "error"
  batchImageProgress: { current: number; total: number } | null
  stats: {
    storyboardCount: number
    totalShots: number
    coverage: string
    avgShotsPerScene: number
  }
  imageStats: { withImage: number; total: number }
  episodes: Episode[]
  scripts: Script[]
  storyboards: Storyboard[]
  activeEpisodeId: string | null
  shotDisplayMode: ShotCardDisplayMode
  onSelectEpisode: (episodeId: string) => void
  onGenerateAll: (mode: "skip_existing" | "overwrite") => void
  onSelectEpisodes: () => void
  onBatchGenerateImages: (mode: "all" | "missing_only") => void
  onBatchGenerateEpisodeImages: () => void
  batchVideoStatus: "idle" | "generating" | "completed" | "error"
  batchVideoProgress: { current: number; total: number } | null
  onBatchGenerateVideos: (mode: "all" | "missing_only") => void
  onBatchGenerateEpisodeVideos: () => void
}

export function StoryboardToolbar({
  generateStatus,
  batchImageStatus,
  batchImageProgress,
  stats,
  imageStats,
  episodes,
  scripts,
  storyboards,
  activeEpisodeId,
  shotDisplayMode,
  onSelectEpisode,
  onGenerateAll,
  onSelectEpisodes,
  onBatchGenerateImages,
  onBatchGenerateEpisodeImages,
  batchVideoStatus,
  batchVideoProgress,
  onBatchGenerateVideos,
  onBatchGenerateEpisodeVideos,
}: StoryboardToolbarProps) {
  const isGenerating = generateStatus === "generating"
  const isImageGenerating = batchImageStatus === "generating"
  const isVideoGenerating = batchVideoStatus === "generating"

  const getEpisodeStatus = (episodeId: string) => {
    const epScripts = scripts.filter((s) => s.episodeId === episodeId)
    const scriptIds = epScripts.map((s) => s.id)
    const epStoryboards = storyboards.filter(
      (sb) => scriptIds.includes(sb.scriptId) && sb.shots.length > 0
    )
    if (epStoryboards.length > 0 && epStoryboards.length >= scriptIds.length) return "generated"
    if (epStoryboards.length > 0) return "partial"
    return "none"
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Episode tabs and actions */}
      <div className="flex items-center justify-between gap-4">
        {episodes.length > 0 && (
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 custom-scrollbar">
            {episodes.map((ep) => {
              const status = getEpisodeStatus(ep.id)
              const isActive = activeEpisodeId === ep.id
              return (
                <button
                  key={ep.id}
                  onClick={() => onSelectEpisode(ep.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm whitespace-nowrap transition-colors shrink-0",
                    isActive
                      ? "bg-primary text-primary-foreground font-medium"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {status === "generated" && (
                    <CheckCircle2 className={cn("size-3", isActive ? "text-primary-foreground" : "text-green-600")} />
                  )}
                  {status === "partial" && (
                    <Clock className={cn("size-3", isActive ? "text-primary-foreground" : "text-yellow-600")} />
                  )}
                  {status === "none" && (
                    <Circle className="size-3 opacity-50" />
                  )}
                  第{ep.index + 1}集
                </button>
              )
            })}
          </div>
        )}

        <div className="flex items-center gap-2 shrink-0">
          {/* Batch image generation */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isImageGenerating} size="sm">
                {isImageGenerating ? (
                  <Loader2 className="size-4 mr-2 animate-spin" />
                ) : (
                  <Paintbrush className="size-4 mr-2" />
                )}
                {isImageGenerating
                  ? batchImageProgress
                    ? `生成画面 ${batchImageProgress.current}/${batchImageProgress.total}`
                    : "生成画面中..."
                  : "批量生成画面"}
                <ChevronDown className="size-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onBatchGenerateImages("missing_only")}>
                生成全部画面（跳过已有）
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onBatchGenerateImages("all")}>
                重新生成全部画面
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onBatchGenerateEpisodeImages}>
                生成当前分集画面
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Batch video generation */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isVideoGenerating} size="sm" className="border-violet-500/30 text-violet-700 dark:text-violet-400 hover:bg-violet-500/10">
                {isVideoGenerating ? (
                  <Loader2 className="size-4 mr-2 animate-spin" />
                ) : (
                  <Video className="size-4 mr-2" />
                )}
                {isVideoGenerating
                  ? batchVideoProgress
                    ? `生成视频 ${batchVideoProgress.current}/${batchVideoProgress.total}`
                    : "生成视频中..."
                  : "批量生成视频"}
                <ChevronDown className="size-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onBatchGenerateVideos("missing_only")}>
                生成全部视频（跳过已有）
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onBatchGenerateVideos("all")}>
                重新生成全部视频
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onBatchGenerateEpisodeVideos}>
                生成当前分集视频
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Storyboard generation */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button disabled={isGenerating} size="sm">
                {isGenerating ? (
                  <Loader2 className="size-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="size-4 mr-2" />
                )}
                {isGenerating ? "生成中..." : "AI 生成分镜"}
                <ChevronDown className="size-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onGenerateAll("skip_existing")}>
                生成全部（跳过已生成）
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onGenerateAll("overwrite")}>
                全部重新生成
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onSelectEpisodes}>
                选择分集生成...
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
