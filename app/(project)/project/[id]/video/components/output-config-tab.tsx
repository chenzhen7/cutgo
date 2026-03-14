"use client"

import { useVideoStore } from "@/store/video-store"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

const RESOLUTION_OPTIONS = [
  { value: "1080x1920", label: "1080×1920 (9:16 竖屏)" },
  { value: "720x1280", label: "720×1280 (9:16 竖屏)" },
  { value: "540x960", label: "540×960 (9:16 竖屏)" },
]

const FPS_OPTIONS = [
  { value: "24", label: "24fps" },
  { value: "30", label: "30fps（推荐）" },
  { value: "60", label: "60fps" },
]

const VIDEO_BITRATE_OPTIONS = [
  { value: "4M", label: "4Mbps（较小文件）" },
  { value: "8M", label: "8Mbps（推荐）" },
  { value: "12M", label: "12Mbps（高质量）" },
  { value: "16M", label: "16Mbps（超高质量）" },
]

const AUDIO_BITRATE_OPTIONS = [
  { value: "128k", label: "128kbps" },
  { value: "192k", label: "192kbps（推荐）" },
  { value: "320k", label: "320kbps（高质量）" },
]

export function OutputConfigTab() {
  const { draftConfig, updateDraftConfigOutput } = useVideoStore()
  const output = draftConfig.output

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">分辨率</Label>
        <Select
          value={output.resolution}
          onValueChange={(v) => updateDraftConfigOutput({ resolution: v as typeof output.resolution })}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RESOLUTION_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">帧率</Label>
        <Select
          value={String(output.fps)}
          onValueChange={(v) => updateDraftConfigOutput({ fps: Number(v) as typeof output.fps })}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FPS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">视频码率</Label>
        <Select
          value={output.videoBitrate}
          onValueChange={(v) => updateDraftConfigOutput({ videoBitrate: v })}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VIDEO_BITRATE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">音频码率</Label>
        <Select
          value={output.audioBitrate}
          onValueChange={(v) => updateDraftConfigOutput({ audioBitrate: v })}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AUDIO_BITRATE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">输出格式</Label>
        <Input value="MP4 (H.264)" disabled className="h-9 text-sm" />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">输出目录</Label>
        <Input
          value={output.outputDir}
          onChange={(e) => updateDraftConfigOutput({ outputDir: e.target.value })}
          className="h-9 text-sm"
          placeholder="./output"
        />
      </div>

      <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">输出规格预览</p>
        <p className="mt-1">分辨率：{output.resolution} · {output.fps}fps</p>
        <p>视频码率：{output.videoBitrate} · 音频码率：{output.audioBitrate}</p>
        <p>格式：MP4 (H.264/AAC)</p>
        <p className="mt-1 text-amber-600 dark:text-amber-400">
          预估每分钟视频约 {
            output.videoBitrate === "4M" ? "30" :
            output.videoBitrate === "8M" ? "60" :
            output.videoBitrate === "12M" ? "90" : "120"
          }MB
        </p>
      </div>
    </div>
  )
}
