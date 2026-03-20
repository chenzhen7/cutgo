"use client"

import { useMemo } from "react"
import { User, MapPin, Package } from "lucide-react"
import { cn } from "@/lib/utils"
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
  Script,
} from "@/lib/types"

function parseJsonArray(val: string | null | undefined): string[] {
  if (!val) return []
  try {
    const parsed = JSON.parse(val)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export type ScriptAssetStripMode = "nav" | "editor"

interface ScriptAssetStripProps {
  script: Script
  assetCharacters: AssetCharacter[]
  assetScenes: AssetScene[]
  assetProps: AssetProp[]
  mode?: ScriptAssetStripMode
}

export function ScriptAssetStrip({
  script,
  assetCharacters,
  assetScenes,
  assetProps,
  mode = "nav",
}: ScriptAssetStripProps) {
  const charByName = useMemo(
    () => new Map(assetCharacters.map((c) => [c.name, c])),
    [assetCharacters]
  )
  const propByName = useMemo(
    () => new Map(assetProps.map((p) => [p.name, p])),
    [assetProps]
  )

  const charNames = parseJsonArray(script.characters)
  const propNames = parseJsonArray(script.props)
  const loc = script.location?.trim() || ""

  const boundProps = propNames
    .map((n) => propByName.get(n))
    .filter((p): p is AssetProp => !!p)

  const boundScene = loc ? assetScenes.find((s) => s.name === loc) : null
  const sceneLabel = loc

  const hasAny =
    charNames.length > 0 || !!sceneLabel || propNames.length > 0
  if (!hasAny) return null

  const isEditor = mode === "editor"

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
      {charNames.length > 0 && (
        <TooltipProvider delayDuration={200}>
          <div
            className={cn(
              "flex items-center",
              isEditor ? "-space-x-2" : "-space-x-1.5"
            )}
          >
            {charNames.slice(0, 5).map((name) => {
              const c = charByName.get(name)
              return (
                <Tooltip key={name}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "rounded-full bg-muted border-2 border-card flex items-center justify-center overflow-hidden shrink-0",
                        isEditor ? "size-6" : "size-5"
                      )}
                    >
                      {c?.imageUrl ? (
                        <img
                          src={c.imageUrl}
                          alt={name}
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
                    {name}
                  </TooltipContent>
                </Tooltip>
              )
            })}
            {charNames.length > 5 && (
              <div
                className={cn(
                  "rounded-full bg-muted border-2 border-card flex items-center justify-center text-muted-foreground font-medium shrink-0",
                  isEditor ? "size-6 text-[9px]" : "size-5 text-[8px]"
                )}
              >
                +{charNames.length - 5}
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

      {propNames.length > 0 &&
        (isEditor ? (
          propNames.map((name) => (
            <span key={name} className={editorPropPillClass}>
              <Package className="size-3 shrink-0" />
              <span className="break-words">{name}</span>
            </span>
          ))
        ) : (
          <span className={`${navPropPillClass} max-w-[140px]`}>
            <Package className="size-2.5 shrink-0" />
            <span className="truncate">
              {boundProps.length === propNames.length && boundProps.length > 0
                ? boundProps.length === 1
                  ? boundProps[0].name
                  : `${boundProps[0].name} +${boundProps.length - 1}`
                : propNames.length === 1
                  ? propNames[0]
                  : `${propNames[0]} +${propNames.length - 1}`}
            </span>
          </span>
        ))}
    </div>
  )
}
