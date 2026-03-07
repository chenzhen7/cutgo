"use client"

import { useState, useEffect } from "react"
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
import { Label } from "@/components/ui/label"
import {
  Heading,
  AlignLeft,
  Clock,
  Heart,
  Music,
  MapPin,
} from "lucide-react"
import type { ScriptSceneData, ScriptSceneInput } from "@/lib/types"

interface ScriptSceneFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  scene?: ScriptSceneData
  onSave: (data: ScriptSceneInput) => void
}

export function ScriptSceneFormDialog({
  open,
  onOpenChange,
  scene,
  onSave,
}: ScriptSceneFormDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [duration, setDuration] = useState("15s")
  const [emotion, setEmotion] = useState("")
  const [bgm, setBgm] = useState("")
  const [location, setLocation] = useState("")

  useEffect(() => {
    if (scene) {
      setTitle(scene.title)
      setDescription(scene.description || "")
      setDuration(scene.duration)
      setEmotion(scene.emotion || "")
      setBgm(scene.bgm || "")
      setLocation(scene.location || "")
    } else {
      setTitle("")
      setDescription("")
      setDuration("15s")
      setEmotion("")
      setBgm("")
      setLocation("")
    }
  }, [scene, open])

  const handleSave = () => {
    if (!title.trim()) return
    onSave({
      title: title.trim(),
      description: description || undefined,
      duration: duration || "15s",
      emotion: emotion || undefined,
      bgm: bgm || undefined,
      location: location || undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{scene ? "编辑场景" : "添加场景"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-xs flex items-center gap-1.5">
              <Heading className="size-3.5 text-muted-foreground" />
              场景标题 *
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="如：机场回归"
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs flex items-center gap-1.5">
              <AlignLeft className="size-3.5 text-muted-foreground" />
              场景描述
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="场景整体描述..."
              className="mt-1 min-h-[60px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs flex items-center gap-1.5">
                <Clock className="size-3.5 text-muted-foreground" />
                预估时长
              </Label>
              <Input
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="15s"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs flex items-center gap-1.5">
                <Heart className="size-3.5 text-muted-foreground" />
                情绪基调
              </Label>
              <Input
                value={emotion}
                onChange={(e) => setEmotion(e.target.value)}
                placeholder="如：紧张"
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs flex items-center gap-1.5">
                <Music className="size-3.5 text-muted-foreground" />
                BGM 建议
              </Label>
              <Input
                value={bgm}
                onChange={(e) => setBgm(e.target.value)}
                placeholder="如：紧张弦乐"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs flex items-center gap-1.5">
                <MapPin className="size-3.5 text-muted-foreground" />
                场景地点
              </Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="如：机场大厅"
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={!title.trim()}>
            {scene ? "保存" : "添加"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
