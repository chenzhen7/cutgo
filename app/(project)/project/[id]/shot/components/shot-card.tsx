"use client"

import { memo, useCallback, useMemo } from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Copy, Trash2, User, MapPin, Package, ImageIcon, Loader2, Paintbrush, Video, Play, Type, Film, GripVertical } from "lucide-react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { IMAGE_TYPE_OPTIONS } from "@/lib/types"
import type { Shot, AssetCharacter, AssetScene, AssetProp } from "@/lib/types"

function parseJsonArray(value: string | null): string[] {
  if (!value) return []
  try { return JSON.parse(value) } catch { return [] }
}

export type ShotCardLayout = "list" | "grid"

interface ShotCardProps {
  shot: Shot
  episodeId: string
  isActive: boolean
  isSelected: boolean
  isGeneratingImage: boolean
  isGeneratingVideo: boolean
  layout?: ShotCardLayout
  isDragging?: boolean
  assetCharacters: AssetCharacter[]
  assetScenes: AssetScene[]
  assetProps: AssetProp[]
  onSelect: (shotId: string) => void
  onDuplicate: (episodeId: string, shotId: string) => void
  onDelete: (episodeId: string, shotId: string) => void
  onGenerateImage: (episodeId: string, shotId: string) => void
  onGenerateVideo: (episodeId: string, shotId: string) => void
  onPlayVideo: (shotId: string) => void
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
      <div className="relative size-[92px] rounded-lg bg-muted/50 flex items-center justify-center shrink-0 overflow-hidden @[640px]:size-[100px] @[900px]:size-[116px]">
        <Loader2 className="size-[18px] animate-spin text-primary @[900px]:size-5" />
        <span className="absolute bottom-1 text-[8px] text-muted-foreground @[900px]:text-[9px]">{typeLabel}</span>
      </div>
    )
  }

  if (!hasImage) {
    return (
      <div className="relative size-[92px] rounded-lg bg-muted/30 border border-dashed border-muted-foreground/15 flex flex-col items-center justify-center shrink-0 gap-1.5 @[640px]:size-[100px] @[900px]:size-[116px]">
        <ImageIcon className="size-[18px] text-muted-foreground/25 @[900px]:size-5" />
        <span className="text-[8px] text-muted-foreground/40 @[900px]:text-[9px]">{typeLabel}</span>
      </div>
    )
  }

  if (imageType === "first_last" && imageUrls.length >= 2) {
    return (
      <div className="relative h-[92px] w-[92px] rounded-lg overflow-hidden shrink-0 flex flex-col gap-0.5 @[640px]:h-[100px] @[640px]:w-[100px] @[900px]:h-[116px] @[900px]:w-[116px]">
        <img src={imageUrls[0]} alt="首帧" className="h-[45px] w-full object-cover rounded-t-lg @[640px]:h-[49px] @[900px]:h-[57px]" />
        <img src={imageUrls[1]} alt="尾帧" className="h-[45px] w-full object-cover rounded-b-lg @[640px]:h-[49px] @[900px]:h-[57px]" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/40 text-white text-[8px] px-1.5 py-0.5 rounded">首尾帧</div>
        </div>
        <VideoOverlay shot={shot} isGeneratingVideo={isGeneratingVideo} onPlayVideo={onPlayVideo} />
      </div>
    )
  }

  if (imageType === "multi_grid") {
    return (
      <div className="relative size-[92px] rounded-lg overflow-hidden shrink-0 @[640px]:size-[100px] @[900px]:size-[116px]">
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
    <div className="relative size-[92px] rounded-lg overflow-hidden shrink-0 @[640px]:size-[100px] @[900px]:size-[116px]">
      <img src={shot.imageUrl!} alt="关键帧" className="size-full object-cover" />
      <VideoOverlay shot={shot} isGeneratingVideo={isGeneratingVideo} onPlayVideo={onPlayVideo} />
    </div>
  )
}

export const ShotCard = memo(function ShotCard({
  shot,
  episodeId,
  isActive,
  isSelected,
  isGeneratingImage,
  isGeneratingVideo,
  layout = "list",
  isDragging = false,
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
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: shot.id })
  const handleSelect = useCallback(() => onSelect(shot.id), [onSelect, shot.id])
  const handleDuplicate = useCallback(() => onDuplicate(episodeId, shot.id), [onDuplicate, episodeId, shot.id])
  const handleDelete = useCallback(() => onDelete(episodeId, shot.id), [onDelete, episodeId, shot.id])
  const handleGenerateImage = useCallback(() => onGenerateImage(episodeId, shot.id), [onGenerateImage, episodeId, shot.id])
  const handleGenerateVideo = useCallback(() => onGenerateVideo(episodeId, shot.id), [onGenerateVideo, episodeId, shot.id])
  const handlePlayVideo = useCallback(() => onPlayVideo(shot.id), [onPlayVideo, shot.id])
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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.4 : 1,
    zIndex: isSortableDragging ? 50 : undefined,
  }

  if (layout === "grid") {
    return (
      <div
        ref={setNodeRef}
        style={style}
        onClick={handleSelect}
        className={cn(
          "group relative rounded-xl border bg-card cursor-pointer hover:shadow-md hover:border-border/80 flex flex-col overflow-hidden",
          !isSortableDragging && "transition-all",
          isActive && "ring-2 ring-primary border-primary shadow-sm bg-primary/[0.02]",
          isSelected && !isActive && "ring-2 ring-blue-400 border-blue-400",
          isDragging && "shadow-2xl ring-2 ring-primary/50"
        )}
      >
        {/* Thumbnail — 正方形 */}
        <div className="relative w-full aspect-square bg-muted/30 overflow-hidden">
          {isGeneratingImage ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
              <Loader2 className="size-5 animate-spin text-primary" />
              <span className="text-[8px] text-muted-foreground">生成中</span>
            </div>
          ) : shot.imageUrl ? (
            <img src={shot.imageUrl} alt="分镜" className="size-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
              <ImageIcon className="size-6 text-muted-foreground/25" />
            </div>
          )}

          {/* Video overlay */}
          <VideoOverlay shot={shot} isGeneratingVideo={isGeneratingVideo} onPlayVideo={handlePlayVideo} />

          {/* Index badge */}
          <div className={cn(
            "absolute top-1.5 left-1.5 size-5 rounded-md flex items-center justify-center text-[9px] font-bold z-20",
            isActive
              ? "bg-primary text-primary-foreground"
              : "bg-black/50 text-white"
          )}>
            {shot.index + 1}
          </div>

          {/* Drag handle */}
          <div
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-1.5 left-1.5 z-20 rounded-lg p-1.5 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
            title="拖拽排序"
          >
            <GripVertical className="size-3.5 text-muted-foreground/40 hover:text-muted-foreground" />
          </div>

          {/* Hover actions */}
          <div className="absolute top-1.5 right-1.5 z-20 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all">
            <button
              onClick={(e) => { e.stopPropagation(); handleDuplicate() }}
              className="rounded-lg p-1.5 bg-background/80 backdrop-blur-sm hover:bg-muted transition-colors"
              title="复制"
            >
              <Copy className="size-3.5 text-muted-foreground hover:text-foreground" />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); handleDelete() }}
              className="rounded-lg p-1.5 bg-background/80 backdrop-blur-sm hover:bg-destructive/10 transition-colors"
              title="删除"
            >
              <Trash2 className="size-3.5 text-destructive/70 hover:text-destructive" />
            </button>
          </div>
        </div>

        {/* Bottom info */}
        <div className="px-2 py-1.5 flex flex-col gap-0.5">
          <p className={cn(
            "text-[11px] leading-relaxed line-clamp-2",
            shot.prompt ? "text-foreground/90" : "text-muted-foreground italic"
          )}>
            {shot.prompt || "暂无分镜提示词"}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={handleSelect}
      className={cn(
        "group relative rounded-xl border bg-card p-2.5 cursor-pointer hover:shadow-md hover:border-border/80 flex gap-2.5 @[640px]:gap-3 @[640px]:p-3 @[900px]:gap-3.5 @[900px]:p-3.5",
        !isSortableDragging && "transition-all",
        isActive && "ring-2 ring-primary border-primary shadow-sm bg-primary/[0.02]",
        isSelected && !isActive && "ring-2 ring-blue-400 border-blue-400",
        isDragging && "shadow-2xl ring-2 ring-primary/50"
      )}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className="flex items-center self-stretch shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing -ml-1 mr-0 pr-0.5"
        title="拖拽排序"
      >
        <GripVertical className="size-3.5 text-muted-foreground/40 hover:text-muted-foreground" />
      </div>

      {/* Left: Thumbnail */}
      <ShotThumbnail shot={shot} isGeneratingImage={isGeneratingImage} isGeneratingVideo={isGeneratingVideo} onPlayVideo={handlePlayVideo} />

      {/* Center: Index + Content */}
      <div className="flex-1 min-w-0 flex gap-2 @[640px]:gap-2.5">
        <div className="flex flex-col items-center shrink-0">
          <div className={cn(
            "size-[22px] rounded-lg flex items-center justify-center text-[9px] font-bold transition-colors @[640px]:size-6 @[640px]:text-[10px] @[900px]:size-[26px]",
            isActive
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground group-hover:bg-muted/80"
          )}>
            {shot.index + 1}
          </div>
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-1.5 @[900px]:gap-2">
          <div className="flex flex-col gap-2">
            <div className="flex items-start gap-1.5">
              <Badge variant="outline" className="text-[8px] px-1.5 py-0 shrink-0 mt-0.5 bg-blue-500/5 text-blue-600 dark:text-blue-400 border-blue-500/20 @[900px]:text-[9px]">
                <Type className="size-2.5 mr-0.5" />
                分镜
              </Badge>
              <p className="text-[11px] text-foreground/90 line-clamp-2 @[480px]:line-clamp-3 leading-relaxed @[900px]:text-[12px]">
                {shot.prompt || "暂无分镜提示词"}
              </p>
            </div>
            <div className="flex items-start gap-1.5">
              <Badge variant="outline" className="text-[8px] px-1.5 py-0 shrink-0 mt-0.5 bg-violet-500/5 text-violet-600 dark:text-violet-400 border-violet-500/20 @[900px]:text-[9px]">
                <Film className="size-2.5 mr-0.5" />
                视频
              </Badge>
              <p className="text-[11px] text-foreground/90 line-clamp-2 @[480px]:line-clamp-3 leading-relaxed @[900px]:text-[12px]">
                {shot.videoPrompt || "暂无视频提示词"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              {boundCharacters.length > 0 && (
                <div className="flex items-center -space-x-1.5">
                  {boundCharacters.slice(0, 5).map((c) => (
                    <Tooltip key={c.id}>
                      <TooltipTrigger asChild>
                        <div className="size-[18px] rounded-full bg-muted border-2 border-card flex items-center justify-center overflow-hidden shrink-0 @[900px]:size-5">
                          {c.imageUrl ? (
                            <img src={c.imageUrl} alt={c.name} className="size-full object-cover" />
                          ) : (
                            <User className="size-3 text-muted-foreground" />
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">{c.name}</TooltipContent>
                    </Tooltip>
                  ))}
                  {boundCharacters.length > 5 && (
                    <div className="size-[18px] rounded-full bg-muted border-2 border-card flex items-center justify-center text-[8px] text-muted-foreground font-medium shrink-0 @[900px]:size-5">
                      +{boundCharacters.length - 5}
                    </div>
                  )}
                </div>
              )}

              {boundScene && (
                <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-full px-1.5 py-0.5 font-medium @[900px]:text-[10px]">
                  <MapPin className="size-3 shrink-0" />
                  {boundScene.name}
                </span>
              )}

              {boundProps.length > 0 && (
                <span className="inline-flex items-center gap-1 text-[9px] bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-full px-1.5 py-0.5 font-medium @[900px]:text-[10px]">
                  <Package className="size-3 shrink-0" />
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
          onClick={(e) => { e.stopPropagation(); handleGenerateImage() }}
          className="rounded-lg p-2 hover:bg-primary/10 transition-colors"
          title={shot.imageUrl ? "重新生成画面" : "生成画面"}
        >
          <Paintbrush className="size-3.5 text-primary/70 hover:text-primary" />
        </button>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={(e) => { e.stopPropagation(); if (shot.imageUrl) handleGenerateVideo() }}
              className={cn(
                "rounded-lg p-2 transition-colors",
                shot.imageUrl
                  ? "hover:bg-violet-500/10"
                  : "opacity-40 cursor-not-allowed"
              )}
              title={shot.videoUrl ? "重新生成视频" : "生成视频"}
              disabled={!shot.imageUrl || isGeneratingVideo}
            >
              <Video className={cn(
                "size-3.5",
                shot.imageUrl ? "text-violet-500/70 hover:text-violet-500" : "text-muted-foreground/40"
              )} />
            </button>
          </TooltipTrigger>
          {!shot.imageUrl && (
            <TooltipContent side="left" className="text-xs">请先生成画面</TooltipContent>
          )}
        </Tooltip>
        <button
          onClick={(e) => { e.stopPropagation(); handleDuplicate() }}
          className="rounded-lg p-2 hover:bg-muted transition-colors"
          title="复制"
        >
          <Copy className="size-3.5 text-muted-foreground hover:text-foreground" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); handleDelete() }}
          className="rounded-lg p-2 hover:bg-destructive/10 transition-colors"
          title="删除"
        >
          <Trash2 className="size-3.5 text-destructive/70 hover:text-destructive" />
        </button>
      </div>
    </div>
  )
})
