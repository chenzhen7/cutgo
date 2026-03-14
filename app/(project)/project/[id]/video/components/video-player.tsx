"use client"

import { useRef, useEffect, useCallback } from "react"
import { useVideoStore } from "@/store/video-store"
import { VideoPlayerControls } from "./video-player-controls"
import type { VideoComposition } from "@/lib/types"

interface VideoPlayerProps {
  task: VideoComposition
}

export function VideoPlayer({ task }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const { playerState, setPlayerState } = useVideoStore()

  const videoSrc = task.outputPath
    ? `/api/videos/${task.id}/preview`
    : null

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => setPlayerState({ currentTime: video.currentTime })
    const handleDurationChange = () => setPlayerState({ duration: video.duration })
    const handlePlay = () => setPlayerState({ isPlaying: true })
    const handlePause = () => setPlayerState({ isPlaying: false })
    const handleEnded = () => setPlayerState({ isPlaying: false })

    video.addEventListener("timeupdate", handleTimeUpdate)
    video.addEventListener("durationchange", handleDurationChange)
    video.addEventListener("play", handlePlay)
    video.addEventListener("pause", handlePause)
    video.addEventListener("ended", handleEnded)

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("durationchange", handleDurationChange)
      video.removeEventListener("play", handlePlay)
      video.removeEventListener("pause", handlePause)
      video.removeEventListener("ended", handleEnded)
    }
  }, [setPlayerState])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.volume = playerState.volume / 100
  }, [playerState.volume])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.playbackRate = playerState.playbackRate
  }, [playerState.playbackRate])

  const handlePlayPause = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    if (playerState.isPlaying) {
      video.pause()
    } else {
      video.play()
    }
  }, [playerState.isPlaying])

  const handleSeek = useCallback((time: number) => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = time
    setPlayerState({ currentTime: time })
  }, [setPlayerState])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const video = videoRef.current
      if (!video) return
      switch (e.key) {
        case " ":
          e.preventDefault()
          handlePlayPause()
          break
        case "ArrowLeft":
          e.preventDefault()
          handleSeek(Math.max(0, playerState.currentTime - 5))
          break
        case "ArrowRight":
          e.preventDefault()
          handleSeek(Math.min(playerState.duration, playerState.currentTime + 5))
          break
        case "ArrowUp":
          e.preventDefault()
          setPlayerState({ volume: Math.min(100, playerState.volume + 10) })
          break
        case "ArrowDown":
          e.preventDefault()
          setPlayerState({ volume: Math.max(0, playerState.volume - 10) })
          break
      }
    },
    [handlePlayPause, handleSeek, playerState, setPlayerState]
  )

  return (
    <div
      className="flex flex-col overflow-hidden rounded-xl border bg-black"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="relative flex flex-1 items-center justify-center bg-zinc-950" style={{ aspectRatio: "9/16", maxHeight: "60vh" }}>
        {videoSrc ? (
          <video
            ref={videoRef}
            src={videoSrc}
            className="h-full w-full object-contain"
            playsInline
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-zinc-400">
            <div className="text-4xl">🎬</div>
            <p className="text-sm">
              {task.status === "completed" ? "视频文件路径：" + task.outputPath : "合成完成后可在此预览"}
            </p>
          </div>
        )}
      </div>

      <VideoPlayerControls
        isPlaying={playerState.isPlaying}
        currentTime={playerState.currentTime}
        duration={playerState.duration || (task.videoDuration ?? 0)}
        volume={playerState.volume}
        playbackRate={playerState.playbackRate}
        onPlayPause={handlePlayPause}
        onSeek={handleSeek}
        onVolumeChange={(v) => setPlayerState({ volume: v })}
        onPlaybackRateChange={(r) => setPlayerState({ playbackRate: r })}
      />
    </div>
  )
}
