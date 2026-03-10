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
import { Sparkles, ChevronDown, Loader2 } from "lucide-react"
import type { StoryboardGenerateStatus } from "@/lib/types"

interface StoryboardToolbarProps {
  generateStatus: StoryboardGenerateStatus
  stats: {
    storyboardCount: number
    totalShots: number
    coverage: string
    avgShotsPerScene: number
  }
  onGenerateAll: (mode: "skip_existing" | "overwrite") => void
  onSelectEpisodes: () => void
}

export function StoryboardToolbar({
  generateStatus,
  stats,
  onGenerateAll,
  onSelectEpisodes,
}: StoryboardToolbarProps) {
  const isGenerating = generateStatus === "generating"

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
      </div>

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
  )
}
