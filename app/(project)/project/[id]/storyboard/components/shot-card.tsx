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
import { Copy, Trash2, User, MapPin, Package, ImageIcon, Loader2, Paintbrush } from "lucide-react"
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

interface ShotCardProps {
  shot: Shot
  isActive: boolean
  isSelected: boolean
  isGeneratingImage: boolean
  assetCharacters: AssetCharacter[]
  assetScenes: AssetScene[]
  assetProps: AssetProp[]
  onSelect: () => void
  onDuplicate: () => void
  onDelete: () => void
  onGenerateImage: () => void
}

function ShotThumbnail({ shot, isGenerating }: { shot: Shot; isGenerating: boolean }) {
  const imageType = shot.imageType || "keyframe"
  const hasImage = !!shot.imageUrl
  const imageUrls = useMemo(() => parseJsonArray(shot.imageUrls), [shot.imageUrls])
  const typeLabel = IMAGE_TYPE_OPTIONS.find((o) => o.value === imageType)?.label || "关键帧"

  if (isGenerating) {
    return (
      <div className="relative size-[96px] rounded-lg bg-muted/50 flex items-center justify-center shrink-0 overflow-hidden">
        <Loader2 className="size-6 animate-spin text-primary" />
        <span className="absolute bottom-1 text-[9px] text-muted-foreground">{typeLabel}</span>
      </div>
    )
  }

  if (!hasImage) {
    return (
      <div className="relative size-[96px] rounded-lg bg-muted/30 border border-dashed border-muted-foreground/15 flex flex-col items-center justify-center shrink-0 gap-1.5">
        <ImageIcon className="size-6 text-muted-foreground/25" />
        <span className="text-[9px] text-muted-foreground/40">{typeLabel}</span>
      </div>
    )
  }

  if (imageType === "first_last" && imageUrls.length >= 2) {
    return (
      <div className="relative w-[96px] h-[96px] rounded-lg overflow-hidden shrink-0 flex flex-col gap-0.5">
        <img src={imageUrls[0]} alt="首帧" className="w-full h-[47px] object-cover rounded-t-lg" />
        <img src={imageUrls[1]} alt="尾帧" className="w-full h-[47px] object-cover rounded-b-lg" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/40 text-white text-[8px] px-1.5 py-0.5 rounded">首尾帧</div>
        </div>
      </div>
    )
  }

  if (imageType === "multi_grid") {
    return (
      <div className="relative size-[96px] rounded-lg overflow-hidden shrink-0">
        <img src={shot.imageUrl!} alt="多宫格" className="size-full object-cover" />
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.3) 1px, transparent 1px)",
          backgroundSize: "50% 50%",
        }} />
        <div className="absolute bottom-1 right-1 bg-black/40 text-white text-[8px] px-1.5 py-0.5 rounded">
          {shot.gridLayout || "2x2"}
        </div>
      </div>
    )
  }

  return (
    <div className="relative size-[96px] rounded-lg overflow-hidden shrink-0">
      <img src={shot.imageUrl!} alt="关键帧" className="size-full object-cover" />
    </div>
  )
}

export function ShotCard({
  shot,
  isActive,
  isSelected,
  isGeneratingImage,
  assetCharacters,
  assetScenes,
  assetProps,
  onSelect,
  onDuplicate,
  onDelete,
  onGenerateImage,
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
        "group relative rounded-xl border bg-card p-4 cursor-pointer transition-all hover:shadow-md hover:border-border/80 flex gap-4",
        isActive && "ring-2 ring-primary border-primary shadow-sm bg-primary/[0.02]",
        isSelected && !isActive && "ring-2 ring-blue-400 border-blue-400"
      )}
    >
      {/* Left: Thumbnail */}
      <ShotThumbnail shot={shot} isGenerating={isGeneratingImage} />

      {/* Center: Index + Content */}
      <div className="flex-1 min-w-0 flex gap-3">
        <div className="flex flex-col items-center shrink-0">
          <div className={cn(
            "size-7 rounded-lg flex items-center justify-center text-[11px] font-bold transition-colors",
            isActive
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground group-hover:bg-muted/80"
          )}>
            {shot.index + 1}
          </div>
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <p className={cn(
            "text-[14px] leading-relaxed line-clamp-2",
            shot.composition ? "text-foreground font-medium" : "text-muted-foreground/60 italic"
          )}>
            {shot.composition || "暂无画面描述"}
          </p>

          <div className="flex items-center gap-3 flex-wrap">
            {matchedTags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {matchedTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-[10px] font-normal px-2 py-0 rounded-full bg-muted/60"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {matchedTags.length > 0 && hasAssets && (
              <div className="w-px h-3 bg-border shrink-0" />
            )}

            <div className="flex items-center gap-2 flex-wrap">
              {boundCharacters.length > 0 && (
                <TooltipProvider delayDuration={200}>
                  <div className="flex items-center -space-x-1.5">
                    {boundCharacters.slice(0, 5).map((c) => (
                      <Tooltip key={c.id}>
                        <TooltipTrigger asChild>
                          <div className="size-5.5 rounded-full bg-muted border-2 border-card flex items-center justify-center overflow-hidden shrink-0">
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
                      <div className="size-5.5 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[9px] text-muted-foreground font-medium shrink-0">
                        +{boundCharacters.length - 5}
                      </div>
                    )}
                  </div>
                </TooltipProvider>
              )}

              {boundScene && (
                <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-full px-2 py-0.5 font-medium">
                  <MapPin className="size-3 shrink-0" />
                  {boundScene.name}
                </span>
              )}

              {boundProps.length > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-full px-2 py-0.5 font-medium">
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
      <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); onGenerateImage() }}
          className="rounded-lg p-2 hover:bg-primary/10 transition-colors"
          title={shot.imageUrl ? "重新生成画面" : "生成画面"}
        >
          <Paintbrush className="size-3.5 text-primary/70 hover:text-primary" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDuplicate() }}
          className="rounded-lg p-2 hover:bg-muted transition-colors"
          title="复制"
        >
          <Copy className="size-3.5 text-muted-foreground hover:text-foreground" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="rounded-lg p-2 hover:bg-destructive/10 transition-colors"
          title="删除"
        >
          <Trash2 className="size-3.5 text-destructive/70 hover:text-destructive" />
        </button>
      </div>
    </div>
  )
}
