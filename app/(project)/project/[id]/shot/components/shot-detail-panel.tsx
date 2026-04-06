"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
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
  Paintbrush,
  Loader2,
  ImageIcon,
  Trash2,
  Video,
  Play,
  Pause,
  Maximize2,
} from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { cn, parseJsonArray } from "@/lib/utils"
import { IMAGE_TYPE_OPTIONS, GRID_LAYOUT_OPTIONS } from "@/lib/types"
import type { Shot, ScriptShotPlan, ShotInput, AssetCharacter, AssetScene, AssetProp, ImageType, GridLayout } from "@/lib/types"
import { PreviewableImage } from "@/components/ui/previewable-image"
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

interface ShotDetailPanelProps {
  shot: Shot
  scriptShotPlan: ScriptShotPlan
  episodeDisplayNumber: number
  aspectRatio?: string
  isGeneratingImage: boolean
  isGeneratingVideo: boolean
  assetCharacters: AssetCharacter[]
  assetScenes: AssetScene[]
  assetProps: AssetProp[]
  onUpdate: (episodeId: string, shotId: string, data: Partial<ShotInput>) => void
  onGenerateImage: () => void
  onClearImage: () => void
  onGenerateVideo: () => void
  onClearVideo: () => void
  onPlayVideo?: () => void
  onPrev: (() => void) | null
  onNext: (() => void) | null
  onClose: () => void
}

export function ShotDetailPanel({
  shot,
  scriptShotPlan,
  episodeDisplayNumber,
  aspectRatio = "9:16",
  isGeneratingImage,
  isGeneratingVideo,
  assetCharacters,
  assetScenes,
  assetProps,
  onUpdate,
  onGenerateImage,
  onClearImage,
  onGenerateVideo,
  onClearVideo,
  onPlayVideo,
  onPrev,
  onNext,
  onClose,
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

  const [activeTab, setActiveTab] = useState<"image" | "video">("image")
  const [content, setContent] = useState(shot.content || "")
  const [prompt, setPrompt] = useState(shot.prompt || "")
  const [promptEnd, setPromptEnd] = useState(shot.promptEnd || "")
  const [gridPrompts, setGridPrompts] = useState<string[]>([])
  const [videoPrompt, setVideoPrompt] = useState(shot.videoPrompt || "")
  const [videoDuration, setVideoDuration] = useState<string>(shot.videoDuration?.toString() || "5")
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const videoRef = useCallback((node: HTMLVideoElement | null) => {
    if (node) {
      node.onplay = () => setIsVideoPlaying(true)
      node.onpause = () => setIsVideoPlaying(false)
      node.onended = () => setIsVideoPlaying(false)
    }
  }, [])

  useEffect(() => {
    setContent(shot.content || "")
    setPrompt(shot.prompt || "")
    setPromptEnd(shot.promptEnd || "")
    setVideoPrompt(shot.videoPrompt || "")
    setVideoDuration(shot.videoDuration?.toString() || "5")
    try {
      setGridPrompts(shot.gridPrompts ? JSON.parse(shot.gridPrompts) : [])
    } catch {
      setGridPrompts([])
    }
  }, [shot.id, shot.content, shot.prompt, shot.promptEnd, shot.gridPrompts, shot.videoDuration, shot.videoPrompt])

  const updateShotData = useCallback(
    (data: Partial<ShotInput>) => {
      onUpdate(scriptShotPlan.episodeId, shot.id, data)
    },
    [onUpdate, scriptShotPlan.episodeId, shot.id]
  )

  const debouncedUpdate = useMemo(
    () => {
      let timer: NodeJS.Timeout
      return (data: Partial<ShotInput>) => {
        clearTimeout(timer)
        timer = setTimeout(() => {
          onUpdate(scriptShotPlan.episodeId, shot.id, data)
        }, 500)
      }
    },
    [onUpdate, scriptShotPlan.episodeId, shot.id]
  )

  const boundCharacterIds = useMemo(() => parseJsonArray(shot.characterIds), [shot.characterIds])
  const boundPropIds = useMemo(() => parseJsonArray(shot.propIds), [shot.propIds])

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
    updateShotData({ characterIds: next.length > 0 ? JSON.stringify(next) : undefined })
  }

  const handleChangeScene = (sceneId: string) => {
    setScenePopoverOpen(false)
    // 延迟更新数据，让弹窗先关闭，减少卡顿感
    setTimeout(() => {
      updateShotData({ sceneId: sceneId === "__none__" ? undefined : sceneId })
    }, 100)
  }

  const handleToggleProp = (propId: string) => {
    const next = toggleItem(boundPropIds, propId)
    updateShotData({ propIds: next.length > 0 ? JSON.stringify(next) : undefined })
  }

  const handleImageTypeChange = (type: string) => {
    updateShotData({ imageType: type as ImageType })
  }

  const handleGridLayoutChange = (layout: string) => {
    const layoutOpt = GRID_LAYOUT_OPTIONS.find((o) => o.value === layout)
    if (!layoutOpt) return
    const currentPrompts = gridPrompts.length > 0 ? gridPrompts : []
    const newPrompts = Array.from({ length: layoutOpt.count }, (_, i) => currentPrompts[i] || "")
    setGridPrompts(newPrompts)
    updateShotData({
      gridLayout: layout as GridLayout,
      gridPrompts: JSON.stringify(newPrompts),
    })
  }

  const handleGridPromptChange = (index: number, value: string) => {
    const newPrompts = [...gridPrompts]
    newPrompts[index] = value
    setGridPrompts(newPrompts)
    debouncedUpdate({ gridPrompts: JSON.stringify(newPrompts) })
  }

  const imageType = shot.imageType || "keyframe"
  const imageUrls = useMemo(() => parseJsonArray(shot.imageUrls), [shot.imageUrls])
  const hasImage = !!shot.imageUrl
  const episode = scriptShotPlan.episode
  const currentGridLayout = GRID_LAYOUT_OPTIONS.find((o) => o.value === (shot.gridLayout || "2x2")) || GRID_LAYOUT_OPTIONS[0]

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
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "image" | "video")} className="gap-3">
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
          <TabsContent value="image" className={cn(aspectRatio === "9:16" ? "flex gap-4 items-start" : "flex flex-col gap-4")}>

            {/* Left Column (9:16) / Top Section (16:9) */}
            <div className={cn("flex flex-col gap-3", aspectRatio === "9:16" ? "w-[240px] shrink-0 sticky top-0" : "w-full")}>
              {/* Image preview */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">画面预览</Label>
                  {hasImage && (
                    <button onClick={onClearImage} className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-0.5">
                      <Trash2 className="size-3" />清除
                    </button>
                  )}
                </div>

                {isGeneratingImage ? (
                  <div className={cn("w-full rounded-lg bg-muted/50 flex flex-col items-center justify-center gap-2", aspectRatio === "16:9" ? "aspect-video max-h-[300px]" : "aspect-[9/16] max-h-[420px]")}>
                    <Loader2 className="size-6 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground">生成中...</span>
                  </div>
                ) : imageType === "first_last" && imageUrls.length >= 2 ? (
                  <div className="flex gap-2">
                    <div className="flex-1 space-y-1">
                      <span className="text-[10px] text-muted-foreground font-medium">首帧</span>
                      <div className="w-full rounded-lg border bg-muted/20 p-1 flex items-center justify-center">
                        <PreviewableImage src={imageUrls[0]} alt="首帧" className={cn("h-auto w-auto max-w-full rounded-md", aspectRatio === "16:9" ? "max-h-[300px]" : "max-h-[210px]")} />
                      </div>
                    </div>
                    <div className="flex-1 space-y-1">
                      <span className="text-[10px] text-muted-foreground font-medium">尾帧</span>
                      <div className="w-full rounded-lg border bg-muted/20 p-1 flex items-center justify-center">
                        <PreviewableImage src={imageUrls[1]} alt="尾帧" className={cn("h-auto w-auto max-w-full rounded-md", aspectRatio === "16:9" ? "max-h-[300px]" : "max-h-[210px]")} />
                      </div>
                    </div>
                  </div>
                ) : hasImage ? (
                  <div className="w-full rounded-lg border bg-muted/20 p-1 flex items-center justify-center">
                    <PreviewableImage src={shot.imageUrl!} alt="画面预览" className={cn("h-auto w-auto max-w-full rounded-md", aspectRatio === "16:9" ? "max-h-[300px]" : "max-h-[420px]")} />
                  </div>
                ) : (
                  <div className={cn("w-full rounded-lg border border-dashed border-muted-foreground/15 bg-muted/20 flex flex-col items-center justify-center gap-2", aspectRatio === "16:9" ? "aspect-video max-h-[200px]" : "aspect-[9/16] max-h-[420px]")}>
                    <ImageIcon className="size-8 text-muted-foreground/20" />
                    <span className="text-xs text-muted-foreground/40">暂无画面</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column (9:16) / Bottom Section (16:9) */}
            <div className={cn("space-y-4", aspectRatio === "9:16" ? "flex-1 min-w-0" : "w-full")}>

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
                                    {s.imageUrl ? (
                                      <PreviewableImage src={s.imageUrl} alt="" className="size-5 rounded object-cover shrink-0" />
                                    ) : (
                                      <div className="size-5 rounded bg-muted-foreground/10 flex items-center justify-center shrink-0">
                                        <MapPin className="size-3.5 text-muted-foreground" />
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
                      <button
                        onClick={() => setEditingScene(boundScene)}
                        className="w-full rounded-lg overflow-hidden border bg-muted/30 hover:ring-2 hover:ring-primary/40 transition-all text-left"
                        title={`编辑 ${boundScene.name}`}
                      >
                        {boundScene.imageUrl ? (
                          <img
                            src={boundScene.imageUrl}
                            alt={boundScene.name}
                            className="w-full h-16 object-cover"
                          />
                        ) : (
                          <div className="w-full h-12 flex items-center justify-center bg-muted/50">
                            <MapPin className="size-4 text-muted-foreground/20" />
                          </div>
                        )}
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
                                    {c.imageUrl ? (
                                      <img src={c.imageUrl} alt="" className="size-5 rounded-full object-cover shrink-0" />
                                    ) : (
                                      <div className="size-5 rounded-full bg-muted-foreground/10 flex items-center justify-center shrink-0">
                                        <User className="size-3.5 text-muted-foreground" />
                                      </div>
                                    )}
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
                              {c.imageUrl ? (
                                <img src={c.imageUrl} alt={c.name} className="size-full object-cover" />
                              ) : (
                                <div className="size-full flex items-center justify-center">
                                  <User className="size-4 text-muted-foreground/40" />
                                </div>
                              )}
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
                                    {p.imageUrl ? (
                                      <img src={p.imageUrl} alt="" className="size-5 rounded object-cover shrink-0" />
                                    ) : (
                                      <div className="size-5 rounded bg-muted-foreground/10 flex items-center justify-center shrink-0">
                                        <Package className="size-3.5 text-muted-foreground" />
                                      </div>
                                    )}
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
                              {p.imageUrl ? (
                                <img src={p.imageUrl} alt={p.name} className="size-full object-cover" />
                              ) : (
                                <div className="size-full flex items-center justify-center">
                                  <Package className="size-4 text-muted-foreground/40" />
                                </div>
                              )}
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
                  className="text-[13px] min-h-[60px] max-h-[120px] leading-relaxed"
                  placeholder="描述该镜头的剧情内容与画面意图（给人看的描述）..."
                />
              </div>

              {/* Prompts by Type */}
              {imageType === "first_last" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Label className="text-xs">首帧提示词</Label>
                      <Badge variant="outline" className="text-[8px] px-1 py-0">prompt</Badge>
                    </div>
                    <Textarea
                      value={prompt}
                      onChange={(e) => {
                        setPrompt(e.target.value)
                        debouncedUpdate({ prompt: e.target.value })
                      }}
                      className="text-[13px] h-[120px] leading-relaxed"
                      placeholder="描述该镜头的首帧提示词（英文）..."
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Label className="text-xs">尾帧提示词</Label>
                      <Badge variant="outline" className="text-[8px] px-1 py-0">promptEnd</Badge>
                    </div>
                    <Textarea
                      value={promptEnd}
                      onChange={(e) => {
                        setPromptEnd(e.target.value)
                        debouncedUpdate({ promptEnd: e.target.value })
                      }}
                      className="text-[13px] h-[120px] leading-relaxed"
                      placeholder="描述镜头结束时的画面（英文），留空则与首帧相同..."
                    />
                  </div>
                </div>
              )}

              {imageType === "multi_grid" && (
                <div className="space-y-3">
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
                  <div className="grid grid-cols-2 gap-2">
                    {Array.from({ length: currentGridLayout.count }).map((_, i) => (
                      <div key={i} className="space-y-1">
                        <span className="text-[10px] text-muted-foreground font-medium">格 {i + 1}</span>
                        <Textarea
                          value={gridPrompts[i] || ""}
                          onChange={(e) => handleGridPromptChange(i, e.target.value)}
                          className="text-xs h-[40px]"
                          placeholder={`第 ${i + 1} 格画面提示词...`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Image prompt */}
              {imageType !== "first_last" && imageType !== "multi_grid" && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Label className="text-xs">分镜提示词</Label>
                    <Badge variant="outline" className="text-[8px] px-1 py-0">prompt</Badge>
                  </div>
                  <Textarea
                    value={prompt}
                    onChange={(e) => {
                      setPrompt(e.target.value)
                      debouncedUpdate({ prompt: e.target.value })
                    }}
                    className="text-[13px] min-h-[80px] max-h-[160px]  leading-relaxed"
                    placeholder="描述该镜头的分镜提示词（英文）..."
                  />
                </div>
              )}

              <Button
                size="sm"
                className="w-full text-xs"
                onClick={onGenerateImage}
                disabled={isGeneratingImage}
              >
                {isGeneratingImage ? (
                  <Loader2 className="size-3 mr-1.5 animate-spin" />
                ) : (
                  <Paintbrush className="size-3 mr-1.5" />
                )}
                {hasImage ? "重新生成" : "生成画面"}
              </Button>
            </div>
          </TabsContent>

          {/* === Video Generation Tab === */}
          <TabsContent value="video" className={cn(aspectRatio === "9:16" ? "flex gap-4 items-start" : "flex flex-col gap-4")}>

            {/* Left Column (9:16) / Top Section (16:9) */}
            <div className={cn("flex flex-col gap-3", aspectRatio === "9:16" ? "w-[240px] shrink-0 sticky top-0" : "w-full")}>
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Video className="size-3.5 text-violet-500" />
                  视频预览
                </Label>
                {shot.videoUrl && (
                  <button onClick={onClearVideo} className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-0.5">
                    <Trash2 className="size-3" />清除
                  </button>
                )}
              </div>

              {isGeneratingVideo ? (
                <div className={cn("w-full rounded-lg bg-violet-500/5 border border-violet-500/20 flex flex-col items-center justify-center gap-2", aspectRatio === "16:9" ? "aspect-video max-h-[300px]" : "aspect-[9/16] max-h-[420px]")}>
                  <Loader2 className="size-6 animate-spin text-violet-500" />
                  <span className="text-xs text-violet-600 dark:text-violet-400">视频生成中...</span>
                  <span className="text-[10px] text-muted-foreground">预计需要 30-60 秒</span>
                </div>
              ) : shot.videoUrl ? (
                <div className="relative w-full rounded-lg overflow-hidden border group/video">
                  <video
                    ref={videoRef}
                    src={shot.videoUrl}
                    className={cn("w-full object-contain bg-black", aspectRatio === "16:9" ? "aspect-video max-h-[300px]" : "aspect-[9/16] max-h-[420px]")}
                    loop
                    playsInline
                    muted
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/video:opacity-100 transition-opacity bg-black/20">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        const video = (e.currentTarget.parentElement?.parentElement?.querySelector("video"))
                        if (video) {
                          if (video.paused) video.play()
                          else video.pause()
                        }
                      }}
                      className="size-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg"
                    >
                      {isVideoPlaying ? (
                        <Pause className="size-5 text-violet-600" />
                      ) : (
                        <Play className="size-5 text-violet-600 ml-0.5" />
                      )}
                    </button>
                  </div>
                  {onPlayVideo && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onPlayVideo() }}
                      className="absolute top-2 right-2 size-7 rounded-md bg-black/50 flex items-center justify-center opacity-0 group-hover/video:opacity-100 transition-opacity hover:bg-black/70"
                    >
                      <Maximize2 className="size-3.5 text-white" />
                    </button>
                  )}
                  <div className="absolute bottom-2 left-2 bg-violet-600/80 text-white text-[9px] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                    <Video className="size-2.5" />
                    {shot.videoDuration ? `${shot.videoDuration}s` : "5s"}
                  </div>
                </div>
              ) : (
                <div className={cn("w-full rounded-lg border border-dashed border-violet-500/20 bg-violet-500/[0.02] flex flex-col items-center justify-center gap-2", aspectRatio === "16:9" ? "aspect-video max-h-[260px]" : "aspect-[9/16] max-h-[420px]")}>
                  <Video className="size-8 text-violet-500/20" />
                  <span className="text-xs text-muted-foreground/40">暂无视频</span>
                </div>
              )}
            </div>

            {/* Right Column (9:16) / Bottom Section (16:9) */}
            <div className={cn("space-y-4", aspectRatio === "9:16" ? "flex-1 min-w-0" : "w-full")}>

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

              {/* Video prompt */}
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Label className="text-xs">视频提示词</Label>
                  <Badge variant="outline" className="text-[8px] px-1 py-0">videoPrompt</Badge>
                </div>
                <Textarea
                  value={videoPrompt}
                  onChange={(e) => {
                    setVideoPrompt(e.target.value)
                    debouncedUpdate({ videoPrompt: e.target.value })
                  }}
                  className="text-[13px] min-h-[60px] max-h-[120px]  leading-relaxed"
                  placeholder="描述视频运动效果和转场（英文），留空则自动生成..."
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] text-muted-foreground mb-1 block">视频时长(秒)</Label>
                  <Input
                    value={videoDuration}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || /^\d+(\.\d*)?$/.test(val)) {
                        setVideoDuration(val);
                        debouncedUpdate({ videoDuration: val ? parseFloat(val) : undefined });
                      }
                    }}
                    placeholder="如: 5"
                    className="h-7 text-xs"
                  />
                </div>

              </div>

              <Button
                size="sm"
                className="w-full text-xs bg-violet-600 hover:bg-violet-700 text-white"
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
        character={editingCharacter}
        onSave={async (data) => {
          if (!editingCharacter) return
          await updateCharacter(editingCharacter.id, data)
          setEditingCharacter(null)
          handleAssetSaved()
        }}
      />
      <SceneFormDialog
        open={!!editingScene}
        onOpenChange={(open) => { if (!open) setEditingScene(null) }}
        scene={editingScene}
        onSave={async (data) => {
          if (!editingScene) return
          await updateScene(editingScene.id, data)
          setEditingScene(null)
          handleAssetSaved()
        }}
      />
      <PropFormDialog
        open={!!editingProp}
        onOpenChange={(open) => { if (!open) setEditingProp(null) }}
        prop={editingProp}
        onSave={async (data) => {
          if (!editingProp) return
          await updateProp(editingProp.id, data)
          setEditingProp(null)
          handleAssetSaved()
        }}
      />
    </div>
  )
}
