"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Pencil, Trash2, GripVertical, MessageSquare, Mic, Clapperboard, ArrowRightLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ScriptLineData, ScriptLineInput } from "@/lib/types"

const LINE_TYPE_CONFIG = {
  dialogue: {
    label: "对白",
    icon: MessageSquare,
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  },
  narration: {
    label: "旁白",
    icon: Mic,
    bg: "bg-gray-50 dark:bg-gray-900/30",
    border: "border-gray-200 dark:border-gray-800",
    badge: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  },
  action: {
    label: "动作",
    icon: Clapperboard,
    bg: "bg-sky-50 dark:bg-sky-950/30",
    border: "border-sky-200 dark:border-sky-800",
    badge: "bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300",
  },
  transition: {
    label: "转场",
    icon: ArrowRightLeft,
    bg: "bg-purple-50 dark:bg-purple-950/30",
    border: "border-purple-200 dark:border-purple-800",
    badge: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  },
} as const

interface ScriptLineItemProps {
  line: ScriptLineData
  onUpdate: (data: Partial<ScriptLineInput>) => void
  onDelete: () => void
}

export function ScriptLineItem({ line, onUpdate, onDelete }: ScriptLineItemProps) {
  const [editing, setEditing] = useState(false)
  const [editType, setEditType] = useState(line.type)
  const [editContent, setEditContent] = useState(line.content)
  const [editCharacter, setEditCharacter] = useState(line.character || "")
  const [editEmotion, setEditEmotion] = useState(line.emotion || "")
  const [editDuration, setEditDuration] = useState(line.duration || "")
  const [editParenthetical, setEditParenthetical] = useState(line.parenthetical || "")
  const contentRef = useRef<HTMLTextAreaElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const config = LINE_TYPE_CONFIG[line.type]
  const Icon = config.icon

  useEffect(() => {
    if (editing && contentRef.current) {
      contentRef.current.focus()
    }
  }, [editing])

  const saveEdit = useCallback(() => {
    if (!editContent.trim()) return
    const data: Partial<ScriptLineInput> = {}
    if (editType !== line.type) data.type = editType
    if (editContent !== line.content) data.content = editContent
    if (editCharacter !== (line.character || "")) data.character = editCharacter || undefined
    if (editEmotion !== (line.emotion || "")) data.emotion = editEmotion || undefined
    if (editDuration !== (line.duration || "")) data.duration = editDuration || undefined
    if (editParenthetical !== (line.parenthetical || "")) data.parenthetical = editParenthetical || undefined
    if (Object.keys(data).length > 0) onUpdate(data)
    setEditing(false)
  }, [editType, editContent, editCharacter, editEmotion, editDuration, editParenthetical, line, onUpdate])

  const cancelEdit = useCallback(() => {
    setEditType(line.type)
    setEditContent(line.content)
    setEditCharacter(line.character || "")
    setEditEmotion(line.emotion || "")
    setEditDuration(line.duration || "")
    setEditParenthetical(line.parenthetical || "")
    setEditing(false)
  }, [line])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      saveEdit()
    }
    if (e.key === "Escape") {
      cancelEdit()
    }
  }

  if (editing) {
    return (
      <div className={cn("rounded-md border p-3 space-y-2", config.border, config.bg)}>
        <div className="flex items-center gap-2">
          <Select value={editType} onValueChange={(v) => setEditType(v as ScriptLineData["type"])}>
            <SelectTrigger className="w-24 h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dialogue">对白</SelectItem>
              <SelectItem value="narration">旁白</SelectItem>
              <SelectItem value="action">动作</SelectItem>
              <SelectItem value="transition">转场</SelectItem>
            </SelectContent>
          </Select>

          {editType === "dialogue" && (
            <>
              <Input
                value={editCharacter}
                onChange={(e) => setEditCharacter(e.target.value)}
                placeholder="角色名"
                className="w-24 h-7 text-xs"
              />
              <Input
                value={editEmotion}
                onChange={(e) => setEditEmotion(e.target.value)}
                placeholder="情绪"
                className="w-20 h-7 text-xs"
              />
              <Input
                value={editParenthetical}
                onChange={(e) => setEditParenthetical(e.target.value)}
                placeholder="括号注释"
                className="w-24 h-7 text-xs"
              />
            </>
          )}

          <Input
            value={editDuration}
            onChange={(e) => setEditDuration(e.target.value)}
            placeholder="时长"
            className="w-16 h-7 text-xs"
          />
        </div>

        <Textarea
          ref={contentRef}
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          onKeyDown={handleKeyDown}
          className="min-h-[60px] text-sm"
          placeholder="输入内容..."
        />

        <div className="flex items-center gap-2 justify-end">
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={cancelEdit}>
            取消
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={saveEdit}>
            保存
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "group/line flex items-start gap-2 rounded-md border px-3 py-2 transition-colors cursor-pointer",
        config.border,
        config.bg,
        "hover:shadow-sm"
      )}
      onClick={() => setEditing(true)}
    >
      <div className="flex items-center gap-1 shrink-0 mt-0.5 opacity-0 group-hover/line:opacity-100 transition-opacity">
        <GripVertical className="size-3.5 text-muted-foreground cursor-grab" />
      </div>

      <Badge className={cn("shrink-0 text-[10px] px-1.5 py-0 mt-0.5 border-0", config.badge)}>
        <Icon className="size-2.5 mr-0.5" />
        {config.label}
      </Badge>

      <div className="flex-1 min-w-0">
        {line.type === "dialogue" && (
          <span className="text-xs font-semibold text-foreground">
            {line.character}
            {line.parenthetical && (
              <span className="font-normal text-muted-foreground">（{line.parenthetical}）</span>
            )}
            ：
          </span>
        )}
        <span
          className={cn(
            "text-sm",
            line.type === "narration" && "italic text-muted-foreground",
            line.type === "transition" && "font-semibold text-center block"
          )}
        >
          {line.content}
        </span>
        {line.type === "dialogue" && line.emotion && (
          <Badge variant="outline" className="ml-2 text-[10px] px-1 py-0">
            {line.emotion}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {line.duration && (
          <span className="text-[10px] text-muted-foreground">{line.duration}</span>
        )}
        <div className="flex items-center gap-0.5 opacity-0 group-hover/line:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon-sm"
            className="size-5"
            onClick={(e) => {
              e.stopPropagation()
              setEditing(true)
            }}
          >
            <Pencil className="size-2.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="size-5"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
          >
            <Trash2 className="size-2.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
