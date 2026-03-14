"use client"

import { Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface VideoPlayerControlsProps {
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  playbackRate: number
  onPlayPause: () => void
  onSeek: (time: number) => void
  onVolumeChange: (volume: number) => void
  onPlaybackRateChange: (rate: number) => void
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
}

const PLAYBACK_RATES = [
  { value: "0.5", label: "0.5x" },
  { value: "1", label: "1x" },
  { value: "1.5", label: "1.5x" },
  { value: "2", label: "2x" },
]

export function VideoPlayerControls({
  isPlaying,
  currentTime,
  duration,
  volume,
  playbackRate,
  onPlayPause,
  onSeek,
  onVolumeChange,
  onPlaybackRateChange,
}: VideoPlayerControlsProps) {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="space-y-2 bg-zinc-900 px-4 py-3">
      <Slider
        value={[progress]}
        onValueChange={([v]) => onSeek((v / 100) * duration)}
        min={0}
        max={100}
        step={0.1}
        className="[&_[role=slider]]:h-3 [&_[role=slider]]:w-3"
      />
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-300 hover:text-white"
            onClick={onPlayPause}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <span className="text-xs text-zinc-400 tabular-nums">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={String(playbackRate)}
            onValueChange={(v) => onPlaybackRateChange(Number(v))}
          >
            <SelectTrigger className="h-7 w-16 border-zinc-700 bg-zinc-800 text-xs text-zinc-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PLAYBACK_RATES.map((r) => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-zinc-400 hover:text-white"
              onClick={() => onVolumeChange(volume === 0 ? 80 : 0)}
            >
              {volume === 0 ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            </Button>
            <Slider
              value={[volume]}
              onValueChange={([v]) => onVolumeChange(v)}
              min={0}
              max={100}
              step={5}
              className="w-20 [&_[role=slider]]:h-3 [&_[role=slider]]:w-3"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
