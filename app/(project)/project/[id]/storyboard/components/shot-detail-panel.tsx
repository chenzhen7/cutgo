"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Loader2,
  ImageIcon,
} from "lucide-react"
import type { Shot, Storyboard, ShotInput } from "@/lib/types"
import {
  SHOT_SIZE_OPTIONS,
  CAMERA_MOVEMENT_OPTIONS,
  CAMERA_ANGLE_OPTIONS,
} from "@/lib/types"

interface ShotDetailPanelProps {
  shot: Shot
  storyboard: Storyboard
  onUpdate: (storyboardId: string, shotId: string, data: Partial<ShotInput>) => void
  onOptimizePrompt: (storyboardId: string, shotId: string) => Promise<{ optimizedPrompt: string; negativePrompt: string }>
  onPrev: (() => void) | null
  onNext: (() => void) | null
  onClose: () => void
}

export function ShotDetailPanel({
  shot,
  storyboard,
  onUpdate,
  onOptimizePrompt,
  onPrev,
  onNext,
  onClose,
}: ShotDetailPanelProps) {
  const [composition, setComposition] = useState(shot.composition)
  const [prompt, setPrompt] = useState(shot.prompt)
  const [negativePrompt, setNegativePrompt] = useState(shot.negativePrompt || "")
  const [dialogueText, setDialogueText] = useState(shot.dialogueText || "")
  const [actionNote, setActionNote] = useState(shot.actionNote || "")
  const [duration, setDuration] = useState(shot.duration.replace("s", ""))
  const [optimizing, setOptimizing] = useState(false)

  useEffect(() => {
    setComposition(shot.composition)
    setPrompt(shot.prompt)
    setNegativePrompt(shot.negativePrompt || "")
    setDialogueText(shot.dialogueText || "")
    setActionNote(shot.actionNote || "")
    setDuration(shot.duration.replace("s", ""))
  }, [shot.id, shot.composition, shot.prompt, shot.negativePrompt, shot.dialogueText, shot.actionNote, shot.duration])

  const debouncedUpdate = useCallback(
    (data: Partial<ShotInput>) => {
      const timer = setTimeout(() => {
        onUpdate(storyboard.id, shot.id, data)
      }, 500)
      return () => clearTimeout(timer)
    },
    [onUpdate, storyboard.id, shot.id]
  )

  const handleSelectChange = (field: string, value: string) => {
    onUpdate(storyboard.id, shot.id, { [field]: value })
  }

  const handleOptimize = async () => {
    setOptimizing(true)
    try {
      const result = await onOptimizePrompt(storyboard.id, shot.id)
      setPrompt(result.optimizedPrompt)
      setNegativePrompt(result.negativePrompt)
      onUpdate(storyboard.id, shot.id, {
        prompt: result.optimizedPrompt,
        negativePrompt: result.negativePrompt,
      })
    } finally {
      setOptimizing(false)
    }
  }

  const script = storyboard.script

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">镜头详情</span>
          <span className="text-xs text-muted-foreground font-mono">#{shot.index + 1}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            disabled={!onPrev}
            onClick={onPrev || undefined}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            disabled={!onNext}
            onClick={onNext || undefined}
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* Image preview */}
        <div className="rounded-lg bg-muted h-44 flex items-center justify-center overflow-hidden">
          {shot.imageUrl ? (
            <img src={shot.imageUrl} alt="" className="size-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-1">
              <ImageIcon className="size-8 text-muted-foreground/30" />
              <span className="text-xs text-muted-foreground/50">画面预览</span>
            </div>
          )}
        </div>

        {/* Selects row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">景别</Label>
            <Select value={shot.shotSize} onValueChange={(v) => handleSelectChange("shotSize", v)}>
              <SelectTrigger className="h-8 text-xs mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SHOT_SIZE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value} className="text-xs">
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">镜头运动</Label>
            <Select value={shot.cameraMovement} onValueChange={(v) => handleSelectChange("cameraMovement", v)}>
              <SelectTrigger className="h-8 text-xs mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CAMERA_MOVEMENT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value} className="text-xs">
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">镜头角度</Label>
            <Select value={shot.cameraAngle} onValueChange={(v) => handleSelectChange("cameraAngle", v)}>
              <SelectTrigger className="h-8 text-xs mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CAMERA_ANGLE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value} className="text-xs">
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">时长</Label>
            <div className="flex items-center gap-1 mt-1">
              <Input
                type="number"
                min={1}
                max={15}
                step={0.5}
                value={duration}
                onChange={(e) => {
                  setDuration(e.target.value)
                  debouncedUpdate({ duration: `${e.target.value}s` })
                }}
                className="h-8 text-xs w-full"
              />
              <span className="text-xs text-muted-foreground">s</span>
            </div>
          </div>
        </div>

        {/* Composition */}
        <div>
          <Label className="text-xs">画面构图（中文）</Label>
          <Textarea
            value={composition}
            onChange={(e) => {
              setComposition(e.target.value)
              debouncedUpdate({ composition: e.target.value })
            }}
            className="mt-1 text-xs min-h-[60px] resize-none"
            placeholder="描述画面中的元素布局..."
          />
        </div>

        {/* Prompt */}
        <div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">画面 Prompt（英文）</Label>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={handleOptimize}
              disabled={optimizing}
            >
              {optimizing ? (
                <Loader2 className="size-3 mr-1 animate-spin" />
              ) : (
                <Sparkles className="size-3 mr-1" />
              )}
              AI 优化
            </Button>
          </div>
          <Textarea
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value)
              debouncedUpdate({ prompt: e.target.value })
            }}
            className="mt-1 text-xs min-h-[80px] resize-none"
            placeholder="English prompt for AI image generation..."
          />
        </div>

        {/* Negative prompt */}
        <div>
          <Label className="text-xs">负面提示词</Label>
          <Textarea
            value={negativePrompt}
            onChange={(e) => {
              setNegativePrompt(e.target.value)
              debouncedUpdate({ negativePrompt: e.target.value })
            }}
            className="mt-1 text-xs min-h-[40px] resize-none"
            placeholder="blurry, low quality, distorted..."
          />
        </div>

        {/* Related script */}
        {script && (
          <div>
            <Label className="text-xs">关联剧本</Label>
            <div className="mt-1 text-xs rounded bg-muted/50 px-2 py-1.5 text-muted-foreground">
              {script.title} · 第{script.episode.index}集
            </div>
          </div>
        )}

        {/* Dialogue text */}
        <div>
          <Label className="text-xs">台词/字幕文本</Label>
          <Textarea
            value={dialogueText}
            onChange={(e) => {
              setDialogueText(e.target.value)
              debouncedUpdate({ dialogueText: e.target.value })
            }}
            className="mt-1 text-xs min-h-[40px] resize-none"
            placeholder="该镜头期间的台词或旁白文本..."
          />
        </div>

        {/* Action note */}
        <div>
          <Label className="text-xs">动作备注</Label>
          <Textarea
            value={actionNote}
            onChange={(e) => {
              setActionNote(e.target.value)
              debouncedUpdate({ actionNote: e.target.value })
            }}
            className="mt-1 text-xs min-h-[40px] resize-none"
            placeholder="该镜头的动作备注..."
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 border-t shrink-0">
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          disabled={!onPrev}
          onClick={onPrev || undefined}
        >
          <ChevronLeft className="size-3 mr-1" />
          上一镜头
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          disabled={!onNext}
          onClick={onNext || undefined}
        >
          下一镜头
          <ChevronRight className="size-3 ml-1" />
        </Button>
      </div>
    </div>
  )
}
