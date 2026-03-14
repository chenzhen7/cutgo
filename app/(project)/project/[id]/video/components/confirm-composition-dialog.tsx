"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useVideoStore } from "@/store/video-store"
import type { Episode } from "@/lib/types"

interface ConfirmCompositionDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  episodes: Episode[]
  isConfirming: boolean
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

export function ConfirmCompositionDialog({
  open,
  onClose,
  onConfirm,
  episodes,
  isConfirming,
}: ConfirmCompositionDialogProps) {
  const { tasks, completedCount, totalOutputSize, totalDuration } = useVideoStore()

  const completed = completedCount()
  const size = totalOutputSize()
  const duration = totalDuration()

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认合成，进入导出发布</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm">
              <p>已完成 {completed}/{episodes.length} 集视频合成，确认后将进入导出发布阶段。</p>
              <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">已合成分集</span>
                  <span className="font-medium">{completed} 集</span>
                </div>
                {duration > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">总视频时长</span>
                    <span className="font-medium">{formatDuration(duration)}</span>
                  </div>
                )}
                {size > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">总文件大小</span>
                    <span className="font-medium">{formatBytes(size)}</span>
                  </div>
                )}
              </div>
              {completed < episodes.length && (
                <p className="text-amber-600 dark:text-amber-400">
                  ⚠ 还有 {episodes.length - completed} 集未合成，确认后仍可继续合成剩余分集。
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isConfirming}>
            {isConfirming ? "处理中..." : "确认，进入导出发布"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
