"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  X,
  ChevronLeft,
  ChevronRight,
  User,
  MapPin,
  Package,
  Loader2,
  ImageIcon,
  Video,
  Plus,
} from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { cn, parseJsonArray } from "@/lib/utils"
import { IMAGE_TYPE_OPTIONS, GRID_LAYOUT_OPTIONS } from "@/lib/types"
import type { Shot, ScriptShotPlan, ShotInput, AssetCharacter, AssetScene, AssetProp, ImageType, GridLayout } from "@/lib/types"
import {
  CharacterFormDialog,
  SceneFormDialog,
  PropFormDialog,
} from "@/components/asset-form-dialogs"
import { useAssetStore } from "@/store/asset-store"
import { useScriptShotsStore } from "@/store/script-shot-store"

const EmptyBinding = () => (
  <div className="h-12 rounded-lg border border-dashed border-muted-foreground/15 flex items-center justify-center">
    <p className="text-[10px] text-muted-foreground/40 italic">未绑定</p>
  </div>
)

function AssetImagePlaceholder({ icon }: { icon: ReactNode }) {
  return (
    <div className="size-full flex items-center justify-center bg-muted/50">
      {icon}
    </div>
  )
}

function GeneratingAssetOverlay({ compact = false }: { compact?: boolean }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-background/70 backdrop-blur-[1px]">
      <Loader2 className={cn("animate-spin text-primary", compact ? "size-3.5" : "size-4")} />
    </div>
  )
}

function AssetThumbnail({
  imageUrl,
  imageStatus,
  alt,
  empty,
  className,
  compactGenerating = false,
}: {
  imageUrl: string | null
  imageStatus?: string | null
  alt: string
  empty: ReactNode
  className?: string
  compactGenerating?: boolean
}) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      {imageUrl ? (
        <img src={imageUrl} alt={alt} className="size-full object-cover" />
      ) : (
        empty
      )}
      {imageStatus === "generating" ? <GeneratingAssetOverlay compact={compactGenerating} /> : null}
    </div>
  )
}

interface ShotDetailPanelProps {
  shot: Shot
  scriptShotPlan: ScriptShotPlan
  episodeDisplayNumber: number
  aspectRatio?: string
  activeTab: "image" | "video"
  isGeneratingImage: boolean
  isGeneratingVideo: boolean
  assetCharacters: AssetCharacter[]
  assetScenes: AssetScene[]
  assetProps: AssetProp[]
  onPrev: (() => void) | null
  onNext: (() => void) | null
  onClose: () => void
  onTabChange: (tab: "image" | "video") => void
  onUpdate: (episodeId: string, shotId: string, data: Partial<ShotInput>) => void
  onGenerateImage: () => void
  onGenerateVideo: () => void
}

export function ShotDetailPanel({
  shot,
  scriptShotPlan,
  episodeDisplayNumber,
  aspectRatio = "9:16",
  activeTab,
  isGeneratingImage,
  isGeneratingVideo,
  assetCharacters,
  assetScenes,
  assetProps,
  onPrev,
  onNext,
  onClose,
  onTabChange,
  onUpdate,
  onGenerateImage,
  onGenerateVideo,
}: ShotDetailPanelProps) {
  const params = useParams()
  const projectId = params.id as string
  const { updateCharacter, updateScene, updateProp } = useAssetStore()
  const fetchAssets = useScriptShotsStore((s) => s.fetchAssets)

  const [editingCharacter, setEditingCharacter] = useState<AssetCharacter | null>(null)
  const [editingScene, setEditingScene] = useState<AssetScene | null>(null)
  const [editingProp, setEditingProp] = useState<AssetProp | null>(null)

  const handleAssetSaved = useCallback(() => {
    void fetchAssets(projectId)
  }, [fetchAssets, projectId])

  const [content, setContent] = useState(() => shot.content || "")
  const [lastContent, setLastContent] = useState(() => shot.lastContent || "")
  const [duration, setDuration] = useState<string>(() => shot.duration?.toString() || "5")
  const [dialogueText, setDialogueText] = useState(() => shot.dialogueText || "")
  const [refImageUrls, setRefImageUrls] = useState<string[]>(() => parseJsonArray<string>(shot.refImageUrls))
  const [refImageNote, setRefImageNote] = useState(() => shot.refImageNote || "")
  const [readingRefFile, setReadingRefFile] = useState(false)
  const [dragOverRef, setDragOverRef] = useState(false)
  const debouncedUpdateTimerRef = useRef<NodeJS.Timeout | null>(null)

  const updateShotData = useCallback(
    (data: Partial<ShotInput>) => {
      onUpdate(scriptShotPlan.episodeId, shot.id, data)
    },
    [onUpdate, scriptShotPlan.episodeId, shot.id]
  )

  const debouncedUpdate = useCallback(
    (data: Partial<ShotInput>) => {
      if (debouncedUpdateTimerRef.current) {
        clearTimeout(debouncedUpdateTimerRef.current)
      }
      debouncedUpdateTimerRef.current = setTimeout(() => {
        onUpdate(scriptShotPlan.episodeId, shot.id, data)
      }, 500)
    },
    [onUpdate, scriptShotPlan.episodeId, shot.id]
  )

  useEffect(() => {
    return () => {
      if (debouncedUpdateTimerRef.current) {
        clearTimeout(debouncedUpdateTimerRef.current)
      }
    }
  }, [])

  const boundCharacterIds = useMemo(() => shot.characterIds ?? [], [shot.characterIds])
  const boundPropIds = useMemo(() => shot.propIds ?? [], [shot.propIds])

  const boundCharacters = useMemo(
    () => assetCharacters.filter((c) => boundCharacterIds.includes(c.id)),
    [assetCharacters, boundCharacterIds]
  )
  const boundScene = useMemo(
    () => (shot.sceneId ? assetScenes.find((s) => s.id === shot.sceneId) : null),
    [assetScenes, shot.sceneId]
  )
  const boundProps = useMemo(
    () => assetProps.filter((p) => boundPropIds.includes(p.id)),
    [assetProps, boundPropIds]
  )
  const [scenePopoverOpen, setScenePopoverOpen] = useState(false)

  const toggleItem = (ids: string[], targetId: string) =>
    ids.includes(targetId) ? ids.filter((id) => id !== targetId) : [...ids, targetId]

  const handleToggleCharacter = (charId: string) => {
    const next = toggleItem(boundCharacterIds, charId)
    updateShotData({ characterIds: next.length > 0 ? next : [] })
  }

  const handleChangeScene = (sceneId: string) => {
    setScenePopoverOpen(false)
    // 延迟更新数据，让弹窗先关闭，减少卡顿感
    setTimeout(() => {
      updateShotData({ sceneId: sceneId === "__none__" ? null : sceneId })
    }, 100)
  }

  const handleToggleProp = (propId: string) => {
    const next = toggleItem(boundPropIds, propId)
    updateShotData({ propIds: next.length > 0 ? next : [] })
  }

  const handleImageTypeChange = (type: string) => {
    updateShotData({ imageType: type as ImageType })
  }

  const handleGridLayoutChange = (layout: string) => {
    updateShotData({ gridLayout: layout as GridLayout })
  }

  const handleAddRefImage = async (file: File) => {
    setReadingRefFile(true)
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "")
        reader.onerror = () => reject(new Error("读取图片失败"))
        reader.readAsDataURL(file)
      })
      if (!dataUrl) throw new Error("读取图片失败")
      const next = [...refImageUrls, dataUrl]
      setRefImageUrls(next)
      updateShotData({ refImageUrls: JSON.stringify(next) })
    } catch {
      // ignore
    } finally {
      setReadingRefFile(false)
    }
  }

  const handleRemoveRefImage = (index: number) => {
    const next = refImageUrls.filter((_, i) => i !== index)
    setRefImageUrls(next)
    updateShotData({ refImageUrls: next.length > 0 ? JSON.stringify(next) : null })
  }

  const imageType = shot.imageType || "keyframe"
  const hasImage = !!shot.imageUrl
  const episode = scriptShotPlan.episode

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">镜头详情</span>
          <span className="text-xs text-muted-foreground font-mono">#{shot.index + 1}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={!onPrev} onClick={onPrev || undefined}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={!onNext} onClick={onNext || undefined}>
            <ChevronRight className="size-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-12 space-y-4">

        {/* === Tabs: Image Generation / Video Generation === */}
        <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as "image" | "video")} className="gap-3">
          <TabsList className="w-full">
            <TabsTrigger value="image" className="flex-1 gap-1.5 text-xs">
              <ImageIcon className="size-3.5" />
              画面生成
            </TabsTrigger>
            <TabsTrigger value="video" className="flex-1 gap-1.5 text-xs">
              <Video className="size-3.5" />
              视频生成
            </TabsTrigger>
          </TabsList>

          {/* === Image Generation Tab === */}
          <TabsContent value="image" className="flex flex-col gap-4">

            <div className="space-y-4">

              {/* Asset bindings section */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">关联资产</Label>

                <div className={cn("grid gap-3", aspectRatio === "9:16" ? "grid-cols-2" : "grid-cols-3")}>
                  {/* Scene */}
                  <div className={cn("space-y-1.5", aspectRatio === "9:16" ? "col-span-2" : "")}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <MapPin className="size-4 text-muted-foreground" />
                        <span className="text-[11px] font-medium">场景</span>
                      </div>
                      <Popover open={scenePopoverOpen} onOpenChange={setScenePopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-5 text-[9px] px-1.5">编辑</Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-2" align="end">
                          <div className="space-y-1 max-h-48 overflow-y-auto">
                            <button
                              onClick={() => handleChangeScene("__none__")}
                              className={cn(
                                "w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted text-xs transition-colors",
                                !shot.sceneId && "bg-muted font-medium"
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
                                  onClick={() => handleChangeScene(s.id)}
                                  className={cn(
                                    "w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted text-xs text-left transition-colors",
                                    shot.sceneId === s.id && "bg-muted font-medium text-primary"
                                  )}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <AssetThumbnail
                                      imageUrl={s.imageUrl}
                                      imageStatus={s.imageStatus}
                                      alt={s.name}
                                      className="size-5 rounded shrink-0"
                                      compactGenerating
                                      empty={
                                        <div className="size-5 rounded bg-muted-foreground/10 flex items-center justify-center shrink-0">
                                          <MapPin className="size-3.5 text-muted-foreground" />
                                        </div>
                                      }
                                    />
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
                      <button
                        onClick={() => setEditingScene(boundScene)}
                        className="w-full rounded-lg overflow-hidden border bg-muted/30 hover:ring-2 hover:ring-primary/40 transition-all text-left"
                        title={`编辑 ${boundScene.name}`}
                      >
                        <AssetThumbnail
                          imageUrl={boundScene.imageUrl}
                          imageStatus={boundScene.imageStatus}
                          alt={boundScene.name}
                          className="w-full h-16"
                          empty={
                            <AssetImagePlaceholder icon={<MapPin className="size-4 text-muted-foreground/20" />} />
                          }
                        />
                        <div className="px-1.5 py-1 border-t bg-card">
                          <p className="text-[10px] font-medium truncate">{boundScene.name}</p>
                        </div>
                      </button>
                    ) : (
                      <EmptyBinding />
                    )}
                  </div>

                  {/* Characters */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <User className="size-4 text-muted-foreground" />
                        <span className="text-[11px] font-medium">角色</span>
                        {boundCharacters.length > 0 && (
                          <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5 leading-none">{boundCharacters.length}</Badge>
                        )}
                      </div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-5 text-[9px] px-1.5">编辑</Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-2" align="end">
                          <div className="space-y-1 max-h-48 overflow-y-auto">
                            {assetCharacters.length === 0 ? (
                              <p className="text-xs text-muted-foreground py-2 text-center">暂无角色资产</p>
                            ) : (
                              assetCharacters.map((c) => (
                                <label key={c.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer">
                                  <Checkbox
                                    checked={boundCharacterIds.includes(c.id)}
                                    onCheckedChange={() => handleToggleCharacter(c.id)}
                                  />
                                  <div className="flex items-center gap-2 min-w-0">
                                    <AssetThumbnail
                                      imageUrl={c.imageUrl}
                                      imageStatus={c.imageStatus}
                                      alt={c.name}
                                      className="size-5 rounded-full shrink-0"
                                      compactGenerating
                                      empty={
                                        <div className="size-5 rounded-full bg-muted-foreground/10 flex items-center justify-center shrink-0">
                                          <User className="size-3.5 text-muted-foreground" />
                                        </div>
                                      }
                                    />
                                    <span className="text-xs truncate">{c.name}</span>
                                  </div>
                                </label>
                              ))
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    {boundCharacters.length > 0 ? (
                      <div className="grid grid-cols-3 gap-1.5">
                        {boundCharacters.map((c) => (
                          <div key={c.id} className="flex flex-col items-center gap-1">
                            <button
                              onClick={() => setEditingCharacter(c)}
                              className="aspect-square w-full rounded-md overflow-hidden bg-muted border hover:ring-2 hover:ring-primary/40 transition-all"
                              title={`编辑 ${c.name}`}
                            >
                              <AssetThumbnail
                                imageUrl={c.imageUrl}
                                imageStatus={c.imageStatus}
                                alt={c.name}
                                className="size-full"
                                empty={
                                  <AssetImagePlaceholder icon={<User className="size-4 text-muted-foreground/40" />} />
                                }
                              />
                            </button>
                            <span className="text-[9px] text-muted-foreground truncate w-full text-center px-0.5">{c.name}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyBinding />
                    )}
                  </div>

                  {/* Props */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Package className="size-4 text-muted-foreground" />
                        <span className="text-[11px] font-medium">道具</span>
                        {boundProps.length > 0 && (
                          <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5 leading-none">{boundProps.length}</Badge>
                        )}
                      </div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-5 text-[9px] px-1.5">编辑</Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-2" align="end">
                          <div className="space-y-1 max-h-48 overflow-y-auto">
                            {assetProps.length === 0 ? (
                              <p className="text-xs text-muted-foreground py-2 text-center">暂无道具资产</p>
                            ) : (
                              assetProps.map((p) => (
                                <label key={p.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer">
                                  <Checkbox
                                    checked={boundPropIds.includes(p.id)}
                                    onCheckedChange={() => handleToggleProp(p.id)}
                                  />
                                  <div className="flex items-center gap-2 min-w-0">
                                    <AssetThumbnail
                                      imageUrl={p.imageUrl}
                                      imageStatus={p.imageStatus}
                                      alt={p.name}
                                      className="size-5 rounded shrink-0"
                                      compactGenerating
                                      empty={
                                        <div className="size-5 rounded bg-muted-foreground/10 flex items-center justify-center shrink-0">
                                          <Package className="size-3.5 text-muted-foreground" />
                                        </div>
                                      }
                                    />
                                    <span className="text-xs truncate">{p.name}</span>
                                  </div>
                                </label>
                              ))
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    {boundProps.length > 0 ? (
                      <div className="grid grid-cols-4 gap-1.5">
                        {boundProps.map((p) => (
                          <div key={p.id} className="flex flex-col items-center gap-1">
                            <button
                              onClick={() => setEditingProp(p)}
                              className="aspect-square w-full rounded-md overflow-hidden bg-muted border hover:ring-2 hover:ring-primary/40 transition-all"
                              title={`编辑 ${p.name}`}
                            >
                              <AssetThumbnail
                                imageUrl={p.imageUrl}
                                imageStatus={p.imageStatus}
                                alt={p.name}
                                className="size-full"
                                empty={
                                  <AssetImagePlaceholder icon={<Package className="size-4 text-muted-foreground/40" />} />
                                }
                              />
                            </button>
                            <span className="text-[9px] text-muted-foreground truncate w-full text-center px-0.5">{p.name}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyBinding />
                    )}
                  </div>
                </div>
              </div>

              {/* Custom reference images */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">自定义参考</Label>
                  <span className="text-[10px] text-muted-foreground">支持点击上传或拖入图片</span>
                </div>

                <div
                  className={cn(
                    "grid grid-cols-4 gap-1.5 rounded-md p-1 transition-colors border border-transparent",
                    dragOverRef && "bg-primary/10 border-dashed border-primary"
                  )}
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setDragOverRef(true)
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setDragOverRef(false)
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setDragOverRef(false)
                    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"))
                    for (const file of files) {
                      void handleAddRefImage(file)
                    }
                  }}
                >
                  {refImageUrls.map((url, i) => (
                    <div key={i} className="relative aspect-square rounded-md overflow-hidden border bg-muted group">
                      <img src={url} alt={`参考图${i + 1}`} className="size-full object-cover" />
                      <button
                        onClick={() => handleRemoveRefImage(i)}
                        className="absolute top-0.5 right-0.5 z-10 flex items-center justify-center size-4 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="size-2.5" />
                      </button>
                    </div>
                  ))}
                  <label className={cn(
                    "aspect-square rounded-md border border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors",
                    readingRefFile && "opacity-50 pointer-events-none"
                  )}>
                    {readingRefFile ? (
                      <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    ) : (
                      <Plus className="size-4 text-muted-foreground" />
                    )}
                    <span className="text-[9px] text-muted-foreground mt-0.5">添加</span>
                    <Input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.currentTarget.files?.[0]
                        if (file) void handleAddRefImage(file)
                        e.currentTarget.value = ""
                      }}
                    />
                  </label>
                </div>

                <div>
                  <Label className="text-[10px] text-muted-foreground mb-1 block">参考图说明（可选）</Label>
                  <Textarea
                    value={refImageNote}
                    onChange={(e) => {
                      setRefImageNote(e.target.value)
                      debouncedUpdate({ refImageNote: e.target.value || null })
                    }}
                    className="text-xs min-h-[40px] max-h-[80px]"
                    placeholder="说明各参考图的用途，如：图1为女主服装参考..."
                  />
                </div>
              </div>

              {/* Image Type selector */}
              <div className="space-y-2.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">画面类型</Label>
                <div className="grid grid-cols-3 gap-1 p-0.5 bg-muted/50 rounded-lg">
                  {IMAGE_TYPE_OPTIONS.map((opt) => (
                    <TooltipProvider key={opt.value} delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => handleImageTypeChange(opt.value)}
                            className={cn(
                              "w-full text-xs py-1.5 rounded-md transition-all font-medium text-center px-2",
                              imageType === opt.value
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {opt.label}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">{opt.description}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </div>

              {/* === Content Area === */}
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Label className="text-xs">分镜描述</Label>
                </div>
                <Textarea
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value)
                    debouncedUpdate({ content: e.target.value })
                  }}
                  className="text-[13px] min-h-[80px] max-h-[160px] leading-relaxed"
                  placeholder="描述该镜头的画面内容（用于生成图片）..."
                />
              </div>

              {/* 尾帧分镜描述（仅首尾帧模式） */}
              {imageType === "first_last" && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Label className="text-xs">尾帧分镜描述</Label>
                    <Badge variant="outline" className="text-[8px] px-1 py-0">lastContent</Badge>
                  </div>
                  <Textarea
                    value={lastContent}
                    onChange={(e) => {
                      setLastContent(e.target.value)
                      debouncedUpdate({ lastContent: e.target.value || null })
                    }}
                    className="text-[13px] min-h-[60px] max-h-[120px] leading-relaxed"
                    placeholder="描述尾帧画面，留空则使用首帧作为尾帧..."
                  />
                </div>
              )}

              {/* 多宫格布局选择 */}
              {imageType === "multi_grid" && (
                <div>
                  <Label className="text-xs mb-1.5 block">宫格布局</Label>
                  <Select value={shot.gridLayout || "2x2"} onValueChange={handleGridLayoutChange}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GRID_LAYOUT_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className="text-xs">
                          {opt.label} ({opt.count}格)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button
                className="w-full"
                onClick={onGenerateImage}
                disabled={isGeneratingImage}
              >
                {isGeneratingImage ? (
                  <Loader2 className="size-3 mr-1.5 animate-spin" />
                ) : (
                  <ImageIcon className="size-3 mr-1.5" />
                )}
                {hasImage ? "重新生成" : "生成画面"}
              </Button>
            </div>
          </TabsContent>

          {/* === Video Generation Tab === */}
          <TabsContent value="video" className="flex flex-col gap-4">

            <div className="space-y-4">

              {/* === Content Area === */}
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Label className="text-xs">分镜描述</Label>
                </div>
                <Textarea
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value)
                    debouncedUpdate({ content: e.target.value })
                  }}
                  className="text-[13px] min-h-[60px] max-h-[120px] leading-relaxed"
                  placeholder="描述该镜头的剧情内容与画面意图（给人看的描述）..."
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] text-muted-foreground mb-1 block">分镜时长(秒)</Label>
                  <Input
                    value={duration}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || /^\d+(\.\d*)?$/.test(val)) {
                        setDuration(val);
                        debouncedUpdate({ duration: val ? parseFloat(val) : undefined });
                      }
                    }}
                    placeholder="如: 5"
                    className="h-7 text-xs"
                  />
                </div>

              </div>

              <Button
                className="w-full"
                onClick={onGenerateVideo}
                disabled={isGeneratingVideo || !hasImage}
              >
                {isGeneratingVideo ? (
                  <Loader2 className="size-3 mr-1.5 animate-spin" />
                ) : (
                  <Video className="size-3 mr-1.5" />
                )}
                {!hasImage ? "请先生成画面" : shot.videoUrl ? "重新生成视频" : "生成视频"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Dialogue */}
        <div>
          <Label className="text-xs">台词</Label>
          <Textarea
            value={dialogueText}
            onChange={(e) => {
              setDialogueText(e.target.value)
              debouncedUpdate({ dialogueText: e.target.value || null })
            }}
            className="mt-1 text-[13px] min-h-[60px] max-h-[140px] leading-relaxed"
            placeholder="角色台词或旁白，每行一条，格式：角色名：台词内容"
          />
        </div>

        {/* Related script */}
        {episode && (
          <div>
            <Label className="text-xs">关联剧本</Label>
            <div className="mt-1 text-xs rounded bg-muted/50 px-2 py-1.5 text-muted-foreground">
              {episode.title} · 第{episodeDisplayNumber}集
            </div>
          </div>
        )}
      </div>

      {/* Asset Edit Dialogs */}
      <CharacterFormDialog
        open={!!editingCharacter}
        onOpenChange={(open) => { if (!open) setEditingCharacter(null) }}
        character={editingCharacter ? assetCharacters.find((item) => item.id === editingCharacter.id) || editingCharacter : null}
        preferExternalState
        onAfterGenerate={async () => {
          if (!editingCharacter) return
          await fetchAssets(projectId, { characterIds: [editingCharacter.id] })
        }}
        onSave={async (data) => {
          if (!editingCharacter) return
          await updateCharacter(editingCharacter.id, data)
          handleAssetSaved()
        }}
      />
      <SceneFormDialog
        open={!!editingScene}
        onOpenChange={(open) => { if (!open) setEditingScene(null) }}
        scene={editingScene ? assetScenes.find((item) => item.id === editingScene.id) || editingScene : null}
        preferExternalState
        onAfterGenerate={async () => {
          if (!editingScene) return
          await fetchAssets(projectId, { sceneIds: [editingScene.id] })
        }}
        onSave={async (data) => {
          if (!editingScene) return
          await updateScene(editingScene.id, data)
          handleAssetSaved()
        }}
      />
      <PropFormDialog
        open={!!editingProp}
        onOpenChange={(open) => { if (!open) setEditingProp(null) }}
        prop={editingProp ? assetProps.find((item) => item.id === editingProp.id) || editingProp : null}
        preferExternalState
        onAfterGenerate={async () => {
          if (!editingProp) return
          await fetchAssets(projectId, { propIds: [editingProp.id] })
        }}
        onSave={async (data) => {
          if (!editingProp) return
          await updateProp(editingProp.id, data)
          handleAssetSaved()
        }}
      />
    </div>
  )
}
