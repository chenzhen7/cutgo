"use client"

import { useRef, useEffect, useCallback, useState, useMemo } from "react"
import { useVideoEditorStore } from "@/store/video-editor-store"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize2,
  RotateCcw,
} from "lucide-react"
import { cn } from "@/lib/utils"

export function VideoPreview() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastLoopTimeRef = useRef<number>(0)
  const lastClipIdRef = useRef<string | null>(null)

  const {
    videoClips,
    currentTime,
    duration,
    isPlaying,
    volume,
    setCurrentTime,
    setIsPlaying,
    setVolume,
  } = useVideoEditorStore()

  // 1. 优化：使用 useMemo 找到当前片段
  const currentClip = useMemo(() => {
    return videoClips.find(
      (c) => currentTime >= c.startTime && currentTime < c.startTime + c.duration
    )
  }, [videoClips, currentTime])

  // 2. 修复播放逻辑：同步 video 元素状态
  useEffect(() => {
    const video = videoRef.current
    if (!video || !currentClip) return

    // 处理相对路径
    const absoluteUrl = currentClip.videoUrl.startsWith('/')
      ? window.location.origin + currentClip.videoUrl
      : currentClip.videoUrl

    if (video.src !== absoluteUrl) {
      video.src = absoluteUrl
      video.load()
    }

    const clipLocalTime = currentTime - currentClip.startTime + currentClip.trimStart

    // 判断是否为用户操作（点击跳转）：当前时间与上次循环更新的时间差异较大
    // 如果是循环更新，currentTime 应该非常接近 lastLoopTimeRef.current
    const isUserAction = Math.abs(currentTime - lastLoopTimeRef.current) > 0.05

    // 检测片段是否发生变化
    const isClipChanged = currentClip.id !== lastClipIdRef.current
    if (currentClip) {
      lastClipIdRef.current = currentClip.id
    }

    // 只有在以下情况才强制同步时间：
    // 1. 非播放状态
    // 2. 用户手动跳转（isUserAction）
    // 3. 片段切换（isClipChanged）- 解决不连续片段播放时的跳变问题
    if (!isPlaying || isUserAction || isClipChanged) {
      // 只有当 video 时间与目标时间确实有偏差时才设置，避免微小抖动
      if (Math.abs(video.currentTime - clipLocalTime) > 0.1) {
        video.currentTime = clipLocalTime
      }
    }

    if (isPlaying) {
      video.play().catch(() => {
        // 忽略自动播放限制导致的错误
      })
    } else {
      video.pause()
    }
  }, [currentClip, isPlaying, currentTime])

  // 3. 优化：由 video 驱动 currentTime 更新，更平滑
  useEffect(() => {
    const video = videoRef.current
    if (!video || !isPlaying) return

    let animFrame: number
    const tick = () => {
      if (video && !video.paused && currentClip) {
        const newGlobalTime = video.currentTime - currentClip.trimStart + currentClip.startTime
        // 只有当时间真的有显著变化时才更新 store，减少重绘压力
        if (Math.abs(newGlobalTime - useVideoEditorStore.getState().currentTime) > 0.01) {
          lastLoopTimeRef.current = newGlobalTime
          setCurrentTime(newGlobalTime)
        }
      }
      animFrame = requestAnimationFrame(tick)
    }
    animFrame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animFrame)
  }, [isPlaying, currentClip, setCurrentTime])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.volume = volume / 100
  }, [volume])

  const togglePlay = useCallback(() => {
    if (currentTime >= duration && !isPlaying) {
      setCurrentTime(0)
    }
    setIsPlaying(!isPlaying)
  }, [isPlaying, currentTime, duration, setIsPlaying, setCurrentTime])

  const skipBack = useCallback(() => {
    setCurrentTime(Math.max(0, currentTime - 5))
  }, [currentTime, setCurrentTime])

  const skipForward = useCallback(() => {
    setCurrentTime(Math.min(duration, currentTime + 5))
  }, [currentTime, duration, setCurrentTime])

  const resetPlayback = useCallback(() => {
    setCurrentTime(0)
    setIsPlaying(false)
  }, [setCurrentTime, setIsPlaying])

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  const handleMouseMove = useCallback(() => {
    setShowControls(true)
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current)
    controlsTimerRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false)
    }, 3000)
  }, [isPlaying])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 10)
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}.${ms}`
  }

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // 如果焦点在输入框、文本框或选择器中，不触发快捷键
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable ||
        (e.target as HTMLElement).closest('[role="combobox"]') ||
        (e.target as HTMLElement).closest('select')
      ) {
        return
      }

      if (e.code === "Space") {
        e.preventDefault()
        togglePlay()
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault()
        skipBack()
      }
      if (e.key === "ArrowRight") {
        e.preventDefault()
        skipForward()
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [togglePlay, skipBack, skipForward])

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full bg-black/95 rounded-lg overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Video display area */}
      <div
        className="flex-1 relative flex items-center justify-center cursor-pointer min-h-0"
        onClick={togglePlay}
      >
        {currentClip ? (
          <video
            ref={videoRef}
            className="max-w-full max-h-full object-contain"
            playsInline
            muted={volume === 0}
          />
        ) : (
          <div className="flex flex-col items-center gap-3 text-white/40">
            <Play className="size-16" />
            <p className="text-sm">
              {videoClips.length === 0 ? "暂无视频片段" : "点击播放"}
            </p>
          </div>
        )}

        {/* Clip info overlay */}
        {currentClip && (
          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm rounded px-2 py-1">
            <p className="text-xs text-white/80 truncate max-w-[200px]">
              {currentClip.label}
            </p>
          </div>
        )}

        {/* Play/Pause overlay */}
        {!isPlaying && currentClip && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="size-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Play className="size-8 text-white ml-1" />
            </div>
          </div>
        )}
      </div>

      {/* Controls bar */}
      <div
        className={cn(
          "shrink-0 px-4 py-2 bg-black/80 backdrop-blur-sm transition-opacity duration-300",
          showControls || !isPlaying ? "opacity-100" : "opacity-0"
        )}
      >
        {/* Progress bar */}
        <div className="mb-2">
          <Slider
            value={[currentTime]}
            min={0}
            max={Math.max(duration, 0.1)}
            step={0.01}
            onValueChange={([v]) => setCurrentTime(v)}
            className="cursor-pointer [&_[data-slot=slider-track]]:h-1.5 [&_[data-slot=slider-track]]:bg-white/20 [&_[data-slot=slider-range]]:bg-primary [&_[data-slot=slider-thumb]]:size-3 [&_[data-slot=slider-thumb]]:border-primary"
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-white/80 hover:text-white hover:bg-white/10"
              onClick={(e) => { e.stopPropagation(); resetPlayback() }}
            >
              <RotateCcw className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-white/80 hover:text-white hover:bg-white/10"
              onClick={(e) => { e.stopPropagation(); skipBack() }}
            >
              <SkipBack className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-9 text-white hover:text-white hover:bg-white/10"
              onClick={(e) => { e.stopPropagation(); togglePlay() }}
            >
              {isPlaying ? <Pause className="size-5" /> : <Play className="size-5 ml-0.5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-white/80 hover:text-white hover:bg-white/10"
              onClick={(e) => { e.stopPropagation(); skipForward() }}
            >
              <SkipForward className="size-4" />
            </Button>
          </div>

          <div className="text-xs text-white/70 font-mono tabular-nums">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-white/70 hover:text-white hover:bg-white/10"
                onClick={(e) => {
                  e.stopPropagation()
                  setVolume(volume === 0 ? 80 : 0)
                }}
              >
                {volume === 0 ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
              </Button>
              <Slider
                value={[volume]}
                min={0}
                max={100}
                step={1}
                onValueChange={([v]) => setVolume(v)}
                className="w-16 [&_[data-slot=slider-track]]:h-1 [&_[data-slot=slider-track]]:bg-white/20 [&_[data-slot=slider-range]]:bg-white/60 [&_[data-slot=slider-thumb]]:size-2.5 [&_[data-slot=slider-thumb]]:border-white/60"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-white/70 hover:text-white hover:bg-white/10"
              onClick={(e) => { e.stopPropagation(); toggleFullscreen() }}
            >
              <Maximize2 className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
