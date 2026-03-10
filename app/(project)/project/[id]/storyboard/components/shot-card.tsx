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
import { Copy, Trash2, User, MapPin, Package } from "lucide-react"
import { SHOT_SIZE_OPTIONS, CAMERA_MOVEMENT_OPTIONS, CAMERA_ANGLE_OPTIONS } from "@/lib/types"
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
  assetCharacters: AssetCharacter[]
  assetScenes: AssetScene[]
  assetProps: AssetProp[]
  onSelect: () => void
  onDuplicate: () => void
  onDelete: () => void
}

export function ShotCard({
  shot,
  isActive,
  isSelected,
  assetCharacters,
  assetScenes,
  assetProps,
  onSelect,
  onDuplicate,
  onDelete,
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
      {/* Left: Index */}
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

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        {/* Composition Title/Text */}
        <p className={cn(
          "text-[14px] leading-relaxed",
          shot.composition ? "text-foreground font-medium" : "text-muted-foreground/60 italic"
        )}>
          {shot.composition || "暂无画面描述"}
        </p>

        {/* Tags & Assets row */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Keywords */}
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

          {/* Divider if both exist */}
          {matchedTags.length > 0 && hasAssets && (
            <div className="w-px h-3 bg-border shrink-0" />
          )}

          {/* Assets */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Characters */}
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

            {/* Scene */}
            {boundScene && (
              <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-full px-2 py-0.5 font-medium">
                <MapPin className="size-3 shrink-0" />
                {boundScene.name}
              </span>
            )}

            {/* Props */}
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

      {/* Right Actions */}
      <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
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
