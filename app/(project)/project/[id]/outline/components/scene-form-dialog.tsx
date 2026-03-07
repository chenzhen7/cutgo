"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import type { EpisodeScene, SceneInput } from "@/lib/types"

const EMOTION_TAGS = [
  "平静", "紧张", "悲伤", "激昂", "温馨",
  "愤怒", "震惊", "心动", "悬疑", "冲击", "感慨", "压抑",
]

interface SceneFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  scene?: EpisodeScene | null
  onSave: (data: SceneInput) => void
}

export function SceneFormDialog({
  open,
  onOpenChange,
  scene,
  onSave,
}: SceneFormDialogProps) {
  const parseCharacters = (chars: string | null): string[] => {
    if (!chars) return []
    try { return JSON.parse(chars) } catch { return [] }
  }

  const [title, setTitle] = useState(scene?.title || "")
  const [summary, setSummary] = useState(scene?.summary || "")
  const [duration, setDuration] = useState(scene?.duration || "15s")
  const [characters, setCharacters] = useState(
    parseCharacters(scene?.characters || null).join(", ")
  )
  const [emotion, setEmotion] = useState(scene?.emotion || "")

  const handleSave = () => {
    const charArray = characters
      .split(/[,，]/)
      .map((s) => s.trim())
      .filter(Boolean)
    onSave({
      title,
      summary,
      duration,
      characters: JSON.stringify(charArray),
      emotion: emotion || undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{scene ? "编辑场景" : "添加场景"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">场景标题</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="如：机场回归" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">场景摘要</label>
            <Textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              className="resize-none"
              placeholder="描述场景内容..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">时长</label>
              <Input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="15s" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">出场角色</label>
              <Input
                value={characters}
                onChange={(e) => setCharacters(e.target.value)}
                placeholder="角色A, 角色B"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">情感标签</label>
            <div className="flex flex-wrap gap-1.5">
              {EMOTION_TAGS.map((tag) => (
                <Badge
                  key={tag}
                  variant={emotion === tag ? "default" : "outline"}
                  className="cursor-pointer select-none text-xs"
                  onClick={() => setEmotion(emotion === tag ? "" : tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={!title.trim()}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
