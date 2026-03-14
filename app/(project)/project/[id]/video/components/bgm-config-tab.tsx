"use client"

import { useState } from "react"
import { useVideoStore } from "@/store/video-store"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Music, Plus, X, Play } from "lucide-react"
import { BGM_LIBRARY } from "@/lib/types"
import { toast } from "sonner"

const FADE_OPTIONS = [
  { value: "0", label: "无" },
  { value: "1", label: "1s" },
  { value: "2", label: "2s" },
  { value: "3", label: "3s" },
  { value: "5", label: "5s" },
]

export function BgmConfigTab() {
  const { draftConfig, updateDraftConfigBgm } = useVideoStore()
  const bgm = draftConfig.bgm
  const [selectedCategory, setSelectedCategory] = useState(BGM_LIBRARY[0].category)

  const currentCategory = BGM_LIBRARY.find((c) => c.category === selectedCategory)

  const selectBgm = (item: { id: string; name: string; duration: string; url: string }) => {
    updateDraftConfigBgm({
      track: {
        fileUrl: item.url || `/bgm/${item.id}.mp3`,
        startTime: 0,
        endTime: 0,
        volume: 60,
        loop: true,
      },
    })
    toast.success(`已选择 BGM：${item.name}`)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">BGM 开关</Label>
        <Switch
          checked={bgm.enabled}
          onCheckedChange={(v) => updateDraftConfigBgm({ enabled: v })}
        />
      </div>

      {bgm.enabled && (
        <>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">主音量</Label>
              <span className="text-xs text-muted-foreground">{bgm.masterVolume}%</span>
            </div>
            <Slider
              value={[bgm.masterVolume]}
              onValueChange={([v]) => updateDraftConfigBgm({ masterVolume: v })}
              min={0}
              max={100}
              step={5}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">淡入时长</Label>
              <Select
                value={String(bgm.fadeInDuration)}
                onValueChange={(v) => updateDraftConfigBgm({ fadeInDuration: Number(v) })}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FADE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">淡出时长</Label>
              <Select
                value={String(bgm.fadeOutDuration)}
                onValueChange={(v) => updateDraftConfigBgm({ fadeOutDuration: Number(v) })}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FADE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {bgm.track && (
            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Music className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">
                    {bgm.track.fileUrl.split("/").pop() || "已选 BGM"}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => updateDraftConfigBgm({ track: null })}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">轨道音量</Label>
                  <span className="text-xs text-muted-foreground">{bgm.track.volume}%</span>
                </div>
                <Slider
                  value={[bgm.track.volume]}
                  onValueChange={([v]) =>
                    updateDraftConfigBgm({ track: bgm.track ? { ...bgm.track, volume: v } : null })
                  }
                  min={0}
                  max={100}
                  step={5}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">内置 BGM 曲库</Label>
            <div className="flex flex-wrap gap-1.5">
              {BGM_LIBRARY.map((cat) => (
                <button
                  key={cat.category}
                  onClick={() => setSelectedCategory(cat.category)}
                  className={`rounded-full px-3 py-1 text-xs transition-colors ${
                    selectedCategory === cat.category
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {cat.category}
                </button>
              ))}
            </div>
            <div className="space-y-1.5">
              {currentCategory?.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2"
                >
                  <Music className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 text-sm">{item.name}</span>
                  <span className="text-xs text-muted-foreground">{item.duration}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => toast.info("试听功能需接入真实音频文件")}
                  >
                    <Play className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => selectBgm(item)}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    选用
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
