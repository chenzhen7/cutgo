"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Circle,
  Loader2,
  Sparkles,
  BookOpen,
  ChevronRight,
  User,
  MapPin,
  Package,
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { countWords } from "@/lib/novel-utils"
import type {
  AssetCharacter,
  AssetProp,
  AssetScene,
  Episode,
  Script,
  ScriptGenerateStatus,
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

const SCRIPT_NAV_OPEN_CHAPTERS_KEY = "cutgo:script-episode-nav:open-chapters"

function openChaptersStorageKey(projectId: string) {
  return `${SCRIPT_NAV_OPEN_CHAPTERS_KEY}:${projectId}`
}

interface EpisodeNavListProps {
  projectId: string
  episodes: Episode[]
  scripts: Script[]
  activeScriptId: string | null
  generateStatus: ScriptGenerateStatus
  assetCharacters: AssetCharacter[]
  assetScenes: AssetScene[]
  assetProps: AssetProp[]
  onSelectScript: (scriptId: string) => void
  onGenerateEpisode: (episodeId: string) => void
}

function ScriptEpisodeAssetStrip({
  script,
  charByName,
  propByName,
  assetScenes,
}: {
  script: Script
  charByName: Map<string, AssetCharacter>
  propByName: Map<string, AssetProp>
  assetScenes: AssetScene[]
}) {
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

  return (
    <div className="flex items-center gap-2 flex-wrap pt-0.5">
      {charNames.length > 0 && (
        <TooltipProvider delayDuration={200}>
          <div className="flex items-center -space-x-1.5">
            {charNames.slice(0, 5).map((name) => {
              const c = charByName.get(name)
              return (
                <Tooltip key={name}>
                  <TooltipTrigger asChild>
                    <div className="size-5 rounded-full bg-muted border-2 border-card flex items-center justify-center overflow-hidden shrink-0">
                      {c?.imageUrl ? (
                        <img
                          src={c.imageUrl}
                          alt={name}
                          className="size-full object-cover"
                        />
                      ) : (
                        <User className="size-2.5 text-muted-foreground" />
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    {name}
                  </TooltipContent>
                </Tooltip>
              )
            })}
            {charNames.length > 5 && (
              <div className="size-5 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[8px] text-muted-foreground font-medium shrink-0">
                +{charNames.length - 5}
              </div>
            )}
          </div>
        </TooltipProvider>
      )}

      {sceneLabel && (
        <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-full px-2 py-0.5 font-medium max-w-[140px]">
          <MapPin className="size-2.5 shrink-0" />
          <span className="truncate">
            {boundScene?.name ?? sceneLabel}
          </span>
        </span>
      )}

      {propNames.length > 0 && (
        <span className="inline-flex items-center gap-1 text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-full px-2 py-0.5 font-medium max-w-[140px]">
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
      )}
    </div>
  )
}

export function EpisodeNavList({
  projectId,
  episodes,
  scripts,
  activeScriptId,
  generateStatus,
  assetCharacters,
  assetScenes,
  assetProps,
  onSelectScript,
  onGenerateEpisode,
}: EpisodeNavListProps) {
  const episodesForProject = useMemo(
    () => episodes.filter((ep) => ep.projectId === projectId),
    [episodes, projectId]
  )
  const scriptsForProject = useMemo(
    () => scripts.filter((s) => s.projectId === projectId),
    [scripts, projectId]
  )

  const scriptMap = useMemo(() => {
    const map = new Map<string, Script>()
    for (const s of scriptsForProject) map.set(s.episodeId, s)
    return map
  }, [scriptsForProject])

  const charByName = useMemo(
    () => new Map(assetCharacters.map((c) => [c.name, c])),
    [assetCharacters]
  )
  const propByName = useMemo(
    () => new Map(assetProps.map((p) => [p.name, p])),
    [assetProps]
  )

  const chapterGroups = useMemo(() => {
    const groups = new Map<string, { chapter: Episode["chapter"]; episodes: Episode[] }>()
    for (const ep of episodesForProject) {
      const key = ep.chapterId
      if (!groups.has(key)) {
        groups.set(key, { chapter: ep.chapter, episodes: [] })
      }
      groups.get(key)!.episodes.push(ep)
    }
    return Array.from(groups.values()).sort(
      (a, b) => a.chapter.index - b.chapter.index
    )
  }, [episodesForProject])

  const allChapterIds = useMemo(
    () => chapterGroups.map((g) => g.chapter.id),
    [chapterGroups]
  )
  const chapterIdsFingerprint = useMemo(
    () => [...allChapterIds].sort().join("\0"),
    [allChapterIds]
  )

  const [openChapterIds, setOpenChapterIds] = useState<Set<string>>(new Set())
  const [navHydrated, setNavHydrated] = useState(false)
  const prevProjectIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (prevProjectIdRef.current !== projectId) {
      prevProjectIdRef.current = projectId
      setNavHydrated(false)
      setOpenChapterIds(new Set())
    }
  }, [projectId])

  useEffect(() => {
    if (chapterGroups.length === 0 || navHydrated) return

    try {
      const raw = localStorage.getItem(openChaptersStorageKey(projectId))
      if (raw === null) {
        setOpenChapterIds(new Set(allChapterIds))
      } else {
        const parsed = JSON.parse(raw) as unknown
        const valid = new Set(allChapterIds)
        if (!Array.isArray(parsed)) {
          setOpenChapterIds(new Set(allChapterIds))
        } else {
          setOpenChapterIds(
            new Set(parsed.filter((id): id is string => typeof id === "string" && valid.has(id)))
          )
        }
      }
    } catch {
      setOpenChapterIds(new Set(allChapterIds))
    }
    setNavHydrated(true)
  }, [projectId, navHydrated, chapterIdsFingerprint, allChapterIds, chapterGroups.length])

  useEffect(() => {
    if (!navHydrated || chapterGroups.length === 0) return
    const valid = new Set(allChapterIds)
    setOpenChapterIds((prev) => {
      let changed = false
      const next = new Set<string>()
      for (const id of prev) {
        if (valid.has(id)) next.add(id)
        else changed = true
      }
      return changed ? next : prev
    })
  }, [navHydrated, chapterIdsFingerprint, allChapterIds, chapterGroups.length])

  useEffect(() => {
    if (!navHydrated || typeof window === "undefined") return
    try {
      localStorage.setItem(
        openChaptersStorageKey(projectId),
        JSON.stringify([...openChapterIds].sort())
      )
    } catch {
      /* ignore quota / private mode */
    }
  }, [navHydrated, projectId, openChapterIds])

  useEffect(() => {
    if (!activeScriptId) return
    const activeScript = scriptsForProject.find((s) => s.id === activeScriptId)
    if (!activeScript) return
    const activeEpisode = episodesForProject.find((ep) => ep.id === activeScript.episodeId)
    if (!activeEpisode) return
    setOpenChapterIds((prev) => {
      if (prev.has(activeEpisode.chapterId)) return prev
      const next = new Set(prev)
      next.add(activeEpisode.chapterId)
      return next
    })
  }, [activeScriptId, scriptsForProject, episodesForProject])

  const isGenerating = generateStatus === "generating"

  return (
    <div className="h-full min-h-0 overflow-y-auto overflow-x-hidden">
      <div className="flex flex-col">
        {chapterGroups.map((group) => (
          <Collapsible
            key={group.chapter.id}
            open={openChapterIds.has(group.chapter.id)}
            onOpenChange={(open) => {
              setOpenChapterIds((prev) => {
                const next = new Set(prev)
                if (open) {
                  next.add(group.chapter.id)
                } else {
                  next.delete(group.chapter.id)
                }
                return next
              })
            }}
            className="border-b-1 border-border/90 last:border-b-0"
          >
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1.5 min-w-0 w-full bg-muted/55 border-b border-border py-2.5 pl-3 pr-2 text-left"
              >
                <ChevronRight
                  className={cn(
                    "size-3 shrink-0 text-muted-foreground transition-transform",
                    openChapterIds.has(group.chapter.id) && "rotate-90"
                  )}
                />
                <BookOpen className="size-3 shrink-0 text-muted-foreground" />
                <span className="text-xs font-semibold text-foreground/80 truncate tracking-tight">
                  {group.chapter.title || `第${group.chapter.index + 1}章`}
                </span>
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="divide-y divide-border">
              {group.episodes.map((ep) => {
                const script = scriptMap.get(ep.id)
                const hasScript = !!script
                const isActive = script?.id === activeScriptId

                return (
                  <div
                    key={ep.id}
                    className={cn(
                      "flex flex-col gap-1 w-full cursor-pointer transition-colors border-l-[3px] border-transparent",
                      isActive
                        ? "bg-primary/10 border-l-primary"
                        : "hover:bg-muted/50"
                    )}
                    onClick={() => {
                      if (script) onSelectScript(script.id)
                    }}
                  >
                    <div className="flex flex-col gap-1 py-2.5 pl-3 pr-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {isGenerating ? (
                          <Loader2 className="size-3.5 shrink-0 animate-spin text-primary" />
                        ) : !hasScript ? (
                          <Circle className="size-3.5 shrink-0 text-muted-foreground" />
                        ) : null}
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          第{ep.index}集
                        </span>
                        <span className="text-sm font-medium truncate min-w-0 flex-1">
                          {ep.title}
                        </span>
                        {hasScript && (
                          <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                            {countWords(script.content).toLocaleString()} 字
                          </span>
                        )}
                      </div>

                      {hasScript ? (
                        <div className="flex flex-col gap-1">
                          <ScriptEpisodeAssetStrip
                            script={script}
                            charByName={charByName}
                            propByName={propByName}
                            assetScenes={assetScenes}
                          />
                        </div>
                      ) : (
                        <div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs px-2"
                            disabled={isGenerating}
                            onClick={(e) => {
                              e.stopPropagation()
                              onGenerateEpisode(ep.id)
                            }}
                          >
                            <Sparkles className="size-3" />
                            生成剧本
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>
    </div>
  )
}
