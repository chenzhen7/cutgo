"use client"

import { cn } from "@/lib/utils"
import { CheckCircle2, Circle, Loader2, AlertCircle, Play } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import type { VideoComposition, VideoCompositionStatus } from "@/lib/types"

interface EpisodeNavItemProps {
  episode: { id: string; index: number; title: string }
  task: VideoComposition | null
  status: VideoCompositionStatus | "none"
  isActive: boolean
  onClick: () => void
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

export function EpisodeNavItem({ episode, task, status, isActive, onClick }: EpisodeNavItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full rounded-lg p-3 text-left transition-colors",
        isActive
          ? "bg-primary/10 ring-1 ring-primary/30"
          : "hover:bg-muted/60"
      )}
    >
      <div className="flex items-start gap-2">
        <StatusIcon status={status} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            第{episode.index + 1}集 · {episode.title}
          </p>
          <StatusLabel status={status} task={task} />
        </div>
      </div>
      {status === "completed" && task && (
        <div className="mt-1.5 flex items-center gap-2 pl-6 text-xs text-muted-foreground">
          {task.videoDuration && <span>{formatDuration(task.videoDuration)}</span>}
          {task.fileSize && <span>{formatBytes(task.fileSize)}</span>}
        </div>
      )}
      {(status === "preparing" || status === "tts_generating" || status === "subtitle_generating" || status === "compositing") && task && (
        <div className="mt-2 pl-6">
          <Progress value={task.progress} className="h-1.5" />
          <p className="mt-0.5 text-xs text-muted-foreground">{task.progress}%</p>
        </div>
      )}
    </button>
  )
}

function StatusIcon({ status }: { status: VideoCompositionStatus | "none" }) {
  if (status === "completed") return <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
  if (status === "error") return <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
  if (status === "none") return <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40" />
  return <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-primary" />
}

function StatusLabel({ status, task }: { status: VideoCompositionStatus | "none"; task: VideoComposition | null }) {
  if (status === "completed") return <p className="text-xs text-green-600">已合成</p>
  if (status === "error") return <p className="text-xs text-destructive">合成失败</p>
  if (status === "none") return <p className="text-xs text-muted-foreground">未合成</p>
  if (status === "preparing") return <p className="text-xs text-primary">准备中...</p>
  if (status === "tts_generating") return <p className="text-xs text-primary">生成配音...</p>
  if (status === "subtitle_generating") return <p className="text-xs text-primary">生成字幕...</p>
  if (status === "compositing") return <p className="text-xs text-primary">合成中...</p>
  return null
}
