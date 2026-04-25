"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Video,
  ListVideo,
} from "lucide-react"
import type { Shot } from "@/lib/types"

interface VideoPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shot: Shot | null
  onPrev: (() => void) | null
  onNext: (() => void) | null
}

function formatTime(seconds: number) {
  if (!seconds || isNaN(seconds)) return "0:00"
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

export function VideoPreviewDialog({
  open,
  onOpenChange,
  shot,
  onPrev,
  onNext,
}: VideoPreviewDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [autoPlayNext, setAutoPlayNext] = useState(true)

  useEffect(() => {
    if (!open) {
      setIsPlaying(false)
      setProgress(0)
      setCurrentTime(0)
      setDuration(0)
    }
  }, [open])

  useEffect(() => {
    if (open && shot?.videoUrl) {
      setProgress(0)
      setCurrentTime(0)
      // 视频源改变时尝试自动播放
      if (videoRef.current) {
        // 重置播放时间
        videoRef.current.currentTime = 0
        videoRef.current.play().catch(() => {
          // 忽略自动播放失败（例如浏览器限制非静音自动播放）
          setIsPlaying(false)
        })
      }
    }
  }, [shot?.id, shot?.videoUrl, open])

  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play()
      setIsPlaying(true)
    } else {
      video.pause()
      setIsPlaying(false)
    }
  }, [])

  const toggleMute = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setIsMuted(video.muted)
  }, [])

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current
    if (!video || !video.duration) return
    setCurrentTime(video.currentTime)
    setDuration(video.duration)
    setProgress((video.currentTime / video.duration) * 100)
  }, [])

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current
    if (!video || !video.duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const pct = x / rect.width
    video.currentTime = pct * video.duration
  }, [])

  const handleEnded = useCallback(() => {
    if (autoPlayNext && onNext) {
      onNext()
    } else {
      setIsPlaying(false)
    }
  }, [autoPlayNext, onNext])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === " ") { e.preventDefault(); togglePlay() }
      if (e.key === "ArrowLeft" && onPrev) { e.preventDefault(); onPrev() }
      if (e.key === "ArrowRight" && onNext) { e.preventDefault(); onNext() }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, togglePlay, onPrev, onNext])

  if (!shot || !shot.videoUrl) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-w-xl p-0 overflow-hidden bg-background border">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-sm font-medium flex items-center gap-2">
            <Video className="size-4 text-primary" />
            镜头 #{shot.index + 1} 视频预览
          </DialogTitle>
          {shot.content && (
            <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{shot.content}</p>
          )}
        </DialogHeader>

        <div className="relative flex items-center justify-center px-6 py-2">
          <div className="relative w-full max-w-[400px] mx-auto overflow-hidden rounded-xl border bg-muted shadow-sm">
            <video
              ref={videoRef}
              src={shot.videoUrl}
              className="w-full aspect-[9/16] object-cover bg-black"
              autoPlay
              loop={!autoPlayNext}
              playsInline
              muted={isMuted}
              onTimeUpdate={handleTimeUpdate}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={handleEnded}
            />

            <button
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center group/play bg-black/5 hover:bg-black/10 transition-colors"
            >
              {!isPlaying && (
                <div className="size-16 rounded-full bg-background/20 backdrop-blur-md flex items-center justify-center transition-transform group-hover/play:scale-110 border border-white/20">
                  <Play className="size-8 text-white fill-white ml-1" />
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="px-6 pb-6 pt-2 space-y-4">
          {/* Progress bar */}
          <div
            className="h-1.5 bg-secondary rounded-full cursor-pointer group/progress overflow-hidden"
            onClick={handleProgressClick}
          >
            <div
              className="h-full bg-primary rounded-full transition-[width] relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 size-3 rounded-full bg-white border-2 border-primary opacity-0 group-hover/progress:opacity-100 transition-opacity" />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground hover:text-foreground"
                onClick={togglePlay}
              >
                {isPlaying ? <Pause className="size-4" /> : <Play className="size-4 ml-0.5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground hover:text-foreground"
                onClick={toggleMute}
              >
                {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
              </Button>
              <div>
                <span className="text-[11px] text-muted-foreground ml-2 font-mono tabular-nums">
                  {formatTime(currentTime)} / {formatTime(duration || Number(shot.videoDuration) || 5)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={autoPlayNext ? "secondary" : "ghost"}
                size="sm"
                className={`h-8 px-3 text-xs flex items-center gap-1.5 ${autoPlayNext ? "text-primary" : "text-muted-foreground"}`}
                onClick={() => setAutoPlayNext(!autoPlayNext)}
                title="自动连播"
              >
                <ListVideo className="size-4" />
                连播
              </Button>
              <div className="w-px h-4 bg-border mx-1" />
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                  disabled={!onPrev}
                  onClick={onPrev || undefined}
                >
                  <ChevronLeft className="size-4" />
                  
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                  disabled={!onNext}
                  onClick={onNext || undefined}
                >
                  
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
