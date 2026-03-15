"use client"

import { useVideoEditorStore, type TimelineClip, type AudioClip, type SubtitleClip, TRANSITION_OPTIONS } from "@/store/video-editor-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Film,
  Music,
  Type,
  Trash2,
  Copy,
  Scissors,
  Clock,
  Volume2,
  Gauge,
  Sparkles,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

export function ClipPropertiesPanel() {
  const {
    selectedClipId,
    selectedClipType,
    videoClips,
    audioClips,
    subtitleClips,
    currentTime,
    updateVideoClip,
    updateAudioClip,
    updateSubtitleClip,
    removeVideoClip,
    removeAudioClip,
    removeSubtitleClip,
    splitVideoClip,
    selectClip,
  } = useVideoEditorStore()

  if (!selectedClipId || !selectedClipType) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-3">
          <Film className="size-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">选择一个片段</p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          点击时间轴上的片段查看和编辑属性
        </p>
      </div>
    )
  }

  const videoClip = selectedClipType === "video" ? videoClips.find((c) => c.id === selectedClipId) : null
  const audioClip = selectedClipType === "audio" ? audioClips.find((c) => c.id === selectedClipId) : null
  const subtitleClip = selectedClipType === "subtitle" ? subtitleClips.find((c) => c.id === selectedClipId) : null

  const clip = videoClip || audioClip || subtitleClip
  if (!clip) return null

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    const ms = Math.floor((s % 1) * 100)
    return `${m}:${sec.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`
  }

  const handleDelete = () => {
    if (selectedClipType === "video") removeVideoClip(selectedClipId)
    else if (selectedClipType === "audio") removeAudioClip(selectedClipId)
    else removeSubtitleClip(selectedClipId)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          {selectedClipType === "video" && <Film className="size-4 text-blue-500" />}
          {selectedClipType === "audio" && <Music className="size-4 text-green-500" />}
          {selectedClipType === "subtitle" && <Type className="size-4 text-amber-500" />}
          <span className="text-sm font-medium">
            {selectedClipType === "video" && "视频片段"}
            {selectedClipType === "audio" && "音频片段"}
            {selectedClipType === "subtitle" && "字幕片段"}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={() => selectClip(null, null)}
        >
          <X className="size-4" />
        </Button>
      </div>

      {/* Properties */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
        {/* Time info */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="size-3.5" />
            时间信息
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">开始时间</Label>
              <p className="text-sm font-mono tabular-nums mt-0.5">{formatTime(clip.startTime)}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">时长</Label>
              <p className="text-sm font-mono tabular-nums mt-0.5">{formatTime(clip.duration)}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">结束时间</Label>
              <p className="text-sm font-mono tabular-nums mt-0.5">{formatTime(clip.startTime + clip.duration)}</p>
            </div>
          </div>
        </div>

        {/* Video clip properties */}
        {videoClip && (
          <>
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Volume2 className="size-3.5" />
                音量
              </h4>
              <div className="flex items-center gap-3">
                <Slider
                  value={[videoClip.volume]}
                  min={0}
                  max={200}
                  step={1}
                  onValueChange={([v]) => updateVideoClip(videoClip.id, { volume: v })}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground w-10 text-right tabular-nums">
                  {videoClip.volume}%
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Gauge className="size-3.5" />
                播放速度
              </h4>
              <div className="flex items-center gap-3">
                <Slider
                  value={[videoClip.speed]}
                  min={0.25}
                  max={4}
                  step={0.25}
                  onValueChange={([v]) => updateVideoClip(videoClip.id, { speed: v })}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground w-10 text-right tabular-nums">
                  {videoClip.speed}x
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="size-3.5" />
                转场效果
              </h4>
              <Select
                value={videoClip.transition}
                onValueChange={(v) => updateVideoClip(videoClip.id, { transition: v as TimelineClip["transition"] })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRANSITION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {videoClip.transition !== "none" && (
                <div className="flex items-center gap-3">
                  <Label className="text-xs text-muted-foreground shrink-0">转场时长</Label>
                  <Slider
                    value={[videoClip.transitionDuration]}
                    min={0.1}
                    max={2}
                    step={0.1}
                    onValueChange={([v]) => updateVideoClip(videoClip.id, { transitionDuration: v })}
                    className="flex-1"
                  />
                  <span className="text-xs text-muted-foreground w-8 text-right tabular-nums">
                    {videoClip.transitionDuration}s
                  </span>
                </div>
              )}
            </div>
          </>
        )}

        {/* Audio clip properties */}
        {audioClip && (
          <>
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Volume2 className="size-3.5" />
                音量
              </h4>
              <div className="flex items-center gap-3">
                <Slider
                  value={[audioClip.volume]}
                  min={0}
                  max={200}
                  step={1}
                  onValueChange={([v]) => updateAudioClip(audioClip.id, { volume: v })}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground w-10 text-right tabular-nums">
                  {audioClip.volume}%
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">淡入淡出</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">淡入 (秒)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={10}
                    step={0.5}
                    value={audioClip.fadeIn}
                    onChange={(e) => updateAudioClip(audioClip.id, { fadeIn: parseFloat(e.target.value) || 0 })}
                    className="h-8 text-xs mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">淡出 (秒)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={10}
                    step={0.5}
                    value={audioClip.fadeOut}
                    onChange={(e) => updateAudioClip(audioClip.id, { fadeOut: parseFloat(e.target.value) || 0 })}
                    className="h-8 text-xs mt-1"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Subtitle clip properties */}
        {subtitleClip && (
          <>
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">字幕内容</h4>
              <Textarea
                value={subtitleClip.text}
                onChange={(e) => updateSubtitleClip(subtitleClip.id, { text: e.target.value })}
                className="text-sm min-h-[80px] resize-none"
                placeholder="输入字幕文本..."
              />
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">字幕样式</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">字号</Label>
                  <Input
                    type="number"
                    min={12}
                    max={72}
                    value={subtitleClip.style.fontSize}
                    onChange={(e) =>
                      updateSubtitleClip(subtitleClip.id, {
                        style: { ...subtitleClip.style, fontSize: parseInt(e.target.value) || 36 },
                      })
                    }
                    className="h-8 text-xs mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">位置</Label>
                  <Select
                    value={subtitleClip.style.position}
                    onValueChange={(v) =>
                      updateSubtitleClip(subtitleClip.id, {
                        style: { ...subtitleClip.style, position: v as "top" | "center" | "bottom" },
                      })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top">顶部</SelectItem>
                      <SelectItem value="center">居中</SelectItem>
                      <SelectItem value="bottom">底部</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">字体颜色</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={subtitleClip.style.fontColor}
                      onChange={(e) =>
                        updateSubtitleClip(subtitleClip.id, {
                          style: { ...subtitleClip.style, fontColor: e.target.value },
                        })
                      }
                      className="size-8 rounded border cursor-pointer"
                    />
                    <span className="text-xs text-muted-foreground">{subtitleClip.style.fontColor}</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="shrink-0 border-t p-3 flex items-center gap-2">
        {selectedClipType === "video" && (
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs h-8"
            onClick={() => splitVideoClip(selectedClipId, currentTime)}
          >
            <Scissors className="size-3.5 mr-1.5" />
            分割
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-xs h-8 text-destructive hover:text-destructive"
          onClick={handleDelete}
        >
          <Trash2 className="size-3.5 mr-1.5" />
          删除
        </Button>
      </div>
    </div>
  )
}
