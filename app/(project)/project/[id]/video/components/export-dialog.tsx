"use client"

import { useVideoEditorStore } from "@/store/video-editor-store"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  Download,
  Loader2,
  CheckCircle2,
  XCircle,
  Film,
  Settings2,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ExportDialog({ open, onOpenChange }: ExportDialogProps) {
  const {
    exportStatus,
    exportProgress,
    exportError,
    videoClips,
    bgmTrack,
    subtitleClips,
    duration,
    startExport,
    cancelExport,
  } = useVideoEditorStore()

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, "0")}`
  }

  const statusLabels: Record<string, string> = {
    idle: "准备导出",
    preparing: "准备中...",
    compositing: "合成中...",
    completed: "导出完成",
    error: "导出失败",
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="size-5" />
            导出视频
          </DialogTitle>
          <DialogDescription>
            将编辑好的视频合成为最终文件
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <Film className="size-4 mx-auto text-muted-foreground mb-1" />
              <p className="text-lg font-semibold">{videoClips.length}</p>
              <p className="text-xs text-muted-foreground">视频片段</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <Settings2 className="size-4 mx-auto text-muted-foreground mb-1" />
              <p className="text-lg font-semibold">{formatTime(duration)}</p>
              <p className="text-xs text-muted-foreground">总时长</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <p className="text-lg font-semibold">{subtitleClips.length}</p>
              <p className="text-xs text-muted-foreground">字幕条数</p>
            </div>
          </div>

          {/* Export settings */}
          {exportStatus === "idle" && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">输出分辨率</Label>
                <Select defaultValue="1080x1920">
                  <SelectTrigger className="h-9 text-sm mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1080x1920">1080×1920 (竖屏高清)</SelectItem>
                    <SelectItem value="720x1280">720×1280 (竖屏标清)</SelectItem>
                    <SelectItem value="1920x1080">1920×1080 (横屏高清)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">帧率</Label>
                <Select defaultValue="30">
                  <SelectTrigger className="h-9 text-sm mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24">24 fps</SelectItem>
                    <SelectItem value="30">30 fps</SelectItem>
                    <SelectItem value="60">60 fps</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">视频码率</Label>
                <Select defaultValue="8M">
                  <SelectTrigger className="h-9 text-sm mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4M">4 Mbps (较小文件)</SelectItem>
                    <SelectItem value="8M">8 Mbps (推荐)</SelectItem>
                    <SelectItem value="16M">16 Mbps (高质量)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* BGM info */}
              {bgmTrack && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="size-6 rounded bg-green-500/20 flex items-center justify-center">
                    <CheckCircle2 className="size-3.5 text-green-600" />
                  </div>
                  <span className="text-xs text-green-700 dark:text-green-400">
                    已添加BGM: {bgmTrack.label}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Export progress */}
          {exportStatus !== "idle" && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {exportStatus === "completed" ? (
                  <CheckCircle2 className="size-5 text-green-500" />
                ) : exportStatus === "error" ? (
                  <XCircle className="size-5 text-destructive" />
                ) : (
                  <Loader2 className="size-5 animate-spin text-primary" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">{statusLabels[exportStatus]}</p>
                  {exportError && (
                    <p className="text-xs text-destructive mt-0.5">{exportError}</p>
                  )}
                </div>
                <span className="text-sm font-mono tabular-nums text-muted-foreground">
                  {exportProgress}%
                </span>
              </div>
              <Progress value={exportProgress} className="h-2" />

              {exportStatus === "completed" && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                  <CheckCircle2 className="size-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">
                    视频导出成功！
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    文件已保存到输出目录
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          {exportStatus === "idle" && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button onClick={startExport} disabled={videoClips.length === 0}>
                <Download className="size-4 mr-1.5" />
                开始导出
              </Button>
            </>
          )}
          {(exportStatus === "preparing" || exportStatus === "compositing") && (
            <Button variant="outline" onClick={cancelExport}>
              取消导出
            </Button>
          )}
          {(exportStatus === "completed" || exportStatus === "error") && (
            <Button
              onClick={() => {
                cancelExport()
                onOpenChange(false)
              }}
            >
              完成
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
