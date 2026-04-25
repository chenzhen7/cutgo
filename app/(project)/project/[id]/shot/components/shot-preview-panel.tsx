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
  Upload,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Shot, ShotImageHistoryItem, ShotVideoHistoryItem } from "@/lib/types"
import { PreviewableImage } from "@/components/ui/previewable-image"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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
  onUploadImage?: (file: File) => void
  onUploadVideo?: (file: File) => void
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
  onUploadImage,
  onUploadVideo,
}: ShotPreviewPanelProps) {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [dragOverImage, setDragOverImage] = useState(false)
  const [dragOverVideo, setDragOverVideo] = useState(false)

  const videoRef = useCallback((node: HTMLVideoElement | null) => {
    if (node) {
      node.onplay = () => setIsVideoPlaying(true)
      node.onpause = () => setIsVideoPlaying(false)
      node.onended = () => setIsVideoPlaying(false)
    }
  }, [])

  const imageType = shot.imageType || "keyframe"
  const hasImage = !!shot.imageUrl

  const handleImageUpload = async (file: File) => {
    if (!onUploadImage) return
    setUploadingImage(true)
    try {
      await onUploadImage(file)
    } finally {
      setUploadingImage(false)
    }
  }

  const handleVideoUpload = async (file: File) => {
    if (!onUploadVideo) return
    setUploadingVideo(true)
    try {
      await onUploadVideo(file)
    } finally {
      setUploadingVideo(false)
    }
  }

  // 图片拖放
  const onImageDragOver = (e: React.DragEvent) => {
    if (!onUploadImage) return
    e.preventDefault()
    e.stopPropagation()
    setDragOverImage(true)
  }
  const onImageDragLeave = (e: React.DragEvent) => {
    if (!onUploadImage) return
    e.preventDefault()
    e.stopPropagation()
    setDragOverImage(false)
  }
  const onImageDrop = (e: React.DragEvent) => {
    if (!onUploadImage) return
    e.preventDefault()
    e.stopPropagation()
    setDragOverImage(false)
    const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith("image/"))
    if (file) void handleImageUpload(file)
  }

  // 视频拖放
  const onVideoDragOver = (e: React.DragEvent) => {
    if (!onUploadVideo) return
    e.preventDefault()
    e.stopPropagation()
    setDragOverVideo(true)
  }
  const onVideoDragLeave = (e: React.DragEvent) => {
    if (!onUploadVideo) return
    e.preventDefault()
    e.stopPropagation()
    setDragOverVideo(false)
  }
  const onVideoDrop = (e: React.DragEvent) => {
    if (!onUploadVideo) return
    e.preventDefault()
    e.stopPropagation()
    setDragOverVideo(false)
    const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith("video/"))
    if (file) void handleVideoUpload(file)
  }

  // 空状态上传区（图片）
  const EmptyImageZone = () => (
    <label
      className={cn(
        "h-full w-full rounded-lg flex flex-col items-center justify-center gap-3 cursor-pointer transition-all",
        dragOverImage
          ? "bg-primary/10 border-2 border-dashed border-primary"
          : "bg-muted/20 border-2 border-dashed border-transparent hover:border-muted-foreground/20"
      )}
    >
      {uploadingImage ? (
        <>
          <Loader2 className="size-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">上传中...</span>
        </>
      ) : (
        <>
          <div className="size-14 rounded-full bg-muted flex items-center justify-center">
            <ImageIcon className="size-7 text-muted-foreground/40" />
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">暂无画面</p>
            <p className="text-[11px] text-muted-foreground/50 mt-1">点击或拖入图片上传</p>
          </div>
        </>
      )}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.currentTarget.files?.[0]
          if (file) void handleImageUpload(file)
          e.currentTarget.value = ""
        }}
      />
    </label>
  )

  // 空状态上传区（视频）
  const EmptyVideoZone = () => (
    <label
      className={cn(
        "h-full w-full rounded-lg flex flex-col items-center justify-center gap-3 cursor-pointer transition-all",
        dragOverVideo
          ? "bg-primary/10 border-2 border-dashed border-primary"
          : "bg-muted/20 border-2 border-dashed border-transparent hover:border-muted-foreground/20"
      )}
    >
      {uploadingVideo ? (
        <>
          <Loader2 className="size-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">上传中...</span>
        </>
      ) : (
        <>
          <div className="size-14 rounded-full bg-muted flex items-center justify-center">
            <Video className="size-7 text-muted-foreground/40" />
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">暂无视频</p>
            <p className="text-[11px] text-muted-foreground/50 mt-1">点击或拖入视频上传</p>
          </div>
        </>
      )}
      <input
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const file = e.currentTarget.files?.[0]
          if (file) void handleVideoUpload(file)
          e.currentTarget.value = ""
        }}
      />
    </label>
  )

  // 图片操作按钮区
  const ImageActionButtons = () => (
    <div className="absolute right-2 top-2 z-10 flex items-center gap-1">
      {onUploadImage && (
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <label
                className={cn(
                  "size-7 flex items-center justify-center rounded-md bg-background/70 cursor-pointer hover:bg-background transition-colors",
                  uploadingImage ? "text-muted-foreground" : "text-muted-foreground hover:text-primary"
                )}
              >
                {uploadingImage ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Upload className="size-3.5" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.currentTarget.files?.[0]
                    if (file) void handleImageUpload(file)
                    e.currentTarget.value = ""
                  }}
                />
              </label>
            </TooltipTrigger>
            <TooltipContent>替换</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onClearImage}
              className="size-7 flex items-center justify-center rounded-md bg-background/70 text-muted-foreground hover:text-destructive hover:bg-background transition-colors"
            >
              <Trash2 className="size-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>清除</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )

  // 视频操作按钮区
  const VideoActionButtons = () => (
    <div className="absolute right-2 top-2 z-10 flex items-center gap-1">
      {onUploadVideo && (
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <label
                className={cn(
                  "size-7 flex items-center justify-center rounded-md bg-background/70 cursor-pointer hover:bg-background transition-colors",
                  uploadingVideo ? "text-muted-foreground" : "text-muted-foreground hover:text-primary"
                )}
              >
                {uploadingVideo ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Upload className="size-3.5" />
                )}
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.currentTarget.files?.[0]
                    if (file) void handleVideoUpload(file)
                    e.currentTarget.value = ""
                  }}
                />
              </label>
            </TooltipTrigger>
            <TooltipContent>替换</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onClearVideo}
              className="size-7 flex items-center justify-center rounded-md bg-background/70 text-muted-foreground hover:text-destructive hover:bg-background transition-colors"
            >
              <Trash2 className="size-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>清除</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {onPlayVideo && (
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={(e) => { e.stopPropagation(); onPlayVideo() }}
                className="size-7 rounded-md bg-background/70 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-background transition-colors"
              >
                <Maximize2 className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>放大</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )

  return (
    <div className="flex flex-col h-full">
      {/* Preview content */}
      <div className="flex-1 min-h-0 px-4 pt-3 pb-3">
        {activeTab === "image" ? (
          <div
            className="h-full min-h-0"
            onDragOver={onImageDragOver}
            onDragLeave={onImageDragLeave}
            onDrop={onImageDrop}
          >
            {isGeneratingImage ? (
              <div className={cn(
                "h-full w-full rounded-lg bg-muted/50 flex flex-col items-center justify-center gap-2"
              )}>
                <Loader2 className="size-6 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground">生成中...</span>
              </div>
            ) : imageType === "first_last" ? (
              <div className="h-full min-h-0 flex gap-2">
                <div className="flex-1 min-h-0 flex flex-col gap-1">
                  <span className="text-[10px] text-muted-foreground font-medium">首帧</span>
                  <div className={cn(
                    "flex-1 min-h-0 w-full rounded-lg bg-muted/20 p-1 flex items-center justify-center"
                  )}>
                    {shot.imageUrl ? (
                      <PreviewableImage
                        src={shot.imageUrl}
                        alt="首帧"
                        className="max-h-full max-w-full rounded-md object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <ImageIcon className="size-6 text-muted-foreground/25" />
                        <span className="text-[10px] text-muted-foreground/40">暂无首帧</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1 min-h-0 flex flex-col gap-1">
                  <span className="text-[10px] text-muted-foreground font-medium">尾帧</span>
                  <div className={cn(
                    "flex-1 min-h-0 w-full rounded-lg bg-muted/20 p-1 flex items-center justify-center"
                  )}>
                    {shot.lastFrameUrl ? (
                      <PreviewableImage
                        src={shot.lastFrameUrl}
                        alt="尾帧"
                        className="max-h-full max-w-full rounded-md object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <ImageIcon className="size-6 text-muted-foreground/25" />
                        <span className="text-[10px] text-muted-foreground/40">暂无尾帧</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : imageType === "multi_grid" ? (
              <div className={cn(
                "relative h-full min-h-0 w-full rounded-lg bg-muted/20 p-1 flex items-center justify-center"
              )}>
                {shot.imageUrl && <ImageActionButtons />}
                {shot.imageUrl ? (
                  <PreviewableImage
                    src={shot.imageUrl}
                    alt="多宫格预览"
                    className="max-h-full max-w-full rounded-md object-contain"
                  />
                ) : (
                  <EmptyImageZone />
                )}
                <div className="absolute inset-0 pointer-events-none rounded-lg" style={{
                  backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.3) 1px, transparent 1px)",
                  backgroundSize: "50% 50%",
                }} />
                <div className="absolute bottom-2 right-2 bg-black/40 text-white text-[9px] px-1.5 py-0.5 rounded">
                  {shot.gridLayout || "2x2"}
                </div>
              </div>
            ) : hasImage ? (
              <div className={cn(
                "relative h-full min-h-0 w-full rounded-lg bg-muted/20 p-1 flex items-center justify-center"
              )}>
                <ImageActionButtons />
                <PreviewableImage
                  src={shot.imageUrl!}
                  alt="画面预览"
                  className="max-h-full max-w-full rounded-md object-contain"
                />
              </div>
            ) : (
              <EmptyImageZone />
            )}
          </div>
        ) : (
          <div
            className="h-full min-h-0"
            onDragOver={onVideoDragOver}
            onDragLeave={onVideoDragLeave}
            onDrop={onVideoDrop}
          >
            <div className="h-full min-h-0">
              {isGeneratingVideo ? (
                <div className={cn(
                  "h-full w-full rounded-lg flex flex-col items-center justify-center gap-2"
                )}>
                  <Loader2 className="size-6 animate-spin" />
                  <span className="text-xs">视频生成中...</span>
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
                  <VideoActionButtons />
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
                  <div className="absolute bottom-2 left-2 bg-violet-600/80 text-white text-[9px] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                    <Video className="size-2.5" />
                    {shot.videoDuration ? `${shot.videoDuration}s` : "5s"}
                  </div>
                </div>
              ) : (
                <EmptyVideoZone />
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
