"use client"

import { useCallback, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  ImageIcon,
  Trash2,
  Video,
  Play,
  Pause,
  Maximize2,
} from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { cn, parseJsonArray } from "@/lib/utils"
import type { Shot } from "@/lib/types"
import { PreviewableImage } from "@/components/ui/previewable-image"

interface ShotPreviewPanelProps {
  shot: Shot
  aspectRatio?: string
  activeTab: "image" | "video"
  isGeneratingImage: boolean
  isGeneratingVideo: boolean
  onTabChange: (tab: "image" | "video") => void
  onClearImage: () => void
  onClearVideo: () => void
  onPlayVideo?: () => void
  onPrev: (() => void) | null
  onNext: (() => void) | null
  onClose: () => void
}

export function ShotPreviewPanel({
  shot,
  aspectRatio = "9:16",
  activeTab,
  isGeneratingImage,
  isGeneratingVideo,
  onTabChange,
  onClearImage,
  onClearVideo,
  onPlayVideo,
  onPrev,
  onNext,
  onClose,
}: ShotPreviewPanelProps) {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const videoRef = useCallback((node: HTMLVideoElement | null) => {
    if (node) {
      node.onplay = () => setIsVideoPlaying(true)
      node.onpause = () => setIsVideoPlaying(false)
      node.onended = () => setIsVideoPlaying(false)
    }
  }, [])

  const imageType = shot.imageType || "keyframe"
  const imageUrls = useMemo(() => parseJsonArray(shot.imageUrls), [shot.imageUrls])
  const hasImage = !!shot.imageUrl

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">镜头详情</span>
          <span className="text-xs text-muted-foreground font-mono">#{shot.index + 1}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={!onPrev} onClick={onPrev || undefined}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={!onNext} onClick={onNext || undefined}>
            <ChevronRight className="size-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {/* Preview content */}
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-6 flex flex-col gap-3">
        <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as "image" | "video")}>
          <TabsList className="w-full">
            <TabsTrigger value="image" className="flex-1 gap-1.5 text-xs">
              <ImageIcon className="size-3.5" />
              画面生成
            </TabsTrigger>
            <TabsTrigger value="video" className="flex-1 gap-1.5 text-xs">
              <Video className="size-3.5" />
              视频生成
            </TabsTrigger>
          </TabsList>

          {/* Image preview */}
          <TabsContent value="image" className="mt-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">画面预览</Label>
                {hasImage && (
                  <button onClick={onClearImage} className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-0.5">
                    <Trash2 className="size-3" />清除
                  </button>
                )}
              </div>

              {isGeneratingImage ? (
                <div className={cn(
                  "w-full rounded-lg bg-muted/50 flex flex-col items-center justify-center gap-2",
                  aspectRatio === "16:9" ? "aspect-video" : "aspect-[9/16]"
                )}>
                  <Loader2 className="size-6 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground">生成中...</span>
                </div>
              ) : imageType === "first_last" && imageUrls.length >= 2 ? (
                <div className="flex gap-2">
                  <div className="flex-1 space-y-1">
                    <span className="text-[10px] text-muted-foreground font-medium">首帧</span>
                    <div className="w-full rounded-lg border bg-muted/20 p-1 flex items-center justify-center">
                      <PreviewableImage
                        src={imageUrls[0]}
                        alt="首帧"
                        className={cn("h-auto w-auto max-w-full rounded-md", aspectRatio === "16:9" ? "max-h-[300px]" : "max-h-[420px]")}
                      />
                    </div>
                  </div>
                  <div className="flex-1 space-y-1">
                    <span className="text-[10px] text-muted-foreground font-medium">尾帧</span>
                    <div className="w-full rounded-lg border bg-muted/20 p-1 flex items-center justify-center">
                      <PreviewableImage
                        src={imageUrls[1]}
                        alt="尾帧"
                        className={cn("h-auto w-auto max-w-full rounded-md", aspectRatio === "16:9" ? "max-h-[300px]" : "max-h-[420px]")}
                      />
                    </div>
                  </div>
                </div>
              ) : hasImage ? (
                <div className="w-full rounded-lg border bg-muted/20 p-1 flex items-center justify-center">
                  <PreviewableImage
                    src={shot.imageUrl!}
                    alt="画面预览"
                    className={cn("h-auto w-auto max-w-full rounded-md", aspectRatio === "16:9" ? "max-h-[400px]" : "max-h-[600px]")}
                  />
                </div>
              ) : (
                <div className={cn(
                  "w-full rounded-lg border border-dashed border-muted-foreground/15 bg-muted/20 flex flex-col items-center justify-center gap-2",
                  aspectRatio === "16:9" ? "aspect-video" : "aspect-[9/16]"
                )}>
                  <ImageIcon className="size-8 text-muted-foreground/20" />
                  <span className="text-xs text-muted-foreground/40">暂无画面</span>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Video preview */}
          <TabsContent value="video" className="mt-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Video className="size-3.5 text-violet-500" />
                  视频预览
                </Label>
                {shot.videoUrl && (
                  <button onClick={onClearVideo} className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-0.5">
                    <Trash2 className="size-3" />清除
                  </button>
                )}
              </div>

              {isGeneratingVideo ? (
                <div className={cn(
                  "w-full rounded-lg bg-violet-500/5 border border-violet-500/20 flex flex-col items-center justify-center gap-2",
                  aspectRatio === "16:9" ? "aspect-video" : "aspect-[9/16]"
                )}>
                  <Loader2 className="size-6 animate-spin text-violet-500" />
                  <span className="text-xs text-violet-600 dark:text-violet-400">视频生成中...</span>
                  <span className="text-[10px] text-muted-foreground">预计需要 30-60 秒</span>
                </div>
              ) : shot.videoUrl ? (
                <div className="relative w-full rounded-lg overflow-hidden border group/video">
                  <video
                    ref={videoRef}
                    src={shot.videoUrl}
                    className={cn(
                      "w-full object-contain bg-black",
                      aspectRatio === "16:9" ? "aspect-video" : "aspect-[9/16]"
                    )}
                    loop
                    playsInline
                    muted
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/video:opacity-100 transition-opacity bg-black/20">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        const video = e.currentTarget.parentElement?.parentElement?.querySelector("video")
                        if (video) {
                          if (video.paused) void video.play()
                          else video.pause()
                        }
                      }}
                      className="size-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg"
                    >
                      {isVideoPlaying ? (
                        <Pause className="size-5 text-violet-600" />
                      ) : (
                        <Play className="size-5 text-violet-600 ml-0.5" />
                      )}
                    </button>
                  </div>
                  {onPlayVideo && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onPlayVideo() }}
                      className="absolute top-2 right-2 size-7 rounded-md bg-black/50 flex items-center justify-center opacity-0 group-hover/video:opacity-100 transition-opacity hover:bg-black/70"
                    >
                      <Maximize2 className="size-3.5 text-white" />
                    </button>
                  )}
                  <div className="absolute bottom-2 left-2 bg-violet-600/80 text-white text-[9px] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                    <Video className="size-2.5" />
                    {shot.videoDuration ? `${shot.videoDuration}s` : "5s"}
                  </div>
                </div>
              ) : (
                <div className={cn(
                  "w-full rounded-lg border border-dashed border-violet-500/20 bg-violet-500/[0.02] flex flex-col items-center justify-center gap-2",
                  aspectRatio === "16:9" ? "aspect-video" : "aspect-[9/16]"
                )}>
                  <Video className="size-8 text-violet-500/20" />
                  <span className="text-xs text-muted-foreground/40">暂无视频</span>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
