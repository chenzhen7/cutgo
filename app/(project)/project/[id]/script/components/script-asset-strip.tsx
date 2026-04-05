"use client"

import { useMemo } from "react"
import { User, MapPin, Package } from "lucide-react"
import { cn, parseJsonArray } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type {
  AssetCharacter,
  AssetProp,
  AssetScene,
  Episode,
} from "@/lib/types"
import { PreviewableImage } from "@/components/ui/previewable-image"

export type ScriptAssetStripMode = "nav" | "editor"

interface ScriptAssetStripProps {
  episode: Episode
  assetCharacters: AssetCharacter[]
  assetScenes: AssetScene[]
  assetProps: AssetProp[]
  mode?: ScriptAssetStripMode
}

export function ScriptAssetStrip({
  episode,
  assetCharacters,
  assetScenes,
  assetProps,
  mode = "nav",
}: ScriptAssetStripProps) {
  const charById = useMemo(
    () => new Map(assetCharacters.map((c) => [c.id, c])),
    [assetCharacters]
  )
  const propById = useMemo(
    () => new Map(assetProps.map((p) => [p.id, p])),
    [assetProps]
  )
  const sceneById = useMemo(
    () => new Map(assetScenes.map((s) => [s.id, s])),
    [assetScenes]
  )

  const characterIds = parseJsonArray(episode.characters)
  const propIds = parseJsonArray(episode.props)
  const sceneIds = parseJsonArray(episode.scenes)
  const sceneId = sceneIds[0] || ""

  const boundProps = propIds
    .map((id) => propById.get(id))
    .filter((p): p is AssetProp => !!p)

  const boundScene = sceneId ? sceneById.get(sceneId) ?? null : null
  const sceneLabel = boundScene?.name || ""

  const hasAny =
    characterIds.length > 0 || !!sceneLabel || propIds.length > 0
  if (!hasAny) return null

  const isEditor = mode === "editor"
  const maxVisibleCharacters = isEditor ? 5 : 2

  const navPropPillClass =
    "inline-flex items-center gap-1 text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-full px-2 py-0.5 font-medium"

  const editorPropPillClass =
    "inline-flex items-center gap-1.5 text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-full px-2.5 py-1 font-medium"

  return (
    <div
      className={cn(
        "flex items-center flex-wrap",
        isEditor ? "gap-2.5" : "gap-2",
        mode === "nav" && "pt-0.5"
      )}
    >
      {characterIds.length > 0 && (
        <TooltipProvider delayDuration={200}>
          <div
            className={cn(
              "flex items-center",
              isEditor ? "-space-x-2" : "-space-x-1.5"
            )}
          >
            {characterIds.slice(0, maxVisibleCharacters).map((id) => {
              const c = charById.get(id)
              const label = c?.name ?? id
              return (
                <Tooltip key={id}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "rounded-full bg-muted border-2 border-card flex items-center justify-center overflow-hidden shrink-0",
                        isEditor ? "size-6" : "size-5"
                      )}
                    >
                      {c?.imageUrl ? (
<PreviewableImage 
                          src={c.imageUrl}
                          alt={label}
                          className="size-full object-cover"
                        />
                      ) : (
                        <User
                          className={cn(
                            "text-muted-foreground",
                            isEditor ? "size-3" : "size-2.5"
                          )}
                        />
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className={isEditor ? "text-sm" : "text-xs"}
                  >
                    {label}
                  </TooltipContent>
                </Tooltip>
              )
            })}
            {characterIds.length > maxVisibleCharacters && (
              <div
                className={cn(
                  "rounded-full bg-muted border-2 border-card flex items-center justify-center text-muted-foreground font-medium shrink-0",
                  isEditor ? "size-6 text-[9px]" : "size-5 text-[8px]"
                )}
              >
                +{characterIds.length - maxVisibleCharacters}
              </div>
            )}
          </div>
        </TooltipProvider>
      )}

      {sceneLabel && (
        <span
          className={cn(
            "inline-flex items-center bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-full font-medium",
            isEditor
              ? "gap-1.5 text-xs px-2.5 py-1 max-w-full min-w-0"
              : "gap-1 text-[10px] px-2 py-0.5 max-w-[140px]"
          )}
        >
          <MapPin
            className={cn("shrink-0", isEditor ? "size-3" : "size-2.5")}
          />
          <span className={isEditor ? "break-words" : "truncate"}>
            {boundScene?.name ?? sceneLabel}
          </span>
        </span>
      )}

      {propIds.length > 0 &&
        (isEditor ? (
          boundProps.map((prop) => (
            <span key={prop.id} className={editorPropPillClass}>
              <Package className="size-3 shrink-0" />
              <span className="break-words">{prop.name}</span>
            </span>
          ))
        ) : (
          <span className={`${navPropPillClass} max-w-[140px]`}>
            <Package className="size-2.5 shrink-0" />
            <span className="truncate">
              {boundProps.length > 0
                ? boundProps.length === 1
                  ? boundProps[0].name
                  : `${boundProps[0].name} +${boundProps.length - 1}`
                : `${propIds.length} 个道具`}
            </span>
          </span>
        ))}
    </div>
  )
}
