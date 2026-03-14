"use client"

import { useMemo } from "react"
import type { Storyboard } from "@/lib/types"

interface VideoTimelineProps {
  storyboards: Storyboard[]
  episodeTitle: string
}

function parseDuration(d: string): number {
  const match = d.match(/(\d+(?:\.\d+)?)/)
  return match ? parseFloat(match[1]) : 3
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  if (m === 0) return `${s}s`
  return `${m}m${s}s`
}

export function VideoTimeline({ storyboards, episodeTitle }: VideoTimelineProps) {
  const shots = useMemo(() => {
    return storyboards.flatMap((sb) => sb.shots).sort((a, b) => a.index - b.index)
  }, [storyboards])

  const totalDuration = useMemo(() => {
    return shots.reduce((sum, s) => sum + parseDuration(s.duration), 0)
  }, [shots])

  if (shots.length === 0) {
    return (
      <div className="flex h-24 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        暂无镜头数据
      </div>
    )
  }

  const TRACK_HEIGHT = 36
  const RULER_HEIGHT = 24
  const LABEL_WIDTH = 56

  const timeMarkers = useMemo(() => {
    const markers: number[] = []
    const step = totalDuration > 120 ? 30 : totalDuration > 60 ? 15 : totalDuration > 30 ? 10 : 5
    for (let t = 0; t <= totalDuration; t += step) {
      markers.push(t)
    }
    return markers
  }, [totalDuration])

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <span className="text-sm font-medium">{episodeTitle}</span>
        <span className="text-xs text-muted-foreground">总时长 {formatTime(totalDuration)}</span>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          <div className="flex" style={{ height: RULER_HEIGHT }}>
            <div style={{ width: LABEL_WIDTH }} className="shrink-0 border-r bg-muted/30" />
            <div className="relative flex-1 bg-muted/20">
              {timeMarkers.map((t) => (
                <div
                  key={t}
                  className="absolute top-0 flex h-full flex-col items-center"
                  style={{ left: `${(t / totalDuration) * 100}%` }}
                >
                  <div className="h-2 w-px bg-border" />
                  <span className="text-[10px] text-muted-foreground">{formatTime(t)}</span>
                </div>
              ))}
            </div>
          </div>

          <TrackRow label="画面" height={TRACK_HEIGHT} labelWidth={LABEL_WIDTH}>
            {shots.map((shot) => {
              const dur = parseDuration(shot.duration)
              const widthPct = (dur / totalDuration) * 100
              return (
                <div
                  key={shot.id}
                  className="absolute inset-y-1 flex items-center justify-center overflow-hidden rounded border border-primary/30 bg-primary/10 px-1 text-[10px] text-primary"
                  style={{ width: `${widthPct}%` }}
                  title={`镜头 #${shot.index + 1} · ${shot.shotSize} · ${shot.duration}`}
                >
                  <span className="truncate">{shot.shotSize}</span>
                </div>
              )
            })}
          </TrackRow>

          <TrackRow label="字幕" height={TRACK_HEIGHT} labelWidth={LABEL_WIDTH}>
            {shots.filter((s) => s.dialogueText).map((shot) => {
              const dur = parseDuration(shot.duration)
              const widthPct = (dur / totalDuration) * 100
              return (
                <div
                  key={shot.id}
                  className="absolute inset-y-1 flex items-center overflow-hidden rounded border border-amber-300/40 bg-amber-50/60 px-1 text-[10px] text-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
                  style={{ width: `${widthPct}%` }}
                  title={shot.dialogueText ?? ""}
                >
                  <span className="truncate">{shot.dialogueText}</span>
                </div>
              )
            })}
          </TrackRow>

          <TrackRow label="配音" height={TRACK_HEIGHT} labelWidth={LABEL_WIDTH}>
            {shots.filter((s) => s.dialogueText).map((shot) => {
              const dur = parseDuration(shot.duration)
              const widthPct = (dur / totalDuration) * 100
              return (
                <div
                  key={shot.id}
                  className="absolute inset-y-1 flex items-center overflow-hidden rounded border border-purple-300/40 bg-purple-50/60 px-1 text-[10px] text-purple-800 dark:bg-purple-900/20 dark:text-purple-300"
                  style={{ width: `${widthPct}%` }}
                >
                  <span className="truncate">♪ TTS</span>
                </div>
              )
            })}
          </TrackRow>

          <TrackRow label="BGM" height={TRACK_HEIGHT} labelWidth={LABEL_WIDTH}>
            <div
              className="absolute inset-y-1 flex items-center overflow-hidden rounded border border-green-300/40 bg-green-50/60 px-2 text-[10px] text-green-800 dark:bg-green-900/20 dark:text-green-300"
              style={{ width: "100%" }}
            >
              <span>♫ BGM</span>
            </div>
          </TrackRow>
        </div>
      </div>
    </div>
  )
}

function TrackRow({
  label,
  height,
  labelWidth,
  children,
}: {
  label: string
  height: number
  labelWidth: number
  children: React.ReactNode
}) {
  return (
    <div className="flex border-t" style={{ height }}>
      <div
        className="flex shrink-0 items-center justify-end border-r bg-muted/30 pr-2 text-xs text-muted-foreground"
        style={{ width: labelWidth }}
      >
        {label}
      </div>
      <div className="relative flex-1">{children}</div>
    </div>
  )
}
