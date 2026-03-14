"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Play, ChevronDown, RefreshCw, Loader2 } from "lucide-react"
import { useVideoStore } from "@/store/video-store"
import type { Episode } from "@/lib/types"

interface StartCompositionDropdownProps {
  projectId: string
  episodes: Episode[]
}

export function StartCompositionDropdown({ projectId, episodes }: StartCompositionDropdownProps) {
  const { isStarting, startComposition, tasks } = useVideoStore()

  const handleStartAll = () => {
    startComposition(projectId)
  }

  const handleRecompose = () => {
    const completedEpisodeIds = tasks
      .filter((t) => t.status === "completed")
      .map((t) => t.episodeId)
    const uniqueIds = [...new Set(completedEpisodeIds)]
    if (uniqueIds.length > 0) {
      startComposition(projectId, uniqueIds)
    }
  }

  const completedCount = new Set(
    tasks.filter((t) => t.status === "completed").map((t) => t.episodeId)
  ).size

  return (
    <div className="flex items-center">
      <Button
        onClick={handleStartAll}
        disabled={isStarting}
        className="rounded-r-none gap-1.5"
      >
        {isStarting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Play className="h-4 w-4" />
        )}
        {isStarting ? "启动中..." : "合成全部分集"}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            disabled={isStarting}
            className="rounded-l-none border-l border-primary-foreground/20 px-2"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleStartAll} disabled={isStarting}>
            <Play className="mr-2 h-4 w-4" />
            合成全部分集（{episodes.length} 集）
          </DropdownMenuItem>
          {completedCount > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleRecompose} disabled={isStarting}>
                <RefreshCw className="mr-2 h-4 w-4" />
                重新合成已完成的分集（{completedCount} 集）
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
