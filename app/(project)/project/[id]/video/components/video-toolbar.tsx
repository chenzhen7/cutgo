"use client"

import { Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useVideoStore } from "@/store/video-store"
import { StartCompositionDropdown } from "./start-composition-dropdown"
import type { Episode } from "@/lib/types"

interface VideoToolbarProps {
  projectId: string
  episodes: Episode[]
  onOpenConfig: () => void
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)}MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}GB`
}

function formatDuration(seconds: number) {
  if (seconds < 60) return `${Math.round(seconds)}s`
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}m${s}s`
}

export function VideoToolbar({ projectId, episodes, onOpenConfig }: VideoToolbarProps) {
  const { completedCount, totalOutputSize, totalDuration } = useVideoStore()

  const completed = completedCount()
  const size = totalOutputSize()
  const duration = totalDuration()

  return (
    <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-2.5">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onOpenConfig} className="gap-1.5">
          <Settings className="h-4 w-4" />
          合成配置
        </Button>
        {completed > 0 && (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>
              <span className="font-medium text-foreground">{completed}</span>/{episodes.length} 集已合成
            </span>
            {duration > 0 && (
              <span>总时长 <span className="font-medium text-foreground">{formatDuration(duration)}</span></span>
            )}
            {size > 0 && (
              <span><span className="font-medium text-foreground">{formatBytes(size)}</span></span>
            )}
          </div>
        )}
      </div>
      <StartCompositionDropdown projectId={projectId} episodes={episodes} />
    </div>
  )
}
