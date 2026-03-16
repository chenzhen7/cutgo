"use client"

import React, { useRef, useCallback, useEffect, useState, useMemo } from "react"
import { useVideoEditorStore, type TimelineClip, type AudioClip, type SubtitleClip } from "@/store/video-editor-store"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Scissors,
  Trash2,
  ZoomIn,
  ZoomOut,
  Volume2,
  VolumeX,
  Lock,
  Unlock,
  Music,
  Type,
  Film,
} from "lucide-react"

// 1. 优化：将片段渲染抽离为 memo 组件，减少重绘
const TimelineClipItem = React.memo(({
  clip,
  type,
  isSelected,
  left,
  width,
  isDragging,
  onSelect,
  onDragStart,
  onResizeStart
}: {
  clip: TimelineClip | AudioClip | SubtitleClip
  type: "video" | "audio" | "subtitle"
  isSelected: boolean
  left: number
  width: number
  isDragging: boolean
  onSelect: (id: string, type: "video" | "audio" | "subtitle") => void
  onDragStart: (e: React.MouseEvent, id: string, type: "video" | "audio" | "subtitle") => void
  onResizeStart: (e: React.MouseEvent, id: string, edge: "left" | "right", type: "video" | "audio" | "subtitle") => void
}) => {
  const colorMap = {
    video: "bg-gray-500/80 border-zinc-400",
    audio: "bg-green-500/80 border-green-400",
    subtitle: "bg-amber-500/80 border-amber-400",
  }

  const iconMap = {
    video: <Film className="size-3 shrink-0" />,
    audio: <Music className="size-3 shrink-0" />,
    subtitle: <Type className="size-3 shrink-0" />,
  }

  return (
    <div
      className={cn(
        "absolute top-1 rounded-md border cursor-pointer select-none flex items-center gap-1 px-1.5 overflow-hidden transition-shadow",
        colorMap[type],
        isSelected && "ring-2 ring-blue-500 shadow-lg z-10",
        isDragging && "opacity-70"
      )}
      style={{
        left: `${left}px`,
        width: `${Math.max(width, 24)}px`,
        height: type === "video" ? "56px" : type === "audio" ? "40px" : "32px",
      }}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(clip.id, type)
      }}
      onMouseDown={(e) => onDragStart(e, clip.id, type)}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-white/30 z-20"
        onMouseDown={(e) => onResizeStart(e, clip.id, "left", type)}
      />

      {type === "video" && (clip as TimelineClip).thumbnailUrl && (
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <img
            src={(clip as TimelineClip).thumbnailUrl!}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="relative flex items-center gap-1 min-w-0 z-10 pointer-events-none">
        {iconMap[type]}
        <span className="text-[10px] text-white font-medium truncate">
          {"label" in clip ? (clip as TimelineClip | AudioClip).label : ""}
          {"text" in clip ? (clip as SubtitleClip).text.slice(0, 15) : ""}
        </span>
      </div>

      <div
        className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-white/30 z-20"
        onMouseDown={(e) => onResizeStart(e, clip.id, "right", type)}
      />
    </div>
  )
})

TimelineClipItem.displayName = "TimelineClipItem"

// 2. 优化：将刻度尺抽离为 memo 组件
const TimeRuler = React.memo(({
  timeMarkers,
  timeToX,
  scrollLeft
}: {
  timeMarkers: any[],
  timeToX: (t: number) => number,
  scrollLeft: number
}) => {
  return (
    <div className="h-6 border-b bg-muted/30 relative overflow-hidden">
      {timeMarkers.map((marker) => (
        <div
          key={marker.time}
          className="absolute top-0 bottom-0 flex flex-col items-center"
          style={{ left: `${timeToX(marker.time) - scrollLeft}px` }}
        >
          <span className="text-[9px] text-muted-foreground/70 mt-0.5">
            {marker.major ? marker.label : ""}
          </span>
          <div className={cn("w-px flex-1", marker.major ? "bg-border" : "bg-border/40")} />
        </div>
      ))}
    </div>
  )
})
TimeRuler.displayName = "TimeRuler"

export function TimelineEditor() {
  const timelineRef = useRef<HTMLDivElement>(null)
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false)
  const [dragClipId, setDragClipId] = useState<string | null>(null)
  const [dragStartX, setDragStartX] = useState(0)
  const [dragOriginalStart, setDragOriginalStart] = useState(0)
  const [resizingClip, setResizingClip] = useState<{ id: string; edge: "left" | "right"; type: "video" | "audio" | "subtitle" } | null>(null)
  const [resizeStartX, setResizeStartX] = useState(0)
  const [resizeOriginal, setResizeOriginal] = useState<{ startTime: number; duration: number; trimStart: number; trimEnd: number }>({ startTime: 0, duration: 0, trimStart: 0, trimEnd: 0 })

  // 本地播放头位置，用于拖动时的超平滑反馈
  const [localPlayheadX, setLocalPlayheadX] = useState<number | null>(null)

  const tracks = useVideoEditorStore(s => s.tracks)
  const videoClips = useVideoEditorStore(s => s.videoClips)
  const audioClips = useVideoEditorStore(s => s.audioClips)
  const subtitleClips = useVideoEditorStore(s => s.subtitleClips)
  const bgmTrack = useVideoEditorStore(s => s.bgmTrack)
  const selectedClipId = useVideoEditorStore(s => s.selectedClipId)
  const selectedClipType = useVideoEditorStore(s => s.selectedClipType)
  const currentTime = useVideoEditorStore(s => s.currentTime)
  const duration = useVideoEditorStore(s => s.duration)
  const zoom = useVideoEditorStore(s => s.zoom)
  const scrollLeft = useVideoEditorStore(s => s.scrollLeft)
  const pixelsPerSecond = useVideoEditorStore(s => s.pixelsPerSecond)

  const {
    selectClip,
    setCurrentTime,
    setZoom,
    setScrollLeft,
    updateVideoClip,
    updateAudioClip,
    updateSubtitleClip,
    removeVideoClip,
    removeAudioClip,
    removeSubtitleClip,
    splitVideoClip,
    toggleTrackMute,
    toggleTrackLock,
  } = useVideoEditorStore()

  const pps = pixelsPerSecond * zoom
  const totalWidth = Math.max(duration * pps + 400, 1200)

  const timeMarkers = useMemo(() => {
    const markers: { time: number; label: string; major: boolean }[] = []
    let step = 1
    if (pps < 20) step = 10
    else if (pps < 40) step = 5
    else if (pps < 80) step = 2
    else if (pps > 200) step = 0.5

    const maxTime = Math.max(duration + 20, 60)
    for (let t = 0; t <= maxTime; t += step) {
      const m = Math.floor(t / 60)
      const s = Math.floor(t % 60)
      markers.push({
        time: t,
        label: `${m}:${s.toString().padStart(2, "0")}`,
        major: t % (step * 5 === 0 ? step * 5 : step * 2) === 0,
      })
    }
    return markers
  }, [duration, pps])

  const timeToX = useCallback((time: number) => time * pps, [pps])
  const xToTime = useCallback((x: number) => Math.max(0, x / pps), [pps])

  const handleTimelineClick = useCallback(
    (e: React.MouseEvent) => {
      if (isDraggingPlayhead || dragClipId || resizingClip) return
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left + scrollLeft
      setCurrentTime(xToTime(x))
    },
    [isDraggingPlayhead, dragClipId, resizingClip, scrollLeft, xToTime, setCurrentTime]
  )

  const handlePlayheadMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDraggingPlayhead(true)
    const rect = timelineRef.current?.getBoundingClientRect()
    if (rect) {
      setLocalPlayheadX(e.clientX - rect.left + scrollLeft)
    }
  }, [scrollLeft])

  useEffect(() => {
    if (!isDraggingPlayhead) {
      setLocalPlayheadX(null)
      return
    }

    const handleMove = (e: MouseEvent) => {
      const timeline = timelineRef.current
      if (!timeline) return
      const rect = timeline.getBoundingClientRect()
      const x = e.clientX - rect.left + scrollLeft

      // 1. 立即更新本地状态，实现 0 延迟反馈
      setLocalPlayheadX(x)

      // 2. 异步更新 store，避免阻塞 UI
      const newTime = xToTime(x)
      setCurrentTime(newTime)
    }

    const handleUp = () => setIsDraggingPlayhead(false)
    window.addEventListener("mousemove", handleMove, { passive: true })
    window.addEventListener("mouseup", handleUp)
    return () => {
      window.removeEventListener("mousemove", handleMove)
      window.removeEventListener("mouseup", handleUp)
    }
  }, [isDraggingPlayhead, scrollLeft, xToTime, setCurrentTime])

  // 引用最新的 clips 数据，避免在 effect 中产生闭包陷阱或频繁重绑
  const clipsRef = useRef({ video: videoClips, audio: audioClips, subtitle: subtitleClips })
  useEffect(() => {
    clipsRef.current = { video: videoClips, audio: audioClips, subtitle: subtitleClips }
  }, [videoClips, audioClips, subtitleClips])

  const handleClipDragStart = useCallback(
    (e: React.MouseEvent, clipId: string, clipType: "video" | "audio" | "subtitle") => {
      e.stopPropagation()
      const clips = clipType === "video" ? videoClips : clipType === "audio" ? audioClips : subtitleClips
      const clip = clips.find((c) => c.id === clipId)
      if (!clip) return
      setDragClipId(clipId)
      setDragStartX(e.clientX)
      setDragOriginalStart(clip.startTime)
      selectClip(clipId, clipType)
    },
    [videoClips, audioClips, subtitleClips, selectClip]
  )

  useEffect(() => {
    if (!dragClipId) return
    
    const handleMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStartX
      const dt = dx / pps
      let newStart = Math.max(0, dragOriginalStart + dt)

      // --- 磁吸效果 (Snapping) ---
      const SNAP_THRESHOLD_PX = 10
      const snapThreshold = SNAP_THRESHOLD_PX / pps
      
      const currentClips = selectedClipType === "video" ? clipsRef.current.video 
        : selectedClipType === "audio" ? clipsRef.current.audio 
        : clipsRef.current.subtitle
      
      // 获取当前拖拽的 clip 对象
      const draggingClip = currentClips.find(c => c.id === dragClipId)
      if (!draggingClip) return

      // 收集吸附点：0, 播放头, 其他片段的头尾
      const snapPoints = [0, currentTime]
      currentClips.forEach(c => {
        if (c.id === dragClipId || c.trackId !== draggingClip.trackId) return
        snapPoints.push(c.startTime)
        snapPoints.push(c.startTime + c.duration)
      })

      // 寻找最近的吸附点
      let minDiff = Infinity
      let snapTarget = newStart

      // 检查头部吸附
      for (const point of snapPoints) {
        const diff = Math.abs(newStart - point)
        if (diff < snapThreshold && diff < minDiff) {
          minDiff = diff
          snapTarget = point
        }
      }

      // 检查尾部吸附 (可选，如果需要尾部对齐)
      const newEnd = newStart + draggingClip.duration
      for (const point of snapPoints) {
        const diff = Math.abs(newEnd - point)
        if (diff < snapThreshold && diff < minDiff) {
          minDiff = diff
          snapTarget = point - draggingClip.duration
        }
      }

      // 应用吸附
      if (minDiff < Infinity) {
        newStart = snapTarget
      }

      // 实时更新位置 (允许重叠)
      if (selectedClipType === "video") updateVideoClip(dragClipId, { startTime: newStart })
      else if (selectedClipType === "audio") updateAudioClip(dragClipId, { startTime: newStart })
      else if (selectedClipType === "subtitle") updateSubtitleClip(dragClipId, { startTime: newStart })
    }

    const handleUp = () => {
      // --- 松手后的处理：重叠检测与自动寻找最近空位 ---
      const currentClips = selectedClipType === "video" ? clipsRef.current.video 
        : selectedClipType === "audio" ? clipsRef.current.audio 
        : clipsRef.current.subtitle
      
      const draggingClip = currentClips.find(c => c.id === dragClipId)
      
      if (draggingClip) {
        const myStart = draggingClip.startTime
        const myDuration = draggingClip.duration
        const myEnd = myStart + myDuration

        // 1. 获取同轨道其他片段（排除自己），按时间排序
        const otherClips = currentClips
          .filter(c => c.trackId === draggingClip.trackId && c.id !== dragClipId)
          .sort((a, b) => a.startTime - b.startTime)

        // 2. 检测是否发生重叠
        const isOverlapping = otherClips.some(c => {
          const start = c.startTime
          const end = c.startTime + c.duration
          // 简单的 AABB 碰撞检测 (使用小容差避免浮点数问题)
          return !(end <= myStart + 0.001 || start >= myEnd - 0.001)
        })

        if (isOverlapping) {
          // 3. 如果重叠，寻找最近的有效空位
          let bestStart = -1
          let minDistance = Infinity

          const checkCandidate = (t: number) => {
            const dist = Math.abs(t - myStart)
            if (dist < minDistance) {
              minDistance = dist
              bestStart = t
            }
          }

          // 遍历所有空隙
          let currentPos = 0
          for (const clip of otherClips) {
            const gapStart = currentPos
            const gapEnd = clip.startTime
            const gapLen = gapEnd - gapStart

            if (gapLen >= myDuration) {
              // 这个空隙够大，寻找空隙内离 myStart 最近的合法位置
              // 合法起始范围: [gapStart, gapEnd - myDuration]
              const validRangeStart = gapStart
              const validRangeEnd = gapEnd - myDuration
              const clamped = Math.max(validRangeStart, Math.min(validRangeEnd, myStart))
              checkCandidate(clamped)
            }
            currentPos = clip.startTime + clip.duration
          }

          // 检查最后一个空隙 (无限长)
          const lastGapStart = currentPos
          // 合法起始范围: [lastGapStart, Infinity]
          // 离 myStart 最近的点就是 max(lastGapStart, myStart)
          checkCandidate(Math.max(lastGapStart, myStart))

          // 4. 应用位置或回弹
          // 如果找到了位置 (bestStart !== -1)，移动过去
          // 如果 bestStart 离得太远（比如用户想放弃），通常 draggingOriginalStart 也会作为一个候选（如果是从有效位置拖过来的）
          // 但这里我们严格执行 "最近空位" 逻辑
          
          if (bestStart !== -1) {
             if (selectedClipType === "video") updateVideoClip(dragClipId, { startTime: bestStart })
             else if (selectedClipType === "audio") updateAudioClip(dragClipId, { startTime: bestStart })
             else if (selectedClipType === "subtitle") updateSubtitleClip(dragClipId, { startTime: bestStart })
          } else {
             // 理论上不会进这里，因为末尾总有空位，但作为防御性编程，回弹
             if (selectedClipType === "video") updateVideoClip(dragClipId, { startTime: dragOriginalStart })
             else if (selectedClipType === "audio") updateAudioClip(dragClipId, { startTime: dragOriginalStart })
             else if (selectedClipType === "subtitle") updateSubtitleClip(dragClipId, { startTime: dragOriginalStart })
          }
        }
        // 如果没有重叠，保持当前位置 (mousemove 已经更新过了)
      }

      setDragClipId(null)
    }
    
    window.addEventListener("mousemove", handleMove, { passive: true })
    window.addEventListener("mouseup", handleUp)
    return () => {
      window.removeEventListener("mousemove", handleMove)
      window.removeEventListener("mouseup", handleUp)
    }
  }, [dragClipId, dragStartX, dragOriginalStart, pps, selectedClipType, updateVideoClip, updateAudioClip, updateSubtitleClip, currentTime])

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, clipId: string, edge: "left" | "right", clipType: "video" | "audio" | "subtitle") => {
      e.stopPropagation()
      const clips = clipType === "video" ? videoClips : clipType === "audio" ? audioClips : subtitleClips
      const clip = clips.find((c) => c.id === clipId)
      if (!clip) return
      setResizingClip({ id: clipId, edge, type: clipType })
      setResizeStartX(e.clientX)
      setResizeOriginal({
        startTime: clip.startTime,
        duration: clip.duration,
        trimStart: "trimStart" in clip ? (clip as TimelineClip).trimStart : 0,
        trimEnd: "trimEnd" in clip ? (clip as TimelineClip).trimEnd : 0,
      })
      selectClip(clipId, clipType)
    },
    [videoClips, audioClips, subtitleClips, selectClip]
  )

  useEffect(() => {
    if (!resizingClip) return
    const handleMove = (e: MouseEvent) => {
      const dx = e.clientX - resizeStartX
      const dt = dx / pps

      if (resizingClip.edge === "right") {
        const newDuration = Math.max(0.5, resizeOriginal.duration + dt)
        if (resizingClip.type === "video") updateVideoClip(resizingClip.id, { duration: newDuration })
        else if (resizingClip.type === "audio") updateAudioClip(resizingClip.id, { duration: newDuration })
        else updateSubtitleClip(resizingClip.id, { duration: newDuration })
      } else {
        const maxShift = resizeOriginal.duration - 0.5
        const shift = Math.max(-resizeOriginal.startTime, Math.min(maxShift, dt))
        const newStart = resizeOriginal.startTime + shift
        const newDuration = resizeOriginal.duration - shift
        if (resizingClip.type === "video") {
          updateVideoClip(resizingClip.id, {
            startTime: newStart,
            duration: newDuration,
            trimStart: resizeOriginal.trimStart + shift,
          })
        } else if (resizingClip.type === "audio") {
          updateAudioClip(resizingClip.id, { startTime: newStart, duration: newDuration })
        } else {
          updateSubtitleClip(resizingClip.id, { startTime: newStart, duration: newDuration })
        }
      }
    }
    const handleUp = () => setResizingClip(null)
    window.addEventListener("mousemove", handleMove, { passive: true })
    window.addEventListener("mouseup", handleUp)
    return () => {
      window.removeEventListener("mousemove", handleMove)
      window.removeEventListener("mouseup", handleUp)
    }
  }, [resizingClip, resizeStartX, resizeOriginal, pps, updateVideoClip, updateAudioClip, updateSubtitleClip])

  const handleSplit = useCallback(() => {
    if (selectedClipId && selectedClipType === "video") {
      splitVideoClip(selectedClipId, currentTime)
    }
  }, [selectedClipId, selectedClipType, currentTime, splitVideoClip])

  const handleDelete = useCallback(() => {
    if (!selectedClipId || !selectedClipType) return
    if (selectedClipType === "video") removeVideoClip(selectedClipId)
    else if (selectedClipType === "audio") removeAudioClip(selectedClipId)
    else removeSubtitleClip(selectedClipId)
  }, [selectedClipId, selectedClipType, removeVideoClip, removeAudioClip, removeSubtitleClip])

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const delta = e.deltaY > 0 ? -0.1 : 0.1
        setZoom(zoom + delta)
      }
    },
    [zoom, setZoom]
  )

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      setScrollLeft(e.currentTarget.scrollLeft)
    },
    [setScrollLeft]
  )

  useEffect(() => {
    if (timelineRef.current && Math.abs(timelineRef.current.scrollLeft - scrollLeft) > 1) {
      timelineRef.current.scrollLeft = scrollLeft
    }
  }, [scrollLeft])

  // 播放头 X 位置：优先使用本地拖拽位置，否则使用 store 时间转换的位置
  const playheadX = localPlayheadX !== null ? localPlayheadX : timeToX(currentTime)

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Toolbar */}
      <div className="shrink-0 flex items-center justify-between px-3 py-1.5 border-b bg-muted/30">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={handleSplit}
            disabled={!selectedClipId || selectedClipType !== "video"}
            title="分割片段 (S)"
          >
            <Scissors className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={handleDelete}
            disabled={!selectedClipId}
            title="删除片段 (Delete)"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => setZoom(Math.max(0.1, zoom - 0.2))}
          >
            <ZoomOut className="size-3.5" />
          </Button>
          <span className="text-[10px] text-muted-foreground w-10 text-center tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => setZoom(Math.min(10, zoom + 0.2))}
          >
            <ZoomIn className="size-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Track headers */}
        <div className="shrink-0 w-28 border-r bg-muted/20">
          <div className="h-6 border-b bg-muted/30" />
          {tracks.map((track) => (
            <div
              key={track.id}
              className="flex items-center gap-0.5 px-1.5 border-b"
              style={{ height: `${track.height}px` }}
            >
              <span className="text-[10px] font-medium truncate flex-1 text-muted-foreground">
                {track.label}
              </span>
              <button className="p-0.5 hover:bg-muted rounded" onClick={() => toggleTrackMute(track.id)}>
                {track.muted ? <VolumeX className="size-3 text-muted-foreground" /> : <Volume2 className="size-3 text-muted-foreground" />}
              </button>
              <button className="p-0.5 hover:bg-muted rounded" onClick={() => toggleTrackLock(track.id)}>
                {track.locked ? <Lock className="size-3 text-muted-foreground" /> : <Unlock className="size-3 text-muted-foreground" />}
              </button>
            </div>
          ))}
        </div>

        {/* Timeline area */}
        <div
          ref={timelineRef}
          className={cn(
            "flex-1 overflow-x-auto overflow-y-hidden relative select-none custom-scrollbar",
            (isDraggingPlayhead || dragClipId || resizingClip) && "cursor-grabbing"
          )}
          onWheel={handleWheel}
          onScroll={handleScroll}
          onClick={handleTimelineClick}
        >
          <div className="relative" style={{ width: `${totalWidth}px` }}>
            {/* Time ruler */}
            <TimeRuler timeMarkers={timeMarkers} timeToX={timeToX} scrollLeft={0} />

            {/* Tracks & Clips */}
            {tracks.map((track) => (
              <div
                key={track.id}
                className="relative border-b bg-muted/5"
                style={{ height: `${track.height}px` }}
              >
                {/* Render clips for this track */}
                {track.type === "video" && videoClips.filter(c => c.trackId === track.id).map(clip => (
                  <TimelineClipItem
                    key={clip.id}
                    clip={clip}
                    type="video"
                    isSelected={selectedClipId === clip.id}
                    left={timeToX(clip.startTime)}
                    width={timeToX(clip.duration)}
                    isDragging={dragClipId === clip.id}
                    onSelect={selectClip}
                    onDragStart={handleClipDragStart}
                    onResizeStart={handleResizeStart}
                  />
                ))}
                {track.type === "audio" && (
                  <>
                    {track.id === "audio-bgm" && bgmTrack && (
                      <TimelineClipItem
                        clip={bgmTrack}
                        type="audio"
                        isSelected={selectedClipId === bgmTrack.id}
                        left={timeToX(bgmTrack.startTime)}
                        width={timeToX(bgmTrack.duration)}
                        isDragging={dragClipId === bgmTrack.id}
                        onSelect={selectClip}
                        onDragStart={handleClipDragStart}
                        onResizeStart={handleResizeStart}
                      />
                    )}
                    {audioClips.filter(c => c.trackId === track.id).map(clip => (
                      <TimelineClipItem
                        key={clip.id}
                        clip={clip}
                        type="audio"
                        isSelected={selectedClipId === clip.id}
                        left={timeToX(clip.startTime)}
                        width={timeToX(clip.duration)}
                        isDragging={dragClipId === clip.id}
                        onSelect={selectClip}
                        onDragStart={handleClipDragStart}
                        onResizeStart={handleResizeStart}
                      />
                    ))}
                  </>
                )}
                {track.type === "subtitle" && subtitleClips.filter(c => c.trackId === track.id).map(clip => (
                  <TimelineClipItem
                    key={clip.id}
                    clip={clip}
                    type="subtitle"
                    isSelected={selectedClipId === clip.id}
                    left={timeToX(clip.startTime)}
                    width={timeToX(clip.duration)}
                    isDragging={dragClipId === clip.id}
                    onSelect={selectClip}
                    onDragStart={handleClipDragStart}
                    onResizeStart={handleResizeStart}
                  />
                ))}
              </div>
            ))}

            {/* Playhead */}
            <div
              className="absolute top-0 bottom-0 w-px bg-red-500 z-30 pointer-events-none"
              style={{ left: `${playheadX}px` }}
            >
              <div
                className="absolute -top-0 left-1/2 -translate-x-1/2 w-3 h-4 bg-red-500 rounded-b-sm cursor-col-resize pointer-events-auto"
                onMouseDown={handlePlayheadMouseDown}
                style={{ clipPath: "polygon(0 0, 100% 0, 100% 60%, 50% 100%, 0 60%)" }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>

  )
}
