"use client"

import { Button } from "@/components/ui/button"
import { Clapperboard, Loader2, Paintbrush, Video, ChevronDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { ScriptShotGenerateStatus } from "@/lib/types"

interface ScriptShotToolbarProps {
  generateStatus: ScriptShotGenerateStatus
  batchImageStatus: "idle" | "generating" | "completed" | "error"
  batchImageProgress: { current: number; total: number } | null
  canGenerateCurrentEpisode: boolean
  onGenerateCurrentEpisode: () => void
  onOpenBatchImageDialog: () => void
  batchVideoStatus: "idle" | "generating" | "completed" | "error"
  batchVideoProgress: { current: number; total: number } | null
  onBatchGenerateVideos: (mode: "all" | "missing_only") => void
  onBatchGenerateEpisodeVideos: () => void
}

export function ScriptShotToolbar({
  generateStatus,
  batchImageStatus,
  batchImageProgress,
  canGenerateCurrentEpisode,
  onGenerateCurrentEpisode,
  onOpenBatchImageDialog,
  batchVideoStatus,
  batchVideoProgress,
  onBatchGenerateVideos,
  onBatchGenerateEpisodeVideos,
}: ScriptShotToolbarProps) {
  const isGenerating = generateStatus === "generating"
  const isImageGenerating = batchImageStatus === "generating"
  const isVideoGenerating = batchVideoStatus === "generating"

  return (
    <div className="flex shrink-0 items-center gap-2">
      <div className="flex items-center gap-2 shrink-0">
        <Button variant="outline" disabled={isImageGenerating} size="sm" onClick={onOpenBatchImageDialog}>
          {isImageGenerating ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Paintbrush className="size-4 mr-2" />}
          {isImageGenerating
            ? batchImageProgress
              ? `生成画面 ${batchImageProgress.current}/${batchImageProgress.total}`
              : "生成画面中..."
            : "批量生成画面"}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" disabled={isVideoGenerating} size="sm" className="border-violet-500/30 text-violet-700 dark:text-violet-400 hover:bg-violet-500/10">
              {isVideoGenerating ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Video className="size-4 mr-2" />}
              {isVideoGenerating
                ? batchVideoProgress
                  ? `生成视频 ${batchVideoProgress.current}/${batchVideoProgress.total}`
                  : "生成视频中..."
                : "批量生成视频"}
              <ChevronDown className="size-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onBatchGenerateVideos("missing_only")}>生成全部视频（跳过已有）</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onBatchGenerateVideos("all")}>重新生成全部视频</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onBatchGenerateEpisodeVideos}>生成当前分集视频</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          disabled={isGenerating || !canGenerateCurrentEpisode}
          size="sm"
          onClick={onGenerateCurrentEpisode}
        >
          {isGenerating ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Clapperboard  className="size-4 mr-2" />}
          {isGenerating ? "生成中..." : "生成分镜"}
        </Button>
      </div>
    </div>
  )
}
