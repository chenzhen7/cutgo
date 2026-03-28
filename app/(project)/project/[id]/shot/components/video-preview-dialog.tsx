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
} from "lucide-react"
import type { Shot } from "@/lib/types"

interface VideoPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shot: Shot | null
  onPrev: (() => void) | null
  onNext: (() => void) | null
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
  const [isMuted, setIsMuted] = useState(true)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!open) {
      setIsPlaying(false)
      setProgress(0)
    }
  }, [open, shot?.id])

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
      <DialogContent className="max-w-lg p-0 overflow-hidden bg-black/95 border-0">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="text-sm text-white/90 flex items-center gap-2">
            <Video className="size-4 text-violet-400" />
            镜头 #{shot.index + 1} 视频预览
          </DialogTitle>
          {shot.prompt && (
            <p className="text-xs text-white/50 line-clamp-1 mt-1">{shot.prompt}</p>
          )}
        </DialogHeader>

        <div className="relative flex items-center justify-center px-4">
          <div className="relative w-full max-w-[320px] mx-auto">
            <video
              ref={videoRef}
              src={shot.videoUrl}
              className="w-full aspect-[9/16] rounded-lg object-cover bg-black"
              loop
              playsInline
              muted={isMuted}
              onTimeUpdate={handleTimeUpdate}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
            />

            <button
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center group/play"
            >
              {!isPlaying && (
                <div className="size-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center transition-transform group-hover/play:scale-110">
                  <Play className="size-7 text-white ml-1" />
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="px-4 pb-4 pt-3 space-y-2">
          {/* Progress bar */}
          <div
            className="h-1 bg-white/10 rounded-full cursor-pointer group/progress"
            onClick={handleProgressClick}
          >
            <div
              className="h-full bg-violet-500 rounded-full transition-[width] relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 size-2.5 rounded-full bg-white opacity-0 group-hover/progress:opacity-100 transition-opacity" />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/10"
                onClick={togglePlay}
              >
                {isPlaying ? <Pause className="size-4" /> : <Play className="size-4 ml-0.5" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/10"
                onClick={toggleMute}
              >
                {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
              </Button>
              <span className="text-[10px] text-white/40 ml-1">
                {shot.videoDuration || "5s"}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs text-white/70 hover:text-white hover:bg-white/10"
                disabled={!onPrev}
                onClick={onPrev || undefined}
              >
                <ChevronLeft className="size-4 mr-0.5" />
                上一个
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs text-white/70 hover:text-white hover:bg-white/10"
                disabled={!onNext}
                onClick={onNext || undefined}
              >
                下一个
                <ChevronRight className="size-4 ml-0.5" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
