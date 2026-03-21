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
import { Sparkles, ChevronDown, Loader2, Paintbrush, Video } from "lucide-react"
import type { StoryboardGenerateStatus } from "@/lib/types"

interface StoryboardToolbarProps {
  generateStatus: StoryboardGenerateStatus
  batchImageStatus: "idle" | "generating" | "completed" | "error"
  batchImageProgress: { current: number; total: number } | null
  onGenerateAll: (mode: "skip_existing" | "overwrite") => void
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
  onGenerateAll,
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

  return (
    <div className="flex shrink-0 items-center gap-2">
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
                生成（跳过已生成）
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onGenerateAll("overwrite")}>
                重新生成
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
    </div>
  )
}
