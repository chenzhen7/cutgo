"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Pencil, Check, X } from "lucide-react"

interface TabSynopsisProps {
  synopsis: string | null
  onUpdate: (synopsis: string) => Promise<void>
}

export function TabSynopsis({ synopsis, onUpdate }: TabSynopsisProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(synopsis || "")
  const [modified, setModified] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setDraft(synopsis || "")
  }, [synopsis])

  const handleSave = useCallback(async () => {
    await onUpdate(draft)
    setEditing(false)
    setModified(true)
  }, [draft, onUpdate])

  if (!synopsis && !editing) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
        暂无故事大纲
      </div>
    )
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <h4 className="font-medium">故事大纲</h4>
            {modified && (
              <Badge variant="secondary" className="text-xs">
                已修改
              </Badge>
            )}
          </div>
          {!editing ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditing(true)
                setTimeout(() => textareaRef.current?.focus(), 0)
              }}
            >
              <Pencil className="size-3.5" />
              编辑
            </Button>
          ) : (
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={handleSave}>
                <Check className="size-3.5" />
                保存
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDraft(synopsis || "")
                  setEditing(false)
                }}
              >
                <X className="size-3.5" />
                取消
              </Button>
            </div>
          )}
        </div>
        {editing ? (
          <Textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={8}
            className="resize-none text-sm leading-relaxed"
          />
        ) : (
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {synopsis}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
