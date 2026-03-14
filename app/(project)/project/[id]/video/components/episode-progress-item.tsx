"use client"

import { CheckCircle2, Loader2, AlertCircle, Circle, X } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import type { VideoComposition, VideoCompositionStatus } from "@/lib/types"

interface EpisodeProgressItemProps {
  episode: { id: string; index: number; title: string }
  task: VideoComposition | null
  status: VideoCompositionStatus | "none"
  onCancel?: (taskId: string) => void
}

const STATUS_STEP_MAP: Record<string, string> = {
  preparing: "准备素材",
  tts_generating: "生成配音",
  subtitle_generating: "生成字幕",
  compositing: "FFmpeg 合成",
  completed: "合成完成",
  error: "合成失败",
}

export function EpisodeProgressItem({ episode, task, status, onCancel }: EpisodeProgressItemProps) {
  const isActive = status === "preparing" || status === "tts_generating" || status === "subtitle_generating" || status === "compositing"

  return (
    <div className="flex items-start gap-3 py-2">
      <div className="mt-0.5 shrink-0">
        {status === "completed" && <CheckCircle2 className="h-5 w-5 text-green-500" />}
        {status === "error" && <AlertCircle className="h-5 w-5 text-destructive" />}
        {status === "none" && <Circle className="h-5 w-5 text-muted-foreground/40" />}
        {isActive && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium truncate">
            第{episode.index + 1}集 · {episode.title}
          </p>
          <div className="flex items-center gap-2 shrink-0">
            {status === "completed" && task?.videoDuration && (
              <span className="text-xs text-muted-foreground">
                {Math.floor(task.videoDuration / 60)}:{Math.floor(task.videoDuration % 60).toString().padStart(2, "0")}
              </span>
            )}
            {status !== "none" && status !== "completed" && (
              <span className="text-xs text-muted-foreground">
                {STATUS_STEP_MAP[status] || status}
                {task?.progress !== undefined && ` ${task.progress}%`}
              </span>
            )}
            {isActive && task && onCancel && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                onClick={() => onCancel(task.id)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
        {isActive && task && (
          <div className="mt-1.5 space-y-1">
            <Progress value={task.progress} className="h-1.5" />
            {task.currentStep && (
              <p className="text-xs text-muted-foreground">{task.currentStep}</p>
            )}
          </div>
        )}
        {status === "error" && task?.errorMessage && (
          <p className="mt-1 text-xs text-destructive">{task.errorMessage}</p>
        )}
      </div>
    </div>
  )
}
