"use client"

import { useCallback, useMemo, useState } from "react"
import {
  Loader2,
  ImageIcon,
  Trash2,
  Video,
  Play,
  Pause,
  Maximize2,
} from "lucide-react"
import { cn, parseJsonArray } from "@/lib/utils"
import type { Shot, ShotImageHistoryItem, ShotVideoHistoryItem } from "@/lib/types"
import { PreviewableImage } from "@/components/ui/previewable-image"
import { ShotHistoryStrip } from "./shot-history-strip"

interface ShotPreviewPanelProps {
  shot: Shot
  aspectRatio?: string
  activeTab: "image" | "video"
  isGeneratingImage: boolean
  isGeneratingVideo: boolean
  onClearImage: () => void
  onClearVideo: () => void
  onPlayVideo?: () => void
  onRestoreImageHistory?: (item: ShotImageHistoryItem) => void
  onRestoreVideoHistory?: (item: ShotVideoHistoryItem) => void
}

export function ShotPreviewPanel({
  shot,
  aspectRatio = "9:16",
  activeTab,
  isGeneratingImage,
  isGeneratingVideo,
  onClearImage,
  onClearVideo,
  onPlayVideo,
  onRestoreImageHistory,
  onRestoreVideoHistory,
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
      {/* Preview content */}
      <div className="flex-1 min-h-0 px-4 pt-3 pb-3">
        {activeTab === "image" ? (
          <div className="h-full min-h-0">
            {isGeneratingImage ? (
              <div className={cn(
                "h-full w-full rounded-lg bg-muted/50 flex flex-col items-center justify-center gap-2"
              )}>
                <Loader2 className="size-6 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground">生成中...</span>
              </div>
            ) : imageType === "first_last" && imageUrls.length >= 2 ? (
              <div className="h-full min-h-0 flex gap-2">
                <div className="flex-1 min-h-0 flex flex-col gap-1">
                  <span className="text-[10px] text-muted-foreground font-medium">首帧</span>
                  <div className={cn(
                    "flex-1 min-h-0 w-full rounded-lg bg-muted/20 p-1 flex items-center justify-center"
                  )}>
                    <PreviewableImage
                      src={imageUrls[0]}
                      alt="首帧"
                      className="max-h-full max-w-full rounded-md object-contain"
                    />
                  </div>
                </div>
                <div className="flex-1 min-h-0 flex flex-col gap-1">
                  <span className="text-[10px] text-muted-foreground font-medium">尾帧</span>
                  <div className={cn(
                    "flex-1 min-h-0 w-full rounded-lg bg-muted/20 p-1 flex items-center justify-center"
                  )}>
                    <PreviewableImage
                      src={imageUrls[1]}
                      alt="尾帧"
                      className="max-h-full max-w-full rounded-md object-contain"
                    />
                  </div>
                </div>
              </div>
            ) : hasImage ? (
              <div className={cn(
                "relative h-full min-h-0 w-full rounded-lg bg-muted/20 p-1 flex items-center justify-center"
              )}>
                <button
                  onClick={onClearImage}
                  className="absolute right-2 top-2 z-10 text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-0.5 bg-background/70 rounded px-1.5 py-0.5"
                >
                  <Trash2 className="size-3" />清除
                </button>
                <PreviewableImage
                  src={shot.imageUrl!}
                  alt="画面预览"
                  className="max-h-full max-w-full rounded-md object-contain"
                />
              </div>
            ) : (
              <div className={cn(
                "h-full w-full rounded-lg bg-muted/20 flex flex-col items-center justify-center gap-2"
              )}>
                <ImageIcon className="size-8" />
                <span className="text-xs ">暂无画面</span>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full min-h-0">
            <div className="h-full min-h-0">
              {isGeneratingVideo ? (
                <div className={cn(
                  "h-full w-full rounded-lg flex flex-col items-center justify-center gap-2"
                )}>
                  <Loader2 className="size-6 animate-spin" />
                  <span className="text-xs ">视频生成中...</span>
                  <span className="text-[10px] text-muted-foreground">预计需要 30-60 秒</span>
                </div>
              ) : shot.videoUrl ? (
                <div className="relative h-full min-h-0 w-full rounded-lg overflow-hidden group/video">
                  <video
                    ref={videoRef}
                    src={shot.videoUrl}
                    className="h-full w-full object-contain bg-black"
                    playsInline
                  />
                  <button
                    onClick={onClearVideo}
                    className="absolute left-2 top-2 z-10 text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-0.5 bg-background/70 rounded px-1.5 py-0.5"
                  >
                    <Trash2 className="size-3" />清除
                  </button>
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
                        <Pause className="size-5" />
                      ) : (
                        <Play className="size-5 ml-0.5" />
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
                  "h-full w-full rounded-lg flex flex-col items-center justify-center gap-2"
                )}>
                  <Video className="size-8 " />
                  <span className="text-xs ">暂无视频</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* History strip */}
      <ShotHistoryStrip
        shot={shot}
        activeTab={activeTab}
        onRestoreImage={onRestoreImageHistory}
        onRestoreVideo={onRestoreVideoHistory}
      />
    </div>
  )
}
