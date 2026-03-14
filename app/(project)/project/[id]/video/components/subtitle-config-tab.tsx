"use client"

import { useVideoStore } from "@/store/video-store"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"

const FONT_FAMILIES = ["思源黑体", "思源宋体", "微软雅黑", "黑体", "宋体", "楷体"]
const FONT_SIZES = [24, 28, 32, 36, 40, 44, 48]

const DIALOGUE_POSITIONS = [
  { value: "bottom_center", label: "底部居中" },
  { value: "bottom_left", label: "底部左对齐" },
  { value: "bottom_right", label: "底部右对齐" },
  { value: "top_center", label: "顶部居中" },
]

const NARRATION_POSITIONS = [
  { value: "top_center", label: "顶部居中" },
  { value: "bottom_center", label: "底部居中" },
  { value: "middle_center", label: "画面居中" },
]

export function SubtitleConfigTab() {
  const { draftConfig, updateDraftConfigSubtitle } = useVideoStore()
  const sub = draftConfig.subtitle

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">字幕开关</Label>
        <Switch
          checked={sub.enabled}
          onCheckedChange={(v) => updateDraftConfigSubtitle({ enabled: v })}
        />
      </div>

      {sub.enabled && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">对白字幕位置</Label>
              <Select
                value={sub.dialoguePosition}
                onValueChange={(v) => updateDraftConfigSubtitle({ dialoguePosition: v as typeof sub.dialoguePosition })}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIALOGUE_POSITIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">旁白字幕位置</Label>
              <Select
                value={sub.narrationPosition}
                onValueChange={(v) => updateDraftConfigSubtitle({ narrationPosition: v as typeof sub.narrationPosition })}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NARRATION_POSITIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">字体</Label>
              <Select
                value={sub.fontFamily}
                onValueChange={(v) => updateDraftConfigSubtitle({ fontFamily: v })}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_FAMILIES.map((f) => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">字号</Label>
              <Select
                value={String(sub.fontSize)}
                onValueChange={(v) => updateDraftConfigSubtitle({ fontSize: Number(v) })}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_SIZES.map((s) => (
                    <SelectItem key={s} value={String(s)}>{s}px</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">字色</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={sub.fontColor}
                  onChange={(e) => updateDraftConfigSubtitle({ fontColor: e.target.value })}
                  className="h-8 w-8 cursor-pointer rounded border border-input"
                />
                <Input
                  value={sub.fontColor}
                  onChange={(e) => updateDraftConfigSubtitle({ fontColor: e.target.value })}
                  className="h-8 flex-1 text-xs"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">描边颜色</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={sub.strokeColor}
                  onChange={(e) => updateDraftConfigSubtitle({ strokeColor: e.target.value })}
                  className="h-8 w-8 cursor-pointer rounded border border-input"
                />
                <Input
                  value={sub.strokeColor}
                  onChange={(e) => updateDraftConfigSubtitle({ strokeColor: e.target.value })}
                  className="h-8 flex-1 text-xs"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">背景透明度</Label>
              <span className="text-xs text-muted-foreground">{sub.backgroundOpacity}%</span>
            </div>
            <Slider
              value={[sub.backgroundOpacity]}
              onValueChange={([v]) => updateDraftConfigSubtitle({ backgroundOpacity: v })}
              min={0}
              max={100}
              step={5}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">描边宽度</Label>
              <span className="text-xs text-muted-foreground">{sub.strokeWidth}px</span>
            </div>
            <Slider
              value={[sub.strokeWidth]}
              onValueChange={([v]) => updateDraftConfigSubtitle({ strokeWidth: v })}
              min={0}
              max={6}
              step={1}
            />
          </div>

          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">字幕预览</p>
            <div className="flex aspect-[9/5] items-end justify-center rounded bg-zinc-800 p-3">
              <div
                className="rounded px-3 py-1 text-center"
                style={{
                  fontFamily: sub.fontFamily,
                  fontSize: `${Math.max(sub.fontSize * 0.4, 12)}px`,
                  color: sub.fontColor,
                  backgroundColor: `rgba(0,0,0,${sub.backgroundOpacity / 100})`,
                  borderRadius: `${sub.borderRadius}px`,
                  WebkitTextStroke: `${sub.strokeWidth * 0.4}px ${sub.strokeColor}`,
                }}
              >
                这里显示字幕样式预览
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
