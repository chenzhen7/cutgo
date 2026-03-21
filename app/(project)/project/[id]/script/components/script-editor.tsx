"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Check, X, FolderOpen, Pencil, ChevronDown, ChevronRight } from "lucide-react"
import type {
  AssetCharacter,
  AssetProp,
  AssetScene,
  Episode,
  Script,
} from "@/lib/types"
import { countWords } from "@/lib/novel-utils"
import { ScriptAssetDialog } from "./script-asset-dialog"
import { ScriptAssetStrip } from "./script-asset-strip"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

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
  episode: Episode
  /** 全项目分集排序后的展示集序号（第 1、2… 集），非数据库 index 字段 */
  episodeDisplayNumber: number
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
  onUpdateEpisode?: (data: { title?: string; outline?: string | null }) => Promise<void>
}

export function ScriptEditor({
  script,
  episode,
  episodeDisplayNumber,
  projectId,
  assetCharacters,
  assetScenes,
  assetProps,
  onUpdateScript,
  onUpdateEpisode,
}: ScriptEditorProps) {
  const [content, setContent] = useState(script.content ?? "")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showAssetDialog, setShowAssetDialog] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState(episode.title)
  const [savingTitle, setSavingTitle] = useState(false)
  const [outlineOpen, setOutlineOpen] = useState(true)
  const [editingOutline, setEditingOutline] = useState(false)
  const [outlineValue, setOutlineValue] = useState(episode.outline ?? "")
  const [savingOutline, setSavingOutline] = useState(false)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const outlineRef = useRef<HTMLTextAreaElement>(null)

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
    setTitleValue(episode.title)
    setOutlineValue(episode.outline ?? "")
  }, [episode.id, episode.title, episode.outline])

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

  const handleTitleEdit = () => {
    if (!onUpdateEpisode) return
    setEditingTitle(true)
    setTimeout(() => titleInputRef.current?.select(), 0)
  }

  const handleTitleSave = async () => {
    const trimmed = titleValue.trim()
    if (!trimmed || trimmed === episode.title) {
      setEditingTitle(false)
      setTitleValue(episode.title)
      return
    }
    setSavingTitle(true)
    try {
      await onUpdateEpisode?.({ title: trimmed })
    } finally {
      setSavingTitle(false)
      setEditingTitle(false)
    }
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleTitleSave()
    if (e.key === "Escape") {
      setEditingTitle(false)
      setTitleValue(episode.title)
    }
  }

  const handleOutlineEdit = () => {
    if (!onUpdateEpisode) return
    setEditingOutline(true)
    setOutlineOpen(true)
    setTimeout(() => {
      const el = outlineRef.current
      if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length) }
    }, 0)
  }

  const handleOutlineSave = async () => {
    const trimmed = outlineValue.trim()
    const prev = episode.outline ?? ""
    if (trimmed === prev.trim()) {
      setEditingOutline(false)
      return
    }
    setSavingOutline(true)
    try {
      await onUpdateEpisode?.({ outline: trimmed || null })
    } finally {
      setSavingOutline(false)
      setEditingOutline(false)
    }
  }

  const handleOutlineKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      setEditingOutline(false)
      setOutlineValue(episode.outline ?? "")
    }
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
        {/* 顶栏 */}
        <div className="flex items-center gap-2 px-4 py-3 border-b shrink-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-xs font-bold text-primary bg-primary/10 rounded px-2 py-0.5 shrink-0">
              第{episodeDisplayNumber}集
            </span>
            {editingTitle ? (
              <input
                ref={titleInputRef}
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={handleTitleKeyDown}
                disabled={savingTitle}
                className="flex-1 min-w-0 text-sm font-semibold bg-transparent border-b border-primary outline-none px-0.5 py-0 truncate"
                autoFocus
              />
            ) : (
              <button
                type="button"
                onClick={handleTitleEdit}
                disabled={!onUpdateEpisode}
                className="group flex items-center gap-1 min-w-0 text-left"
                title={onUpdateEpisode ? "点击修改标题" : undefined}
              >
                <h3 className="text-sm font-semibold truncate">{episode.title}</h3>
                {onUpdateEpisode && (
                  <Pencil className="size-3 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </button>
            )}
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

        {/* 左右可拖拽布局：左侧大纲+资产区，右侧剧本编辑区 */}
        <ResizablePanelGroup
          orientation="horizontal"
          className="flex-1 min-h-0"
        >
          {/* 左侧：大纲 + 资产区 */}
          <ResizablePanel
            defaultSize={450}
            minSize={450}
            maxSize={650}
            className="min-w-0 flex flex-col"
          >
            <div className="flex flex-col h-full overflow-y-auto bg-muted/5">
              {/* 大纲区块 */}
              <div className="shrink-0 border-b bg-muted/10">
                <button
                  type="button"
                  className="flex w-full items-center gap-1.5 px-4 py-1.5 text-left hover:bg-muted/30 transition-colors"
                  onClick={() => setOutlineOpen((v) => !v)}
                >
                  {outlineOpen ? (
                    <ChevronDown className="size-3 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="size-3 shrink-0 text-muted-foreground" />
                  )}
                  <span className="text-[11px] font-medium text-muted-foreground tracking-wide">大纲</span>
                  {!outlineOpen && (episode.outline?.trim()) && (
                    <span className="ml-1 text-[11px] text-muted-foreground truncate flex-1">
                      {episode.outline}
                    </span>
                  )}
                </button>
                {outlineOpen && (
                  <div className="px-4 pb-2.5 pt-0.5 group/outline relative">
                    {editingOutline ? (
                      <div className="flex flex-col gap-1.5">
                        <Textarea
                          ref={outlineRef}
                          value={outlineValue}
                          onChange={(e) => setOutlineValue(e.target.value)}
                          onKeyDown={handleOutlineKeyDown}
                          disabled={savingOutline}
                          placeholder="在此输入分集大纲..."
                          className="min-h-[120px] resize-none text-xs leading-relaxed border-primary/50 focus-visible:ring-1 focus-visible:ring-primary/40"
                        />
                        <div className="flex items-center gap-1.5 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-muted-foreground"
                            disabled={savingOutline}
                            onClick={() => { setEditingOutline(false); setOutlineValue(episode.outline ?? "") }}
                          >
                            <X className="size-3 mr-1" />
                            取消
                          </Button>
                          <Button
                            size="sm"
                            className="h-6 px-2 text-xs"
                            disabled={savingOutline}
                            onClick={handleOutlineSave}
                          >
                            <Check className="size-3 mr-1" />
                            {savingOutline ? "保存中..." : "保存"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="relative min-h-[1.5rem] cursor-text"
                        onClick={onUpdateEpisode ? handleOutlineEdit : undefined}
                      >
                        {episode.outline?.trim() ? (
                          <p className="text-xs leading-relaxed text-foreground/80 whitespace-pre-wrap pr-5">
                            {episode.outline}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground/60 italic">
                            暂无大纲{onUpdateEpisode ? "，点击添加" : ""}
                          </p>
                        )}
                        {onUpdateEpisode && (
                          <Pencil className="absolute top-0 right-0 size-3 text-muted-foreground opacity-0 group-hover/outline:opacity-100 transition-opacity" />
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 资产区 */}
              {(charNames.length > 0 ||
                propNames.length > 0 ||
                !!(script.location?.trim())) && (
                  <div className="px-4 py-3 border-b bg-muted/10">
                    <p className="text-[11px] font-medium text-muted-foreground tracking-wide mb-2">关联资产</p>
                    <ScriptAssetStrip
                      script={script}
                      assetCharacters={assetCharacters}
                      assetScenes={assetScenes}
                      assetProps={assetProps}
                      mode="editor"
                    />
                  </div>
                )}
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* 右侧：剧本编辑区 */}
          <ResizablePanel className="min-w-0 flex flex-col">
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

            <div className="flex items-center justify-end gap-2 px-4 py-1.5 shrink-0 text-[11px] tabular-nums text-muted-foreground border-t">
              <span>{lineCount > 0 ? `${lineCount} 行` : "空内容"}</span>
              <span className="text-border select-none" aria-hidden>
                ·
              </span>
              <span className="font-medium text-foreground/75">
                {wordCount.toLocaleString()} 字
              </span>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
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
