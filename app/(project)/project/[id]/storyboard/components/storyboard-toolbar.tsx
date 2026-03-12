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
import { Sparkles, ChevronDown, Loader2, Paintbrush, ImageIcon } from "lucide-react"
import type { StoryboardGenerateStatus } from "@/lib/types"

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
  onGenerateAll: (mode: "skip_existing" | "overwrite") => void
  onSelectEpisodes: () => void
  onBatchGenerateImages: (mode: "all" | "missing_only") => void
  onBatchGenerateEpisodeImages: () => void
}

export function StoryboardToolbar({
  generateStatus,
  batchImageStatus,
  batchImageProgress,
  stats,
  imageStats,
  onGenerateAll,
  onSelectEpisodes,
  onBatchGenerateImages,
  onBatchGenerateEpisodeImages,
}: StoryboardToolbarProps) {
  const isGenerating = generateStatus === "generating"
  const isImageGenerating = batchImageStatus === "generating"

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3 flex-wrap">
        <Badge variant="secondary" className="text-xs">
          {stats.coverage} 场景
        </Badge>
        <Badge variant="secondary" className="text-xs">
          {stats.totalShots} 个画面
        </Badge>
        <Badge variant="secondary" className="text-xs">
          均 {stats.avgShotsPerScene} 画面/场景
        </Badge>
        {imageStats.total > 0 && (
          <Badge variant="outline" className="text-xs gap-1">
            <ImageIcon className="size-3" />
            {imageStats.withImage}/{imageStats.total} 已生成图
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2">
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
  )
}
