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
import { Check, X, Pencil, MapPin, User, Package, ListOrdered, BookOpen, School } from "lucide-react"
import { cn } from "@/lib/utils"
import type {
  AssetCharacter,
  AssetProp,
  AssetScene,
  Episode,
  Script,
  Chapter,
} from "@/lib/types"
import { countWords, formatChapterOrdinalLabel } from "@/lib/novel-utils"
import { parseSourceChapterIds } from "@/lib/episode-source-chapters"
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
  chapters?: Chapter[]
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
  onUpdateEpisode?: (data: {
    title?: string
    outline?: string | null
    goldenHook?: string | null
    keyConflict?: string | null
    cliffhanger?: string | null
  }) => Promise<void>
}

export function ScriptEditor({
  script,
  episode,
  chapters = [],
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
  const [goldenHookValue, setGoldenHookValue] = useState(episode.goldenHook ?? "")
  const [keyConflictValue, setKeyConflictValue] = useState(episode.keyConflict ?? "")
  const [cliffhangerValue, setCliffhangerValue] = useState(episode.cliffhanger ?? "")
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
    setGoldenHookValue(episode.goldenHook ?? "")
    setKeyConflictValue(episode.keyConflict ?? "")
    setCliffhangerValue(episode.cliffhanger ?? "")
  }, [episode.id, episode.title, episode.outline, episode.goldenHook, episode.keyConflict, episode.cliffhanger])

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
    const trimmedOutline = outlineValue.trim()
    const trimmedGoldenHook = goldenHookValue.trim()
    const trimmedKeyConflict = keyConflictValue.trim()
    const trimmedCliffhanger = cliffhangerValue.trim()

    const hasChanged = 
      trimmedOutline !== (episode.outline ?? "").trim() ||
      trimmedGoldenHook !== (episode.goldenHook ?? "").trim() ||
      trimmedKeyConflict !== (episode.keyConflict ?? "").trim() ||
      trimmedCliffhanger !== (episode.cliffhanger ?? "").trim()

    if (!hasChanged) {
      setEditingOutline(false)
      return
    }

    setSavingOutline(true)
    try {
      await onUpdateEpisode?.({ 
        outline: trimmedOutline || null,
        goldenHook: trimmedGoldenHook || null,
        keyConflict: trimmedKeyConflict || null,
        cliffhanger: trimmedCliffhanger || null,
      })
    } finally {
      setSavingOutline(false)
      setEditingOutline(false)
    }
  }

  const handleOutlineCancel = () => {
    setEditingOutline(false)
    setOutlineValue(episode.outline ?? "")
    setGoldenHookValue(episode.goldenHook ?? "")
    setKeyConflictValue(episode.keyConflict ?? "")
    setCliffhangerValue(episode.cliffhanger ?? "")
  }

  const handleOutlineKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      handleOutlineCancel()
    }
  }

  const wordCount = countWords(content)
  const lineCount = content ? content.split("\n").length : 0
  
  const sourceChapterIds = parseSourceChapterIds(episode)
  const sourceChapterCount = sourceChapterIds.length
  const sourceChapters = chapters.filter(c => sourceChapterIds.includes(c.id))
    // 按原始 ID 顺序排列
    .sort((a, b) => sourceChapterIds.indexOf(a.id) - sourceChapterIds.indexOf(b.id))

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
            {sourceChapterCount > 1 && (
              <Badge variant="secondary" className="text-[9px] shrink-0 font-normal">
                涵盖 {sourceChapterCount} 章
              </Badge>
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
            defaultSize={"40%"}
            minSize={"30%"}
            maxSize={"60%"}
            className="min-w-0 flex flex-col"
          >
            <div className="flex flex-col h-full overflow-y-auto bg-muted/5">
              {/* 资产区 */}
              <div className="mb-4 space-y-2.5">
                {/* <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">关联资产</Label> */}
                <div className="px-4 py-2 bg-muted/20 border-b flex items-center justify-between">
                  <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                    <School className="size-3" />
                    关联资产 
                  </Label>

                </div>
                <div className="grid grid-cols-3 gap-3 px-4">
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
              <div className="shrink-0 space-y-4 pb-6">
                <div className="px-4 py-2 bg-muted/20 border-y flex items-center justify-between">
                  <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                    <ListOrdered className="size-3" />
                    分集大纲
                  </Label>
                  {!editingOutline && onUpdateEpisode && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px] px-2 gap-1 text-primary hover:text-primary hover:bg-primary/5"
                      onClick={handleOutlineEdit}
                    >
                      <Pencil className="size-3" />
                      编辑大纲
                    </Button>
                  )}
                </div>

                {/* 详细大纲 (放在最上面，去掉颜色) */}
                <div className="px-4 group/outline relative">
                  <div className="flex items-center justify-between mb-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">大纲详情</Label>
                  </div>
                  {editingOutline ? (
                    <Textarea
                      ref={outlineRef}
                      value={outlineValue}
                      onChange={(e) => setOutlineValue(e.target.value)}
                      onKeyDown={handleOutlineKeyDown}
                      placeholder="详细的情节发展..."
                      className="min-h-[120px] resize-none text-xs leading-relaxed border-primary/20 focus-visible:ring-1 focus-visible:ring-primary/40"
                    />
                  ) : (
                    <div className="min-h-[1.5rem]">
                      {episode.outline?.trim() ? (
                        <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">{episode.outline}</p>
                      ) : (
                        <p className="text-[11px] text-muted-foreground/50 italic">未设置大纲</p>
                      )}
                    </div>
                  )}
                </div>

                {/* 黄金钩子 & 核心冲突 (左右布局) */}
                <div className="px-4 grid grid-cols-2 gap-4">
                  {/* 黄金钩子 */}
                  <div className="group/goldenHook relative">
                    <div className="flex items-center justify-between mb-1.5">
                      <Label className="text-xs font-semibold text-amber-600 dark:text-amber-400">黄金钩子</Label>
                    </div>
                    {editingOutline ? (
                      <Textarea
                        value={goldenHookValue}
                        onChange={(e) => setGoldenHookValue(e.target.value)}
                        onKeyDown={handleOutlineKeyDown}
                        placeholder="开篇吸睛点..."
                        className="min-h-[80px] resize-none text-xs leading-relaxed border-primary/20 focus-visible:ring-1 focus-visible:ring-primary/40"
                      />
                    ) : (
                      <div className="min-h-[1.25rem]">
                        {episode.goldenHook?.trim() ? (
                          <p className="text-xs leading-relaxed text-foreground/90 whitespace-pre-wrap">{episode.goldenHook}</p>
                        ) : (
                          <p className="text-[11px] text-muted-foreground/50 italic">未设置</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 核心冲突 */}
                  <div className="group/conflict relative">
                    <div className="flex items-center justify-between mb-1.5">
                      <Label className="text-xs font-semibold text-rose-600 dark:text-rose-400">核心冲突</Label>
                    </div>
                    {editingOutline ? (
                      <Textarea
                        value={keyConflictValue}
                        onChange={(e) => setKeyConflictValue(e.target.value)}
                        onKeyDown={handleOutlineKeyDown}
                        placeholder="主要矛盾点..."
                        className="min-h-[80px] resize-none text-xs leading-relaxed border-primary/20 focus-visible:ring-1 focus-visible:ring-primary/40"
                      />
                    ) : (
                      <div className="min-h-[1.25rem]">
                        {episode.keyConflict?.trim() ? (
                          <p className="text-xs leading-relaxed text-foreground/90 whitespace-pre-wrap">{episode.keyConflict}</p>
                        ) : (
                          <p className="text-[11px] text-muted-foreground/50 italic">未设置</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* 结尾悬念 (放下面) */}
                <div className="px-4 group/cliffhanger relative">
                  <div className="flex items-center justify-between mb-1.5">
                    <Label className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">结尾悬念</Label>
                  </div>
                  {editingOutline ? (
                    <Textarea
                      value={cliffhangerValue}
                      onChange={(e) => setCliffhangerValue(e.target.value)}
                      onKeyDown={handleOutlineKeyDown}
                      placeholder="如何引导下一集？"
                      className="min-h-[60px] resize-none text-xs leading-relaxed border-primary/20 focus-visible:ring-1 focus-visible:ring-primary/40"
                    />
                  ) : (
                    <div className="min-h-[1.25rem]">
                      {episode.cliffhanger?.trim() ? (
                        <p className="text-xs leading-relaxed text-foreground/90 whitespace-pre-wrap">{episode.cliffhanger}</p>
                      ) : (
                        <p className="text-[11px] text-muted-foreground/50 italic">未设置悬念</p>
                      )}
                    </div>
                  )}
                </div>

                {/* 保存/取消按钮 */}
                {editingOutline && (
                  <div className="px-4 flex items-center gap-1.5 justify-end mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-muted-foreground"
                      disabled={savingOutline}
                      onClick={handleOutlineCancel}
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
                )}
              </div>


              {/* 关联章节 */}
              {sourceChapters.length > 0 && (
                <div className="shrink-0 space-y-2 pb-2">
                  <div className="px-4 py-2 bg-muted/20 border-y flex items-center justify-between">
                    <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                      <BookOpen className="size-3" />
                      关联章节 ({sourceChapters.length})
                    </Label>

                  </div>
                  <div className="px-4 flex flex-wrap gap-1.5">
                    {sourceChapters.map((ch) => (
                      <Badge 
                        key={ch.id} 
                        variant="outline" 
                        className="bg-background/50 text-[10px] font-medium py-0.5 px-2 hover:bg-muted transition-colors cursor-default"
                        title={ch.title || undefined}
                      >
                        <span className="text-muted-foreground mr-1">{formatChapterOrdinalLabel(ch.index)}</span>
                        {ch.title || "未命名"}
                      </Badge>
                    ))}
                  </div>
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
    </>
  )
}
