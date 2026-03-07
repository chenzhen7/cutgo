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
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { ScriptLineInput } from "@/lib/types"

interface ScriptLineFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: ScriptLineInput) => void
  insertAfter?: string
}

export function ScriptLineFormDialog({
  open,
  onOpenChange,
  onSave,
  insertAfter,
}: ScriptLineFormDialogProps) {
  const [type, setType] = useState<ScriptLineInput["type"]>("dialogue")
  const [character, setCharacter] = useState("")
  const [emotion, setEmotion] = useState("")
  const [content, setContent] = useState("")
  const [duration, setDuration] = useState("")
  const [parenthetical, setParenthetical] = useState("")

  const handleSave = () => {
    if (!content.trim()) return
    onSave({
      type,
      character: type === "dialogue" ? character : undefined,
      emotion: type === "dialogue" ? emotion : undefined,
      content: content.trim(),
      duration: duration || undefined,
      parenthetical: type === "dialogue" ? parenthetical : undefined,
      insertAfter,
    })
    setType("dialogue")
    setCharacter("")
    setEmotion("")
    setContent("")
    setDuration("")
    setParenthetical("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>添加剧本行</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-xs">类型</Label>
            <Select value={type} onValueChange={(v) => setType(v as ScriptLineInput["type"])}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dialogue">对白</SelectItem>
                <SelectItem value="narration">旁白</SelectItem>
                <SelectItem value="action">动作</SelectItem>
                <SelectItem value="transition">转场</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === "dialogue" && (
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">角色</Label>
                <Input
                  value={character}
                  onChange={(e) => setCharacter(e.target.value)}
                  placeholder="角色名"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">情绪</Label>
                <Input
                  value={emotion}
                  onChange={(e) => setEmotion(e.target.value)}
                  placeholder="如：愤怒"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">括号注释</Label>
                <Input
                  value={parenthetical}
                  onChange={(e) => setParenthetical(e.target.value)}
                  placeholder="如：低声"
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <div>
            <Label className="text-xs">内容</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="输入内容..."
              className="mt-1 min-h-[80px]"
            />
          </div>

          <div>
            <Label className="text-xs">预估时长</Label>
            <Input
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="如：3s"
              className="mt-1 w-24"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={!content.trim()}>
            添加
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
