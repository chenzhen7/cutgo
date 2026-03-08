"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Pencil, Save, X, FolderOpen, Users, Box, MapPin } from "lucide-react"
import type { Script } from "@/lib/types"
import { ScriptAssetDialog } from "./script-asset-dialog"

function parseJsonArray(val: string | null | undefined): string[] {
  if (!val) return []
  try {
    const parsed = JSON.parse(val)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

interface ScriptEditorProps {
  script: Script
  projectId: string
  onUpdateScript: (data: {
    content?: string
    characters?: string
    props?: string
    location?: string
  }) => void
}

export function ScriptEditor({
  script,
  projectId,
  onUpdateScript,
}: ScriptEditorProps) {
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState("")
  const [showAssetDialog, setShowAssetDialog] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const charNames = parseJsonArray(script.characters)
  const propNames = parseJsonArray(script.props)

  const startEditing = useCallback(() => {
    setEditContent(script.content)
    setEditing(true)
    setTimeout(() => textareaRef.current?.focus(), 50)
  }, [script.content])

  const saveContent = useCallback(() => {
    onUpdateScript({ content: editContent })
    setEditing(false)
  }, [editContent, onUpdateScript])

  const cancelEditing = useCallback(() => {
    setEditing(false)
  }, [])

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-primary bg-primary/10 rounded px-2 py-0.5">
              第{script.episode.index}集
            </span>
            <h3 className="text-sm font-semibold">{script.title}</h3>
            <span className="text-xs text-muted-foreground">
              {script.content.length} 字
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAssetDialog(true)}
            >
              <FolderOpen className="size-3.5" />
              关联资产
            </Button>
            {!editing && (
              <Button variant="outline" size="sm" onClick={startEditing}>
                <Pencil className="size-3.5" />
                编辑
              </Button>
            )}
            {editing && (
              <>
                <Button variant="ghost" size="sm" onClick={cancelEditing}>
                  <X className="size-3.5" />
                  取消
                </Button>
                <Button size="sm" onClick={saveContent}>
                  <Save className="size-3.5" />
                  保存
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Asset tags */}
        {(charNames.length > 0 || propNames.length > 0 || script.location) && (
          <div className="flex items-center gap-1.5 flex-wrap px-4 py-2 border-b bg-muted/20">
            {charNames.map((name) => (
              <Badge key={name} variant="default" className="gap-1 text-[10px] px-1.5 py-0">
                <Users className="size-2.5" />
                {name}
              </Badge>
            ))}
            {script.location && (
              <Badge variant="secondary" className="gap-1 text-[10px] px-1.5 py-0">
                <MapPin className="size-2.5" />
                {script.location}
              </Badge>
            )}
            {propNames.map((name) => (
              <Badge key={name} variant="outline" className="gap-1 text-[10px] px-1.5 py-0">
                <Box className="size-2.5" />
                {name}
              </Badge>
            ))}
          </div>
        )}

        {/* Content */}
        {editing ? (
          <Textarea
            ref={textareaRef}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="flex-1 min-h-0 rounded-none border-0 resize-none p-4 text-sm leading-relaxed font-mono focus-visible:ring-0"
            placeholder="输入剧本内容..."
          />
        ) : (
          <ScrollArea className="flex-1 min-h-0">
            {script.content ? (
              <div className="p-4 text-sm leading-relaxed whitespace-pre-wrap font-mono">
                {script.content}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <h3 className="text-base font-medium mb-2">暂无剧本内容</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  点击编辑按钮手动编写，或使用 AI 生成
                </p>
                <Button onClick={startEditing}>
                  <Pencil className="size-4" />
                  开始编写
                </Button>
              </div>
            )}
          </ScrollArea>
        )}
      </div>

      <ScriptAssetDialog
        open={showAssetDialog}
        onOpenChange={setShowAssetDialog}
        script={script}
        projectId={projectId}
        onSave={(data) => {
          onUpdateScript({
            characters: data.characters,
            location: data.location,
            props: data.props,
          })
        }}
      />
    </>
  )
}
