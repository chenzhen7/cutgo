"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Copy, Trash2, User, MapPin, Package, ImageIcon, Loader2, Paintbrush, Video, Play, Type, Film } from "lucide-react"
import { SHOT_SIZE_OPTIONS, CAMERA_MOVEMENT_OPTIONS, CAMERA_ANGLE_OPTIONS, IMAGE_TYPE_OPTIONS } from "@/lib/types"
import type { Shot, AssetCharacter, AssetScene, AssetProp } from "@/lib/types"

function parseJsonArray(value: string | null): string[] {
  if (!value) return []
  try { return JSON.parse(value) } catch { return [] }
}

const ALL_KEYWORDS = [
  ...SHOT_SIZE_OPTIONS.map((o) => o.label),
  ...CAMERA_MOVEMENT_OPTIONS.map((o) => o.label),
  ...CAMERA_ANGLE_OPTIONS.map((o) => o.label),
]

function matchKeywords(text: string): string[] {
  if (!text) return []
  return ALL_KEYWORDS.filter((kw) => text.includes(kw))
}

export type ShotCardDisplayMode = "composition" | "prompts"

interface ShotCardProps {
  shot: Shot
  isActive: boolean
  isSelected: boolean
  isGeneratingImage: boolean
  isGeneratingVideo: boolean
  displayMode: ShotCardDisplayMode
  assetCharacters: AssetCharacter[]
  assetScenes: AssetScene[]
  assetProps: AssetProp[]
  onSelect: () => void
  onDuplicate: () => void
  onDelete: () => void
  onGenerateImage: () => void
  onGenerateVideo: () => void
  onPlayVideo?: () => void
}

function VideoOverlay({ shot, isGeneratingVideo, onPlayVideo }: { shot: Shot; isGeneratingVideo: boolean; onPlayVideo?: () => void }) {
  const hasVideo = !!shot.videoUrl

  if (isGeneratingVideo) {
    return (
      <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-lg z-10">
        <div className="flex flex-col items-center gap-1">
          <Loader2 className="size-5 animate-spin text-violet-400" />
          <span className="text-[8px] text-white/80">生成视频</span>
        </div>
      </div>
    )
  }

  if (hasVideo) {
    return (
      <>
        <div className="absolute bottom-1 left-1 z-10 bg-violet-600/80 text-white text-[8px] px-1.5 py-0.5 rounded flex items-center gap-0.5">
          <Video className="size-2.5" />
          {shot.videoDuration || "5s"}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onPlayVideo?.() }}
          className="absolute inset-0 z-10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/30 rounded-lg"
        >
          <div className="size-8 rounded-full bg-white/90 flex items-center justify-center">
            <Play className="size-4 text-violet-600 ml-0.5" />
          </div>
        </button>
      </>
    )
  }

  return null
}

function ShotThumbnail({ shot, isGeneratingImage, isGeneratingVideo, onPlayVideo }: { shot: Shot; isGeneratingImage: boolean; isGeneratingVideo: boolean; onPlayVideo?: () => void }) {
  const imageType = shot.imageType || "keyframe"
  const hasImage = !!shot.imageUrl
  const imageUrls = useMemo(() => parseJsonArray(shot.imageUrls), [shot.imageUrls])
  const typeLabel = IMAGE_TYPE_OPTIONS.find((o) => o.value === imageType)?.label || "关键帧"

  if (isGeneratingImage) {
    return (
      <div className="relative size-[76px] rounded-lg bg-muted/50 flex items-center justify-center shrink-0 overflow-hidden sm:size-[88px] md:size-[92px] lg:size-[100px] xl:size-[108px] 2xl:size-[116px]">
        <Loader2 className="size-3.5 animate-spin text-primary md:size-[18px] 2xl:size-5" />
        <span className="absolute bottom-1 text-[8px] text-muted-foreground 2xl:text-[9px]">{typeLabel}</span>
      </div>
    )
  }

  if (!hasImage) {
    return (
      <div className="relative size-[76px] rounded-lg bg-muted/30 border border-dashed border-muted-foreground/15 flex flex-col items-center justify-center shrink-0 gap-1 sm:size-[88px] md:size-[92px] md:gap-1.5 lg:size-[100px] xl:size-[108px] 2xl:size-[116px]">
        <ImageIcon className="size-3.5 text-muted-foreground/25 md:size-[18px] 2xl:size-5" />
        <span className="text-[8px] text-muted-foreground/40 2xl:text-[9px]">{typeLabel}</span>
      </div>
    )
  }

  if (imageType === "first_last" && imageUrls.length >= 2) {
    return (
      <div className="relative h-[76px] w-[76px] rounded-lg overflow-hidden shrink-0 flex flex-col gap-0.5 sm:h-[88px] sm:w-[88px] md:h-[92px] md:w-[92px] lg:h-[100px] lg:w-[100px] xl:h-[108px] xl:w-[108px] 2xl:h-[116px] 2xl:w-[116px]">
        <img src={imageUrls[0]} alt="首帧" className="h-[37px] w-full object-cover rounded-t-lg sm:h-[43px] md:h-[45px] lg:h-[49px] xl:h-[53px] 2xl:h-[57px]" />
        <img src={imageUrls[1]} alt="尾帧" className="h-[37px] w-full object-cover rounded-b-lg sm:h-[43px] md:h-[45px] lg:h-[49px] xl:h-[53px] 2xl:h-[57px]" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/40 text-white text-[8px] px-1.5 py-0.5 rounded">首尾帧</div>
        </div>
        <VideoOverlay shot={shot} isGeneratingVideo={isGeneratingVideo} onPlayVideo={onPlayVideo} />
      </div>
    )
  }

  if (imageType === "multi_grid") {
    return (
      <div className="relative size-[76px] rounded-lg overflow-hidden shrink-0 sm:size-[88px] md:size-[92px] lg:size-[100px] xl:size-[108px] 2xl:size-[116px]">
        <img src={shot.imageUrl!} alt="多宫格" className="size-full object-cover" />
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.3) 1px, transparent 1px)",
          backgroundSize: "50% 50%",
        }} />
        <div className="absolute bottom-1 right-1 bg-black/40 text-white text-[8px] px-1.5 py-0.5 rounded">
          {shot.gridLayout || "2x2"}
        </div>
        <VideoOverlay shot={shot} isGeneratingVideo={isGeneratingVideo} onPlayVideo={onPlayVideo} />
      </div>
    )
  }

  return (
    <div className="relative size-[76px] rounded-lg overflow-hidden shrink-0 sm:size-[88px] md:size-[92px] lg:size-[100px] xl:size-[108px] 2xl:size-[116px]">
      <img src={shot.imageUrl!} alt="关键帧" className="size-full object-cover" />
      <VideoOverlay shot={shot} isGeneratingVideo={isGeneratingVideo} onPlayVideo={onPlayVideo} />
    </div>
  )
}

export function ShotCard({
  shot,
  isActive,
  isSelected,
  isGeneratingImage,
  isGeneratingVideo,
  displayMode,
  assetCharacters,
  assetScenes,
  assetProps,
  onSelect,
  onDuplicate,
  onDelete,
  onGenerateImage,
  onGenerateVideo,
  onPlayVideo,
}: ShotCardProps) {
  const matchedTags = useMemo(() => matchKeywords(shot.composition), [shot.composition])

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

  const hasAssets = boundCharacters.length > 0 || boundScene || boundProps.length > 0

  return (
    <div
      onClick={onSelect}
      className={cn(
        "group relative rounded-xl border bg-card p-1.5 cursor-pointer transition-all hover:shadow-md hover:border-border/80 flex gap-1.5 sm:gap-2.5 sm:p-2.5 lg:gap-3 lg:p-3 xl:gap-3.5 xl:p-3.5 2xl:gap-4 2xl:p-4",
        isActive && "ring-2 ring-primary border-primary shadow-sm bg-primary/[0.02]",
        isSelected && !isActive && "ring-2 ring-blue-400 border-blue-400"
      )}
    >
      {/* Left: Thumbnail */}
      <ShotThumbnail shot={shot} isGeneratingImage={isGeneratingImage} isGeneratingVideo={isGeneratingVideo} onPlayVideo={onPlayVideo} />

      {/* Center: Index + Content */}
      <div className="flex-1 min-w-0 flex gap-1 sm:gap-2 lg:gap-2.5">
        <div className="flex flex-col items-center shrink-0">
          <div className={cn(
            "size-[18px] rounded-lg flex items-center justify-center text-[7px] font-bold transition-colors sm:size-[22px] sm:text-[9px] lg:size-6 lg:text-[10px] 2xl:size-[26px]",
            isActive
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground group-hover:bg-muted/80"
          )}>
            {shot.index + 1}
          </div>
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-1 sm:gap-1.5 2xl:gap-2">
          {displayMode === "composition" ? (
            <p className={cn(
              "text-[10px] leading-relaxed line-clamp-4 sm:text-[12px] 2xl:text-[13px]",
              shot.composition ? "text-foreground font-medium" : "text-muted-foreground/60 italic"
            )}>
              {shot.composition || "暂无画面描述"}
            </p>
          ) : (
            <div className="flex flex-col gap-1.5 sm:gap-2">
              <div className="flex items-start gap-1.5">
                <Badge variant="outline" className="text-[6px] px-1 py-0 shrink-0 mt-0.5 bg-blue-500/5 text-blue-600 dark:text-blue-400 border-blue-500/20 sm:text-[8px] sm:px-1.5 2xl:text-[9px]">
                  <Type className="size-2.5 mr-0.5" />
                  生图
                </Badge>
                <p className="text-[7px] text-muted-foreground line-clamp-3 leading-relaxed sm:text-[9px] 2xl:text-[10px]">
                  {shot.prompt || "暂无生图提示词"}
                </p>
              </div>
              <div className="flex items-start gap-1.5">
                <Badge variant="outline" className="text-[6px] px-1 py-0 shrink-0 mt-0.5 bg-violet-500/5 text-violet-600 dark:text-violet-400 border-violet-500/20 sm:text-[8px] sm:px-1.5 2xl:text-[9px]">
                  <Film className="size-2.5 mr-0.5" />
                  视频
                </Badge>
                <p className="text-[7px] text-muted-foreground line-clamp-3 leading-relaxed sm:text-[9px] 2xl:text-[10px]">
                  {shot.videoPrompt || "暂无视频提示词"}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {matchedTags.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap sm:gap-1.5">
                {matchedTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-[6px] font-normal px-1 py-0 rounded-full bg-muted/60 sm:text-[8px] sm:px-1.5 2xl:text-[9px]"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {matchedTags.length > 0 && hasAssets && (
              <div className="w-px h-3 bg-border shrink-0" />
            )}

            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              {boundCharacters.length > 0 && (
                <TooltipProvider delayDuration={200}>
                  <div className="flex items-center -space-x-1 sm:-space-x-1.5">
                    {boundCharacters.slice(0, 5).map((c) => (
                      <Tooltip key={c.id}>
                        <TooltipTrigger asChild>
                          <div className="size-3.5 rounded-full bg-muted border-2 border-card flex items-center justify-center overflow-hidden shrink-0 sm:size-[18px] 2xl:size-5">
                            {c.imageUrl ? (
                              <img src={c.imageUrl} alt={c.name} className="size-full object-cover" />
                            ) : (
                              <User className="size-2 text-muted-foreground sm:size-3" />
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">{c.name}</TooltipContent>
                      </Tooltip>
                    ))}
                    {boundCharacters.length > 5 && (
                      <div className="size-3.5 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[6px] text-muted-foreground font-medium shrink-0 sm:size-[18px] sm:text-[8px] 2xl:size-5">
                        +{boundCharacters.length - 5}
                      </div>
                    )}
                  </div>
                </TooltipProvider>
              )}

              {boundScene && (
                <span className="inline-flex items-center gap-1 text-[7px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-full px-1 py-0.5 font-medium sm:text-[9px] sm:px-1.5 2xl:text-[10px]">
                  <MapPin className="size-2 shrink-0 sm:size-3" />
                  {boundScene.name}
                </span>
              )}

              {boundProps.length > 0 && (
                <span className="inline-flex items-center gap-1 text-[7px] bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-full px-1 py-0.5 font-medium sm:text-[9px] sm:px-1.5 2xl:text-[10px]">
                  <Package className="size-2 shrink-0 sm:size-3" />
                  {boundProps.length === 1
                    ? boundProps[0].name
                    : `${boundProps[0].name} +${boundProps.length - 1}`}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex flex-col items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); onGenerateImage() }}
          className="rounded-lg p-1 sm:p-2 hover:bg-primary/10 transition-colors"
          title={shot.imageUrl ? "重新生成画面" : "生成画面"}
        >
          <Paintbrush className="size-2.5 text-primary/70 hover:text-primary sm:size-3.5" />
        </button>
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={(e) => { e.stopPropagation(); if (shot.imageUrl) onGenerateVideo() }}
                className={cn(
                  "rounded-lg p-1 transition-colors sm:p-2",
                  shot.imageUrl
                    ? "hover:bg-violet-500/10"
                    : "opacity-40 cursor-not-allowed"
                )}
                title={shot.videoUrl ? "重新生成视频" : "生成视频"}
                disabled={!shot.imageUrl || isGeneratingVideo}
              >
                <Video className={cn(
                  "size-2.5 sm:size-3.5",
                  shot.imageUrl ? "text-violet-500/70 hover:text-violet-500" : "text-muted-foreground/40"
                )} />
              </button>
            </TooltipTrigger>
            {!shot.imageUrl && (
              <TooltipContent side="left" className="text-xs">请先生成画面</TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
        <button
          onClick={(e) => { e.stopPropagation(); onDuplicate() }}
          className="rounded-lg p-1 hover:bg-muted transition-colors sm:p-2"
          title="复制"
        >
          <Copy className="size-2.5 text-muted-foreground hover:text-foreground sm:size-3.5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="rounded-lg p-1 hover:bg-destructive/10 transition-colors sm:p-2"
          title="删除"
        >
          <Trash2 className="size-2.5 text-destructive/70 hover:text-destructive sm:size-3.5" />
        </button>
      </div>
    </div>
  )
}
