"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Check, X, FolderOpen } from "lucide-react"
import type {
  AssetCharacter,
  AssetProp,
  AssetScene,
  Script,
} from "@/lib/types"
import { countWords } from "@/lib/novel-utils"
import { ScriptAssetDialog } from "./script-asset-dialog"
import { ScriptAssetStrip } from "./script-asset-strip"

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
  assetCharacters: AssetCharacter[]
  assetScenes: AssetScene[]
  assetProps: AssetProp[]
  onUpdateScript: (data: {
    content?: string
    characters?: string
    props?: string
    location?: string
  }) => Promise<void>
}

export function ScriptEditor({
  script,
  projectId,
  assetCharacters,
  assetScenes,
  assetProps,
  onUpdateScript,
}: ScriptEditorProps) {
  const [content, setContent] = useState(script.content ?? "")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showAssetDialog, setShowAssetDialog] = useState(false)

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const gutterRef = useRef<HTMLDivElement>(null)
  const isDirty = content !== (script.content ?? "")

  const charNames = parseJsonArray(script.characters)
  const propNames = parseJsonArray(script.props)

  useEffect(() => {
    setContent(script.content ?? "")
    setSaved(false)
  }, [script.id, script.content])

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  const triggerAutoSave = useCallback(
    (newContent: string) => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
        saveTimerRef.current = null
      }
      const server = script.content ?? ""
      if (newContent === server) return
      saveTimerRef.current = setTimeout(async () => {
        setSaving(true)
        try {
          await onUpdateScript({ content: newContent.trim() || undefined })
          setSaved(true)
          setTimeout(() => setSaved(false), 2000)
        } finally {
          setSaving(false)
        }
      }, 800)
    },
    [script.content, onUpdateScript]
  )

  const handleContentChange = (v: string) => {
    setContent(v)
    triggerAutoSave(v)
  }

  const handleSaveNow = async () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = null
    setSaving(true)
    try {
      await onUpdateScript({ content: content.trim() || undefined })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const handleDiscard = () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    setContent(script.content ?? "")
    setSaved(false)
  }

  const wordCount = countWords(content)
  const lineCount = content ? content.split("\n").length : 0
  const lineNumbers = content.split("\n").map((_, i) => i + 1)

  const syncGutterScroll = () => {
    const ta = textareaRef.current
    const g = gutterRef.current
    if (ta && g) g.scrollTop = ta.scrollTop
  }

  return (
    <>
      <div className="flex flex-col h-full">
        {/* 顶栏：与小说导入章节编辑区一致的信息与保存状态 */}
        <div className="flex items-center gap-2 px-4 py-3 border-b shrink-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-xs font-bold text-primary bg-primary/10 rounded px-2 py-0.5 shrink-0">
              第{script.episode.index}集
            </span>
            <h3 className="text-sm font-semibold truncate">{script.title}</h3>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {saving && (
              <span className="text-xs text-muted-foreground">保存中...</span>
            )}
            {saved && !saving && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Check className="size-3" />
                已保存
              </span>
            )}
            {isDirty && !saving && !saved && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={handleSaveNow}
                >
                  <Check className="size-3 mr-1" />
                  保存
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground"
                  onClick={handleDiscard}
                >
                  <X className="size-3 mr-1" />
                  放弃
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-7"
              onClick={() => setShowAssetDialog(true)}
            >
              <FolderOpen className="size-3.5" />
              关联资产
            </Button>
          </div>
        </div>

        {(charNames.length > 0 ||
          propNames.length > 0 ||
          !!(script.location?.trim())) && (
          <div className="flex items-center gap-2 flex-wrap px-4 py-2.5 border-b bg-muted/20 shrink-0">
            <ScriptAssetStrip
              script={script}
              assetCharacters={assetCharacters}
              assetScenes={assetScenes}
              assetProps={assetProps}
              mode="editor"
            />
          </div>
        )}

        <div className="flex-1 flex min-h-0 overflow-hidden bg-background">
          <div
            ref={gutterRef}
            className="pointer-events-none shrink-0 w-11 select-none overflow-y-auto overflow-x-hidden border-r border-border/60 bg-muted/25 py-3 pl-2 pr-1.5 text-right font-mono text-sm leading-relaxed text-muted-foreground/80 tabular-nums [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-hidden
          >
            {lineNumbers.map((n) => (
              <div key={n} className="min-h-[1.625em] leading-relaxed">
                {n}
              </div>
            ))}
          </div>
          <div className="flex-1 relative min-w-0 min-h-0">
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              onScroll={syncGutterScroll}
              placeholder="在此编辑剧本内容..."
              spellCheck={false}
              className="absolute inset-0 h-full w-full resize-none rounded-none border-0 bg-transparent py-3 pl-2 pr-4 font-mono text-sm leading-relaxed shadow-none focus-visible:ring-0 whitespace-pre overflow-x-auto overflow-y-auto"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-1.5 shrink-0 text-[11px] tabular-nums text-muted-foreground">
          <span>{lineCount > 0 ? `${lineCount} 行` : "空内容"}</span>
          <span className="text-border select-none" aria-hidden>
            ·
          </span>
          <span className="font-medium text-foreground/75">
            {wordCount.toLocaleString()} 字
          </span>
        </div>
      </div>

      <ScriptAssetDialog
        open={showAssetDialog}
        onOpenChange={setShowAssetDialog}
        script={script}
        projectId={projectId}
        onSave={async (data) => {
          await onUpdateScript({
            characters: data.characters,
            location: data.location,
            props: data.props,
          })
        }}
      />
    </>
  )
}
