"use client"

import { useState, useRef } from "react"
import { useVideoEditorStore, type AudioClip } from "@/store/video-editor-store"
import { BGM_LIBRARY } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Music,
  Play,
  Pause,
  Upload,
  Trash2,
  Volume2,
  Repeat,
  Check,
} from "lucide-react"
import { cn } from "@/lib/utils"

export function BgmPanel() {
  const { bgmTrack, setBgm, updateBgm, duration } = useVideoEditorStore()
  const [previewingId, setPreviewingId] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState(BGM_LIBRARY[0]?.category || "")
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null)

  const handleSelectBgm = (item: { id: string; name: string; duration: string; url: string }) => {
    const durationSeconds = parseBgmDuration(item.duration)
    const newBgm: AudioClip = {
      id: `bgm_${item.id}`,
      trackId: "audio-bgm",
      startTime: 0,
      duration: Math.max(duration, durationSeconds),
      trimStart: 0,
      trimEnd: 0,
      audioUrl: item.url || "/testVideo.mp4",
      label: item.name,
      volume: 40,
      fadeIn: 2,
      fadeOut: 3,
      loop: true,
    }
    setBgm(newBgm)
  }

  const handlePreview = (id: string, url: string) => {
    if (previewingId === id) {
      audioPreviewRef.current?.pause()
      setPreviewingId(null)
      return
    }
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause()
    }
    const audio = new Audio(url || "/testVideo.mp4")
    audio.volume = 0.5
    audio.play().catch(() => {})
    audio.onended = () => setPreviewingId(null)
    audioPreviewRef.current = audio
    setPreviewingId(id)
  }

  const handleUploadBgm = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "audio/*"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const url = URL.createObjectURL(file)
      const newBgm: AudioClip = {
        id: `bgm_custom_${Date.now()}`,
        trackId: "audio-bgm",
        startTime: 0,
        duration: duration || 30,
        trimStart: 0,
        trimEnd: 0,
        audioUrl: url,
        label: file.name.replace(/\.[^.]+$/, ""),
        volume: 40,
        fadeIn: 2,
        fadeOut: 3,
        loop: true,
      }
      setBgm(newBgm)
    }
    input.click()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Music className="size-4 text-primary" />
          <span className="text-sm font-medium">背景音乐</span>
        </div>
      </div>

      {/* Current BGM */}
      {bgmTrack && (
        <div className="shrink-0 mx-4 mt-3 p-3 rounded-lg border bg-primary/5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded bg-primary/10 flex items-center justify-center">
                <Music className="size-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{bgmTrack.label}</p>
                <p className="text-xs text-muted-foreground">当前BGM</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-destructive hover:text-destructive"
              onClick={() => setBgm(null)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-xs text-muted-foreground">音量</Label>
                <span className="text-xs text-muted-foreground tabular-nums">{bgmTrack.volume}%</span>
              </div>
              <Slider
                value={[bgmTrack.volume]}
                min={0}
                max={100}
                step={1}
                onValueChange={([v]) => updateBgm({ volume: v })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">淡入 (秒)</Label>
                <Input
                  type="number"
                  min={0}
                  max={10}
                  step={0.5}
                  value={bgmTrack.fadeIn}
                  onChange={(e) => updateBgm({ fadeIn: parseFloat(e.target.value) || 0 })}
                  className="h-7 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">淡出 (秒)</Label>
                <Input
                  type="number"
                  min={0}
                  max={10}
                  step={0.5}
                  value={bgmTrack.fadeOut}
                  onChange={(e) => updateBgm({ fadeOut: parseFloat(e.target.value) || 0 })}
                  className="h-7 text-xs mt-1"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">循环播放</Label>
              <Switch
                checked={bgmTrack.loop}
                onCheckedChange={(checked) => updateBgm({ loop: checked })}
              />
            </div>
          </div>
        </div>
      )}

      {/* BGM Library */}
      <div className="flex-1 min-h-0 flex flex-col mt-3">
        <div className="shrink-0 px-4 flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            音乐库
          </span>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleUploadBgm}>
            <Upload className="size-3 mr-1" />
            上传
          </Button>
        </div>

        {/* Category tabs */}
        <div className="shrink-0 px-4 mb-2">
          <div className="flex gap-1 flex-wrap">
            {BGM_LIBRARY.map((cat) => (
              <button
                key={cat.category}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs transition-colors",
                  activeCategory === cat.category
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
                onClick={() => setActiveCategory(cat.category)}
              >
                {cat.category}
              </button>
            ))}
          </div>
        </div>

        {/* BGM list */}
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-1 pb-4">
            {BGM_LIBRARY.find((c) => c.category === activeCategory)?.items.map((item) => {
              const isSelected = bgmTrack?.id === `bgm_${item.id}`
              const isPreviewing = previewingId === item.id

              return (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-transparent hover:bg-muted/50"
                  )}
                  onClick={() => handleSelectBgm(item)}
                >
                  <button
                    className={cn(
                      "size-8 rounded-full flex items-center justify-center shrink-0 transition-colors",
                      isPreviewing ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePreview(item.id, item.url)
                    }}
                  >
                    {isPreviewing ? (
                      <Pause className="size-3.5" />
                    ) : (
                      <Play className="size-3.5 ml-0.5" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.duration}</p>
                  </div>
                  {isSelected && (
                    <Check className="size-4 text-primary shrink-0" />
                  )}
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

function parseBgmDuration(dur: string): number {
  const parts = dur.split(":")
  if (parts.length === 2) {
    return parseInt(parts[0]) * 60 + parseInt(parts[1])
  }
  return 120
}
