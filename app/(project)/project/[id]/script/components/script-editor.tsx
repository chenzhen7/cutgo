"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Check, X, Pencil, MapPin, User, Package } from "lucide-react"
import { cn } from "@/lib/utils"
import type {
  AssetCharacter,
  AssetProp,
  AssetScene,
  Episode,
  Script,
} from "@/lib/types"
import { countWords } from "@/lib/novel-utils"
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
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState(episode.title)
  const [savingTitle, setSavingTitle] = useState(false)
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
  const loc = script.location?.trim() || ""
  const boundScene = loc ? assetScenes.find((s) => s.name === loc) : null
  const boundCharacters = assetCharacters.filter((c) => charNames.includes(c.name))
  const boundProps = assetProps.filter((p) => propNames.includes(p.name))

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

  const handleToggleCharacter = async (name: string) => {
    const next = charNames.includes(name)
      ? charNames.filter((n) => n !== name)
      : [...charNames, name]
    await onUpdateScript({ characters: JSON.stringify(next) })
  }

  const handleChangeScene = async (name: string) => {
    await onUpdateScript({ location: name === "__none__" ? undefined : name })
  }

  const handleToggleProp = async (name: string) => {
    const next = propNames.includes(name)
      ? propNames.filter((n) => n !== name)
      : [...propNames, name]
    await onUpdateScript({ props: JSON.stringify(next) })
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
        <div className="flex items-center gap-2 px-4 h-[52px] border-b shrink-0">
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
              {/* 资产区 */}
              <div className="px-4 py-3 mb-1 space-y-2.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">关联资产</Label>

                <div className="grid grid-cols-3 gap-3">
                  {/* Scene */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <MapPin className="size-3 text-muted-foreground" />
                        <span className="text-[11px] font-medium">场景</span>
                      </div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-5 text-[9px] px-1.5">编辑</Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-2" align="start">
                          <div className="space-y-1 max-h-48 overflow-y-auto">
                            <button
                              onClick={() => handleChangeScene("__none__")}
                              className={cn(
                                "w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted text-xs transition-colors",
                                !script.location && "bg-muted font-medium"
                              )}
                            >
                              无
                            </button>
                            {assetScenes.length === 0 ? (
                              <p className="text-xs text-muted-foreground py-2 text-center">暂无场景资产</p>
                            ) : (
                              assetScenes.map((s) => (
                                <button
                                  key={s.id}
                                  onClick={() => handleChangeScene(s.name)}
                                  className={cn(
                                    "w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted text-xs text-left transition-colors",
                                    script.location === s.name && "bg-muted font-medium text-primary"
                                  )}
                                >
                                  <div className="flex items-center gap-2 min-w-0 text-[11px]">
                                    {s.imageUrl ? (
                                      <img src={s.imageUrl} alt="" className="size-5 rounded object-cover shrink-0" />
                                    ) : (
                                      <div className="size-5 rounded bg-muted-foreground/10 flex items-center justify-center shrink-0">
                                        <MapPin className="size-3 text-muted-foreground" />
                                      </div>
                                    )}
                                    <span className="truncate">{s.name}</span>
                                  </div>
                                </button>
                              ))
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    {boundScene ? (
                      <div className="rounded-lg overflow-hidden border bg-muted/30">
                        {boundScene.imageUrl ? (
                          <img src={boundScene.imageUrl} alt={boundScene.name} className="w-full h-16 object-cover" />
                        ) : (
                          <div className="w-full h-12 flex items-center justify-center bg-muted/50">
                            <MapPin className="size-4 text-muted-foreground/20" />
                          </div>
                        )}
                        <div className="px-1.5 py-1 border-t bg-card">
                          <p className="text-[10px] font-medium truncate">{boundScene.name}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="h-12 rounded-lg border border-dashed border-muted-foreground/15 flex items-center justify-center">
                        <p className="text-[10px] text-muted-foreground/40 italic">{loc || "未绑定"}</p>
                      </div>
                    )}
                  </div>

                  {/* Characters */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <User className="size-3 text-muted-foreground" />
                        <span className="text-[11px] font-medium">角色</span>
                        {charNames.length > 0 && (
                          <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5 leading-none">{charNames.length}</Badge>
                        )}
                      </div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-5 text-[9px] px-1.5">编辑</Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-2" align="start">
                          <div className="space-y-1 max-h-48 overflow-y-auto">
                            {assetCharacters.length === 0 ? (
                              <p className="text-xs text-muted-foreground py-2 text-center">暂无角色资产</p>
                            ) : (
                              assetCharacters.map((c) => (
                                <label key={c.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted cursor-pointer transition-colors">
                                  <Checkbox
                                    checked={charNames.includes(c.name)}
                                    onCheckedChange={() => handleToggleCharacter(c.name)}
                                  />
                                  <div className="flex items-center gap-2 min-w-0">
                                    {c.imageUrl ? (
                                      <img src={c.imageUrl} alt="" className="size-5 rounded-full object-cover shrink-0" />
                                    ) : (
                                      <div className="size-5 rounded-full bg-muted-foreground/10 flex items-center justify-center shrink-0">
                                        <User className="size-3 text-muted-foreground" />
                                      </div>
                                    )}
                                    <span className="text-[11px] truncate">{c.name}</span>
                                  </div>
                                </label>
                              ))
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    {boundCharacters.length > 0 ? (
                      <div className="flex gap-1.5 flex-wrap">
                        {boundCharacters.map((c) => (
                          <div key={c.id} className="flex flex-col items-center gap-0.5">
                            <div className="size-9 rounded-md overflow-hidden bg-muted border">
                              {c.imageUrl ? (
                                <img src={c.imageUrl} alt={c.name} className="size-full object-cover" />
                              ) : (
                                <div className="size-full flex items-center justify-center">
                                  <User className="size-4 text-muted-foreground/40" />
                                </div>
                              )}
                            </div>
                            <span className="text-[9px] text-muted-foreground truncate max-w-[36px]">{c.name}</span>
                          </div>
                        ))}
                      </div>
                    ) : charNames.length > 0 ? (
                      <div className="flex gap-1 flex-wrap">
                        {charNames.map(name => (
                          <Badge key={name} variant="outline" className="text-[9px] px-1.5">{name}</Badge>
                        ))}
                      </div>
                    ) : (
                      <div className="h-12 rounded-lg border border-dashed border-muted-foreground/15 flex items-center justify-center">
                        <p className="text-[10px] text-muted-foreground/40 italic">未绑定</p>
                      </div>
                    )}
                  </div>

                  {/* Props */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Package className="size-3 text-muted-foreground" />
                        <span className="text-[11px] font-medium">道具</span>
                        {propNames.length > 0 && (
                          <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5 leading-none">{propNames.length}</Badge>
                        )}
                      </div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-5 text-[9px] px-1.5">编辑</Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-2" align="start">
                          <div className="space-y-1 max-h-48 overflow-y-auto">
                            {assetProps.length === 0 ? (
                              <p className="text-xs text-muted-foreground py-2 text-center">暂无道具资产</p>
                            ) : (
                              assetProps.map((p) => (
                                <label key={p.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted cursor-pointer transition-colors">
                                  <Checkbox
                                    checked={propNames.includes(p.name)}
                                    onCheckedChange={() => handleToggleProp(p.name)}
                                  />
                                  <span className="text-[11px] truncate">{p.name}</span>
                                </label>
                              ))
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    {boundProps.length > 0 ? (
                      <div className="flex gap-1 flex-wrap">
                        {boundProps.map((p) => (
                          <Badge key={p.id} variant="outline" className="text-[9px] px-1.5">
                            {p.name}
                          </Badge>
                        ))}
                      </div>
                    ) : propNames.length > 0 ? (
                      <div className="flex gap-1 flex-wrap">
                        {propNames.map(name => (
                          <Badge key={name} variant="outline" className="text-[9px] px-1.5">{name}</Badge>
                        ))}
                      </div>
                    ) : (
                      <div className="h-12 rounded-lg border border-dashed border-muted-foreground/15 flex items-center justify-center">
                        <p className="text-[10px] text-muted-foreground/40 italic">未绑定</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 大纲区块 */}
              <div className="shrink-0">
                <div className="px-4 py-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">大纲</Label>
                </div>
                <div className="px-4 pb-3 pt-0 group/outline relative">
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
                        <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap pr-5">
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
              </div>
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
    </>
  )
}
