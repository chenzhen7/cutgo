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
        onClick={(e) => e.stopPropagation()}
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
        onClick={(e) => e.stopPropagation()}
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
  const [dragClipType, setDragClipType] = useState<"video" | "audio" | "subtitle" | null>(null)
  const [dragStartX, setDragStartX] = useState(0)
  const [dragOriginalStart, setDragOriginalStart] = useState(0)
  // 拖拽中的“预览位置”（仅用于渲染，不立即写入 store）
  const [dragPreviewStart, setDragPreviewStart] = useState<number | null>(null)
  const [resizingClip, setResizingClip] = useState<{ id: string; edge: "left" | "right"; type: "video" | "audio" | "subtitle" } | null>(null)
  const [resizeStartX, setResizeStartX] = useState(0)
  const [resizeOriginal, setResizeOriginal] = useState<{ startTime: number; duration: number; trimStart: number; trimEnd: number; originalDuration: number }>({ startTime: 0, duration: 0, trimStart: 0, trimEnd: 0, originalDuration: 0 })
  // 修剪中的“预览几何信息”（仅用于渲染，不立即写入 store）
  const [resizePreview, setResizePreview] = useState<{ startTime: number; duration: number; trimStart: number; trimEnd: number; originalDuration: number } | null>(null)

  // 播放头 DOM ref，直接操作 transform 避免 React 重渲染
  const playheadRef = useRef<HTMLDivElement>(null)
  const isDraggingPlayheadRef = useRef(false)
  // 用 ref 保存最新值，避免事件回调拿到旧状态
  const dragPreviewStartRef = useRef<number | null>(null)
  // 用 requestAnimationFrame 节流 mousemove，最多每帧计算一次
  const dragRafRef = useRef<number | null>(null)
  const dragLatestClientXRef = useRef<number>(0)
  const resizePreviewRef = useRef<{ startTime: number; duration: number; trimStart: number; trimEnd: number; originalDuration: number } | null>(null)
  const resizeRafRef = useRef<number | null>(null)
  const resizeLatestClientXRef = useRef<number>(0)
  const playheadRafRef = useRef<number | null>(null)
  const playheadLatestClientXRef = useRef<number>(0)
  const lastDragEndTimeRef = useRef<number>(0)

  const tracks = useVideoEditorStore(s => s.tracks)
  const videoClips = useVideoEditorStore(s => s.videoClips)
  const audioClips = useVideoEditorStore(s => s.audioClips)
  const subtitleClips = useVideoEditorStore(s => s.subtitleClips)
  const bgmTrack = useVideoEditorStore(s => s.bgmTrack)
  const selectedClipId = useVideoEditorStore(s => s.selectedClipId)
  const selectedClipType = useVideoEditorStore(s => s.selectedClipType)
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

  // 订阅 currentTime 变化，直接操作 DOM 更新播放头位置，避免 React 重渲染
  useEffect(() => {
    const updatePlayhead = (time: number) => {
      if (!playheadRef.current) return
      playheadRef.current.style.transform = `translateX(${time * pps}px)`
    }

    // 初始化位置
    updatePlayhead(useVideoEditorStore.getState().currentTime)

    let prevTime = useVideoEditorStore.getState().currentTime
    const unsubscribe = useVideoEditorStore.subscribe((state) => {
      const newTime = state.currentTime
      if (newTime === prevTime) return
      prevTime = newTime
      if (isDraggingPlayheadRef.current) return
      updatePlayhead(newTime)
    })

    return unsubscribe
  }, [pps])

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
      // 如果刚刚结束拖拽（100ms内），则不响应点击，避免误触跳转
      if (Date.now() - lastDragEndTimeRef.current < 100) return
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
    isDraggingPlayheadRef.current = true
  }, [])

  useEffect(() => {
    if (!isDraggingPlayhead) {
      isDraggingPlayheadRef.current = false
      return
    }

    const updatePlayheadByClientX = (clientX: number) => {
      const timeline = timelineRef.current
      if (!timeline) return
      const rect = timeline.getBoundingClientRect()
      const x = clientX - rect.left + scrollLeft

      // 直接操作 DOM，零延迟反馈，不触发 React 重渲染
      if (playheadRef.current) {
        playheadRef.current.style.transform = `translateX(${x}px)`
      }

      // 异步更新 store
      const newTime = xToTime(x)
      setCurrentTime(newTime)
    }

    const handleMove = (e: MouseEvent) => {
      playheadLatestClientXRef.current = e.clientX
      if (playheadRafRef.current !== null) return
      playheadRafRef.current = window.requestAnimationFrame(() => {
        playheadRafRef.current = null
        updatePlayheadByClientX(playheadLatestClientXRef.current)
      })
    }

    const handleUp = () => {
      lastDragEndTimeRef.current = Date.now()
      setIsDraggingPlayhead(false)
    }
    window.addEventListener("mousemove", handleMove, { passive: true })
    window.addEventListener("mouseup", handleUp)
    return () => {
      if (playheadRafRef.current !== null) {
        window.cancelAnimationFrame(playheadRafRef.current)
        playheadRafRef.current = null
      }
      window.removeEventListener("mousemove", handleMove)
      window.removeEventListener("mouseup", handleUp)
    }
  }, [isDraggingPlayhead, scrollLeft, xToTime, setCurrentTime])

  // 引用最新的 clips 数据，避免闭包拿到旧数据
  const clipsRef = useRef({ video: videoClips, audio: audioClips, subtitle: subtitleClips })
  const dragSnapContextRef = useRef<{
    duration: number
    trackId: string
    snapPoints: number[]
  } | null>(null)
  const resizeContextRef = useRef<{
    minLeftEdge: number
    maxRightEdge: number
    snapPoints: number[]
  } | null>(null)
  useEffect(() => {
    clipsRef.current = { video: videoClips, audio: audioClips, subtitle: subtitleClips }
  }, [videoClips, audioClips, subtitleClips])

  useEffect(() => {
    dragPreviewStartRef.current = dragPreviewStart
  }, [dragPreviewStart])

  useEffect(() => {
    resizePreviewRef.current = resizePreview
  }, [resizePreview])

  const handleClipDragStart = useCallback(
    (e: React.MouseEvent, clipId: string, clipType: "video" | "audio" | "subtitle") => {
      e.stopPropagation()
      const clips = clipType === "video" ? videoClips : clipType === "audio" ? audioClips : subtitleClips
      const clip = clips.find((c) => c.id === clipId)
      if (!clip) return
      // 开始拖拽时预先计算同轨道吸附点，减少 move 阶段开销
      const sameTrackClips = clips.filter((c) => c.trackId === clip.trackId && c.id !== clip.id)
      const snapPoints = [0, useVideoEditorStore.getState().currentTime]
      sameTrackClips.forEach((c) => {
        snapPoints.push(c.startTime, c.startTime + c.duration)
      })

      setDragClipId(clipId)
      setDragClipType(clipType)
      setDragStartX(e.clientX)
      setDragOriginalStart(clip.startTime)
      setDragPreviewStart(clip.startTime)
      dragSnapContextRef.current = {
        duration: clip.duration,
        trackId: clip.trackId,
        snapPoints,
      }
      selectClip(clipId, clipType)
    },
    [videoClips, audioClips, subtitleClips, selectClip]
  )

  useEffect(() => {
    if (!dragClipId || !dragClipType) return

    // 每次鼠标移动只做位置计算，不写 store
    const runDragCalc = (clientX: number) => {
      const dx = clientX - dragStartX
      const dt = dx / pps
      let newStart = Math.max(0, dragOriginalStart + dt)
      const dragCtx = dragSnapContextRef.current
      if (!dragCtx) return

      // --- 磁吸效果 (Snapping) ---
      const SNAP_THRESHOLD_PX = 15
      const snapThreshold = SNAP_THRESHOLD_PX / pps

      // 寻找最近的吸附点
      let minDiff = Infinity
      let snapTarget = newStart

      // 检查头部吸附
      for (const point of dragCtx.snapPoints) {
        const diff = Math.abs(newStart - point)
        if (diff < snapThreshold && diff < minDiff) {
          minDiff = diff
          snapTarget = point
        }
      }

      // 检查尾部吸附 (可选，如果需要尾部对齐)
      const newEnd = newStart + dragCtx.duration
      for (const point of dragCtx.snapPoints) {
        const diff = Math.abs(newEnd - point)
        if (diff < snapThreshold && diff < minDiff) {
          minDiff = diff
          snapTarget = point - dragCtx.duration
        }
      }

      // 应用吸附
      if (minDiff < Infinity) {
        newStart = snapTarget
      }

      // 只更新本地预览位置，保证拖拽流畅
      setDragPreviewStart(newStart)
    }

    const handleMove = (e: MouseEvent) => {
      dragLatestClientXRef.current = e.clientX
      if (dragRafRef.current !== null) return
      dragRafRef.current = window.requestAnimationFrame(() => {
        dragRafRef.current = null
        runDragCalc(dragLatestClientXRef.current)
      })
    }

    const handleUp = () => {
      // 只有松手时才真正提交到 store，减少频繁全局更新
      // --- 松手后的处理：重叠检测与自动寻找最近空位 ---
      const currentClips = dragClipType === "video" ? clipsRef.current.video
        : dragClipType === "audio" ? clipsRef.current.audio
          : clipsRef.current.subtitle

      const draggingClip = currentClips.find(c => c.id === dragClipId)
      const droppedStart = dragPreviewStartRef.current ?? dragOriginalStart

      if (draggingClip) {
        const myStart = droppedStart
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
          // AABB 碰撞检测（加一点容差，避免浮点误差）
          return !(end <= myStart + 0.001 || start >= myEnd - 0.001)
        })

        if (isOverlapping) {
          // 3. 如果重叠，寻找最近的有效空位
          let bestStart = -1
          let minDistance = Infinity

          const checkCandidate = (t: number) => {
            // 选离当前落点最近的可放置位置
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
          // 有可用空位就放过去，否则回到原位
          const finalStart = bestStart !== -1 ? bestStart : dragOriginalStart
          if (dragClipType === "video") updateVideoClip(dragClipId, { startTime: finalStart })
          else if (dragClipType === "audio") updateAudioClip(dragClipId, { startTime: finalStart })
          else if (dragClipType === "subtitle") updateSubtitleClip(dragClipId, { startTime: finalStart })
        } else {
          // 没重叠则直接提交预览位置
          if (dragClipType === "video") updateVideoClip(dragClipId, { startTime: myStart })
          else if (dragClipType === "audio") updateAudioClip(dragClipId, { startTime: myStart })
          else if (dragClipType === "subtitle") updateSubtitleClip(dragClipId, { startTime: myStart })
        }
      }

      if (dragRafRef.current !== null) {
        window.cancelAnimationFrame(dragRafRef.current)
        dragRafRef.current = null
      }
      dragSnapContextRef.current = null
      setDragClipType(null)
      setDragPreviewStart(null)
      setDragClipId(null)
      lastDragEndTimeRef.current = Date.now()
    }

    window.addEventListener("mousemove", handleMove, { passive: true })
    window.addEventListener("mouseup", handleUp)
    return () => {
      if (dragRafRef.current !== null) {
        window.cancelAnimationFrame(dragRafRef.current)
        dragRafRef.current = null
      }
      window.removeEventListener("mousemove", handleMove)
      window.removeEventListener("mouseup", handleUp)
    }
  }, [dragClipId, dragClipType, dragStartX, dragOriginalStart, pps, updateVideoClip, updateAudioClip, updateSubtitleClip])

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, clipId: string, edge: "left" | "right", clipType: "video" | "audio" | "subtitle") => {
      e.stopPropagation()
      const clips = clipType === "video" ? videoClips : clipType === "audio" ? audioClips : subtitleClips
      const clip = clips.find((c) => c.id === clipId)
      if (!clip) return
      // 开始修剪时一次性准备好边界和吸附点，避免 move 时重复全量扫描
      const sameTrackClips = clips
        .filter((c) => c.trackId === clip.trackId && c.id !== clip.id)
        .sort((a, b) => a.startTime - b.startTime)
      const prevClip = [...sameTrackClips].reverse().find((c) => c.startTime < clip.startTime)
      const nextClip = sameTrackClips.find((c) => c.startTime >= clip.startTime)
      const snapPoints = [0, useVideoEditorStore.getState().currentTime]
      sameTrackClips.forEach((c) => {
        snapPoints.push(c.startTime, c.startTime + c.duration)
      })

      setResizingClip({ id: clipId, edge, type: clipType })
      setResizeStartX(e.clientX)

      const trimStart = "trimStart" in clip ? (clip as TimelineClip).trimStart : 0
      const trimEnd = "trimEnd" in clip ? (clip as TimelineClip).trimEnd : 0
      const originalDuration = clip.duration + trimStart + trimEnd

      setResizeOriginal({
        startTime: clip.startTime,
        duration: clip.duration,
        trimStart,
        trimEnd,
        originalDuration,
      })
      setResizePreview({
        startTime: clip.startTime,
        duration: clip.duration,
        trimStart,
        trimEnd,
        originalDuration,
      })
      resizeContextRef.current = {
        minLeftEdge: Math.max(0, prevClip ? prevClip.startTime + prevClip.duration : 0),
        maxRightEdge: nextClip ? nextClip.startTime : Number.POSITIVE_INFINITY,
        snapPoints,
      }
      selectClip(clipId, clipType)
    },
    [videoClips, audioClips, subtitleClips, selectClip]
  )

  useEffect(() => {
    if (!resizingClip) return
    const runResizeCalc = (clientX: number) => {
      const dx = clientX - resizeStartX
      const dt = dx / pps
      const resizeCtx = resizeContextRef.current
      if (!resizeCtx) return

      // 修剪手柄磁吸：吸附到时间线起点、播放头、其他片段头尾
      const SNAP_THRESHOLD_PX = 10
      const snapThreshold = SNAP_THRESHOLD_PX / pps

      const snapEdge = (edgeTime: number) => {
        let best = edgeTime
        let minDiff = Infinity
        for (const point of resizeCtx.snapPoints) {
          const diff = Math.abs(edgeTime - point)
          if (diff < snapThreshold && diff < minDiff) {
            minDiff = diff
            best = point
          }
        }
        return best
      }

      if (resizingClip.edge === "right") {
        // 右手柄：右边界不能穿过后一个片段起点，也不能超过素材原始长度
        const clipStart = resizeOriginal.startTime
        let rightEdge = resizeOriginal.startTime + resizeOriginal.duration + dt
        rightEdge = snapEdge(rightEdge)

        // 限制：不能超过后一个片段
        rightEdge = Math.min(resizeCtx.maxRightEdge, rightEdge)
        // 限制：不能短于 0.5s
        rightEdge = Math.max(clipStart + 0.5, rightEdge)

        let newDuration = rightEdge - clipStart
        let newTrimEnd = resizeOriginal.trimEnd - (newDuration - resizeOriginal.duration)

        // 限制：trimEnd 不能小于 0 (即 duration 不能超过原始长度减去 trimStart)
        if (newTrimEnd < 0) {
          newTrimEnd = 0
          newDuration = resizeOriginal.originalDuration - resizeOriginal.trimStart
        }

        setResizePreview({
          startTime: resizeOriginal.startTime,
          duration: newDuration,
          trimStart: resizeOriginal.trimStart,
          trimEnd: newTrimEnd,
          originalDuration: resizeOriginal.originalDuration,
        })
      } else {
        // 左手柄：左边界不能穿过前一个片段结束点，也不能超过素材原始长度
        const originalEnd = resizeOriginal.startTime + resizeOriginal.duration
        const maxLeftEdge = originalEnd - 0.5

        let newStart = resizeOriginal.startTime + dt
        newStart = snapEdge(newStart)

        // 限制：不能超过前一个片段，不能让长度小于 0.5s
        newStart = Math.max(resizeCtx.minLeftEdge, Math.min(maxLeftEdge, newStart))

        let newDuration = originalEnd - newStart
        const shift = newStart - resizeOriginal.startTime
        let newTrimStart = resizeOriginal.trimStart + shift

        // 限制：trimStart 不能小于 0
        if (newTrimStart < 0) {
          newTrimStart = 0
          newDuration = resizeOriginal.originalDuration - resizeOriginal.trimEnd
          newStart = originalEnd - newDuration
        }

        setResizePreview({
          startTime: newStart,
          duration: newDuration,
          trimStart: newTrimStart,
          trimEnd: resizeOriginal.trimEnd,
          originalDuration: resizeOriginal.originalDuration,
        })
      }
    }

    const handleMove = (e: MouseEvent) => {
      resizeLatestClientXRef.current = e.clientX
      if (resizeRafRef.current !== null) return
      resizeRafRef.current = window.requestAnimationFrame(() => {
        resizeRafRef.current = null
        runResizeCalc(resizeLatestClientXRef.current)
      })
    }

    const handleUp = () => {
      const finalResize = resizePreviewRef.current ?? resizeOriginal
      if (resizingClip.type === "video") {
        updateVideoClip(resizingClip.id, {
          startTime: finalResize.startTime,
          duration: finalResize.duration,
          trimStart: finalResize.trimStart,
          trimEnd: finalResize.trimEnd,
        })
      } else if (resizingClip.type === "audio") {
        updateAudioClip(resizingClip.id, {
          startTime: finalResize.startTime,
          duration: finalResize.duration,
        })
      } else {
        updateSubtitleClip(resizingClip.id, {
          startTime: finalResize.startTime,
          duration: finalResize.duration,
        })
      }

      if (resizeRafRef.current !== null) {
        window.cancelAnimationFrame(resizeRafRef.current)
        resizeRafRef.current = null
      }
      resizeContextRef.current = null
      setResizePreview(null)
      setResizingClip(null)
      lastDragEndTimeRef.current = Date.now()
    }

    window.addEventListener("mousemove", handleMove, { passive: true })
    window.addEventListener("mouseup", handleUp)
    return () => {
      if (resizeRafRef.current !== null) {
        window.cancelAnimationFrame(resizeRafRef.current)
        resizeRafRef.current = null
      }
      window.removeEventListener("mousemove", handleMove)
      window.removeEventListener("mouseup", handleUp)
    }
  }, [resizingClip, resizeStartX, resizeOriginal, pps, updateVideoClip, updateAudioClip, updateSubtitleClip])

  const handleSplit = useCallback(() => {
    if (selectedClipId && selectedClipType === "video") {
      splitVideoClip(selectedClipId, useVideoEditorStore.getState().currentTime)
    }
  }, [selectedClipId, selectedClipType, splitVideoClip])

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

  const getRenderStartTime = useCallback(
    (clipId: string, clipStartTime: number) => {
      if (resizingClip?.id === clipId && resizePreview !== null) return resizePreview.startTime
      if (dragClipId === clipId && dragPreviewStart !== null) return dragPreviewStart
      return clipStartTime
    },
    [resizingClip, resizePreview, dragClipId, dragPreviewStart]
  )
  const getRenderDuration = useCallback(
    (clipId: string, clipDuration: number) => {
      if (resizingClip?.id === clipId && resizePreview !== null) return resizePreview.duration
      return clipDuration
    },
    [resizingClip, resizePreview]
  )

  const isInteracting = isDraggingPlayhead || dragClipId !== null || resizingClip !== null

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
            (isDraggingPlayhead || dragClipId) && "cursor-grabbing",
            resizingClip && "cursor-col-resize"
          )}
          onWheel={handleWheel}
          onScroll={handleScroll}
          onClick={handleTimelineClick}
        >
          <div
            className={cn("relative", isInteracting && "pointer-events-none")}
            style={{ width: `${totalWidth}px` }}
          >
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
                    left={timeToX(getRenderStartTime(clip.id, clip.startTime))}
                    width={timeToX(getRenderDuration(clip.id, clip.duration))}
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
                        left={timeToX(getRenderStartTime(bgmTrack.id, bgmTrack.startTime))}
                        width={timeToX(getRenderDuration(bgmTrack.id, bgmTrack.duration))}
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
                        left={timeToX(getRenderStartTime(clip.id, clip.startTime))}
                        width={timeToX(getRenderDuration(clip.id, clip.duration))}
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
                    left={timeToX(getRenderStartTime(clip.id, clip.startTime))}
                    width={timeToX(getRenderDuration(clip.id, clip.duration))}
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
              ref={playheadRef}
              className="absolute top-0 bottom-0 w-px bg-red-500 z-30 pointer-events-none"
              style={{ willChange: "transform" }}
            >
              <div
                className={cn(
                  "absolute -top-0 left-1/2 -translate-x-1/2 w-3 h-4 bg-red-500 rounded-b-sm cursor-col-resize",
                  !isInteracting && "pointer-events-auto"
                )}
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
