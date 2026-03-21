"use client"

import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Circle,
  Loader2,
  Sparkles,
  BookOpen,
  ChevronRight,
  Trash2,
  GripVertical,
  Plus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { countWords } from "@/lib/novel-utils"
import { ScriptAssetStrip } from "./script-asset-strip"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type {
  AssetCharacter,
  AssetProp,
  AssetScene,
  Chapter,
  Episode,
  Script,
  ScriptGenerateStatus,
} from "@/lib/types"
import { buildEpisodeDisplayNumberMap } from "@/lib/episode-display"

const SCRIPT_NAV_OPEN_CHAPTERS_KEY = "cutgo:script-episode-nav:open-chapters"

function openChaptersStorageKey(projectId: string) {
  return `${SCRIPT_NAV_OPEN_CHAPTERS_KEY}:${projectId}`
}

interface EpisodeNavListProps {
  projectId: string
  /** 小说章节（含尚无分集的章节）；为空时仅按分集数据推导章节 */
  chapters?: Chapter[]
  episodes: Episode[]
  scripts: Script[]
  activeScriptId: string | null
  generateStatus: ScriptGenerateStatus
  assetCharacters: AssetCharacter[]
  assetScenes: AssetScene[]
  assetProps: AssetProp[]
  onSelectScript: (scriptId: string) => void
  onGenerateEpisode: (episodeId: string) => void
  onDeleteEpisode?: (projectId: string, episodeId: string) => Promise<void>
  onReorderEpisodes?: (projectId: string, orderedIds: string[]) => Promise<void>
  onCreateEpisodeScript?: (chapterId: string) => Promise<void>
}

interface SortableEpisodeItemProps {
  ep: Episode
  displayEpisodeNumber: number
  script: Script | undefined
  hasScript: boolean
  isActive: boolean
  isGenerating: boolean
  assetCharacters: AssetCharacter[]
  assetScenes: AssetScene[]
  assetProps: AssetProp[]
  onSelectScript: (scriptId: string) => void
  onGenerateEpisode: (episodeId: string) => void
  onDeleteEpisode?: (episodeId: string) => void
  canDelete: boolean
}

function SortableEpisodeItem({
  ep,
  displayEpisodeNumber,
  script,
  hasScript,
  isActive,
  isGenerating,
  assetCharacters,
  assetScenes,
  assetProps,
  onSelectScript,
  onGenerateEpisode,
  onDeleteEpisode,
  canDelete,
}: SortableEpisodeItemProps) {
  const [hovered, setHovered] = useState(false)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ep.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex flex-col gap-1 w-full cursor-pointer transition-colors border-l-[3px] border-l-transparent border-b border-b-border/60",
        isActive
          ? "bg-primary/10 border-l-primary"
          : "hover:bg-muted/50",
        isDragging && "z-50 cursor-grabbing shadow-sm",
        isDragging && (isActive ? "bg-primary/10" : "bg-background")
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => {
        if (script) onSelectScript(script.id)
      }}
    >
      <div className="flex flex-col gap-1 py-2.5 pl-1 pr-2">
        <div className="flex items-center gap-1 min-w-0">
          {/* Drag handle */}
          <button
            type="button"
            className={cn(
              "shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-opacity p-0.5",
              hovered ? "opacity-100" : "opacity-0"
            )}
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="size-3.5" />
          </button>

          <div className="flex items-center gap-2 min-w-0 flex-1">
            {isGenerating ? (
              <Loader2 className="size-3.5 shrink-0 animate-spin text-primary" />
            ) : !hasScript ? (
              <Circle className="size-3.5 shrink-0 text-muted-foreground" />
            ) : null}
            <span className="text-[10px] text-muted-foreground shrink-0">
              第{displayEpisodeNumber}集
            </span>
            <span className="text-sm font-medium truncate min-w-0 flex-1">
              {ep.title}
            </span>
            {hasScript && (
              <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                {countWords(script!.content).toLocaleString()} 字
              </span>
            )}
          </div>

          {/* Delete button */}
          {canDelete && onDeleteEpisode && (
            <button
              type="button"
              className={cn(
                "shrink-0 p-0.5 text-muted-foreground/40 hover:text-destructive transition-all",
                hovered ? "opacity-100" : "opacity-0"
              )}
              onClick={(e) => {
                e.stopPropagation()
                onDeleteEpisode(ep.id)
              }}
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
        </div>

        {hasScript ? (
          <div className="flex flex-col gap-1 pl-5">
            {ep.outline?.trim() && (
              <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                {ep.outline}
              </p>
            )}
            <ScriptAssetStrip
              script={script!}
              assetCharacters={assetCharacters}
              assetScenes={assetScenes}
              assetProps={assetProps}
              mode="nav"
            />
          </div>
        ) : (
          <div className="pl-5">
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
}

export function EpisodeNavList({
  projectId,
  chapters = [],
  episodes,
  scripts,
  activeScriptId,
  generateStatus,
  assetCharacters,
  assetScenes,
  assetProps,
  onSelectScript,
  onGenerateEpisode,
  onDeleteEpisode,
  onReorderEpisodes,
  onCreateEpisodeScript,
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

  const episodeDisplayMap = useMemo(
    () => buildEpisodeDisplayNumberMap(episodesForProject),
    [episodesForProject]
  )

  const chapterGroups = useMemo(() => {
    const byChapter = new Map<string, Episode[]>()
    for (const ep of episodesForProject) {
      if (!byChapter.has(ep.chapterId)) byChapter.set(ep.chapterId, [])
      byChapter.get(ep.chapterId)!.push(ep)
    }
    for (const list of byChapter.values()) {
      list.sort((a, b) => a.index - b.index)
    }

    if (!chapters.length) {
      return Array.from(byChapter.entries())
        .map(([_, eps]) => ({
          chapter: eps[0].chapter,
          episodes: eps,
        }))
        .sort((a, b) => a.chapter.index - b.chapter.index)
    }

    const novelChapterIds = new Set(chapters.map((c) => c.id))
    const ordered: { chapter: Episode["chapter"]; episodes: Episode[] }[] = []
    for (const ch of [...chapters].sort((a, b) => a.index - b.index)) {
      ordered.push({
        chapter: { id: ch.id, index: ch.index, title: ch.title },
        episodes: byChapter.get(ch.id) ?? [],
      })
    }
    for (const [cid, eps] of byChapter) {
      if (!novelChapterIds.has(cid) && eps.length > 0) {
        ordered.push({ chapter: eps[0].chapter, episodes: eps })
      }
    }
    return ordered
  }, [chapters, episodesForProject])

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

  // Local episode order for optimistic drag reorder
  const [localEpisodeOrder, setLocalEpisodeOrder] = useState<Map<string, string[]>>(new Map())

  // Delete confirmation state
  const [deletingEpisodeId, setDeletingEpisodeId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [creatingChapterId, setCreatingChapterId] = useState<string | null>(null)

  useEffect(() => {
    if (prevProjectIdRef.current !== projectId) {
      prevProjectIdRef.current = projectId
      setNavHydrated(false)
      setOpenChapterIds(new Set())
      setLocalEpisodeOrder(new Map())
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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (chapterId: string, event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const group = chapterGroups.find((g) => g.chapter.id === chapterId)
    if (!group) return

    const currentOrder = localEpisodeOrder.get(chapterId) ?? group.episodes.map((e) => e.id)
    const oldIndex = currentOrder.indexOf(active.id as string)
    const newIndex = currentOrder.indexOf(over.id as string)
    if (oldIndex === -1 || newIndex === -1) return

    const newOrder = arrayMove(currentOrder, oldIndex, newIndex)
    setLocalEpisodeOrder((prev) => new Map(prev).set(chapterId, newOrder))

    onReorderEpisodes?.(projectId, newOrder)
  }

  const handleCreateEpisodeScript = async (e: MouseEvent<HTMLButtonElement>, chapterId: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (!onCreateEpisodeScript || creatingChapterId) return
    setCreatingChapterId(chapterId)
    try {
      await onCreateEpisodeScript(chapterId)
      setLocalEpisodeOrder((prev) => {
        const next = new Map(prev)
        next.delete(chapterId)
        return next
      })
      setOpenChapterIds((prev) => {
        const next = new Set(prev)
        next.add(chapterId)
        return next
      })
    } finally {
      setCreatingChapterId(null)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deletingEpisodeId) return
    setDeleting(true)
    try {
      await onDeleteEpisode?.(projectId, deletingEpisodeId)
      setLocalEpisodeOrder((prev) => {
        const next = new Map(prev)
        for (const [key, ids] of next) {
          next.set(key, ids.filter((id) => id !== deletingEpisodeId))
        }
        return next
      })
    } finally {
      setDeleting(false)
      setDeletingEpisodeId(null)
    }
  }

  const isGenerating = generateStatus === "generating"

  const deletingEpisode = episodesForProject.find((ep) => ep.id === deletingEpisodeId)
  const deletingDisplayNumber =
    deletingEpisodeId != null ? episodeDisplayMap.get(deletingEpisodeId) : undefined

  return (
    <>
      <div className="h-full min-h-0 overflow-y-auto overflow-x-hidden">
        <div className="flex flex-col">
          {chapterGroups.map((group) => {
            const orderedIds = localEpisodeOrder.get(group.chapter.id) ?? group.episodes.map((e) => e.id)
            const orderedEpisodes = orderedIds
              .map((id) => group.episodes.find((e) => e.id === id))
              .filter(Boolean) as Episode[]

            return (
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
                <div className="flex items-center gap-0 min-w-0 bg-muted/55 border-b border-border">
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="flex flex-1 min-w-0 items-center gap-1.5 py-2.5 pl-3 pr-1 text-left"
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
                  {onCreateEpisodeScript && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 shrink-0 px-2 mr-1.5 text-xs text-muted-foreground hover:text-foreground"
                      disabled={!!creatingChapterId || isGenerating}
                      aria-label="在此章节下新增分集与空剧本"
                      title="在此章节下新增分集与空剧本"
                      onClick={(e) => handleCreateEpisodeScript(e, group.chapter.id)}
                    >
                      {creatingChapterId === group.chapter.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Plus className="size-3.5" />
                      )}
                    </Button>
                  )}
                </div>
                <CollapsibleContent>
                  {orderedEpisodes.length === 0 ? (
                    <div className="px-4 py-2.5 pl-8 text-xs text-muted-foreground border-b border-border/60">
                      暂无分集
                    </div>
                  ) : (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={(event) => handleDragEnd(group.chapter.id, event)}
                    >
                      <SortableContext
                        items={orderedIds}
                        strategy={verticalListSortingStrategy}
                      >
                        {orderedEpisodes.map((ep) => {
                          const script = scriptMap.get(ep.id)
                          const hasScript = !!script
                          const isActive = script?.id === activeScriptId

                          return (
                            <SortableEpisodeItem
                              key={ep.id}
                              ep={ep}
                              displayEpisodeNumber={episodeDisplayMap.get(ep.id) ?? 1}
                              script={script}
                              hasScript={hasScript}
                              isActive={isActive}
                              isGenerating={isGenerating}
                              assetCharacters={assetCharacters}
                              assetScenes={assetScenes}
                              assetProps={assetProps}
                              onSelectScript={onSelectScript}
                              onGenerateEpisode={onGenerateEpisode}
                              onDeleteEpisode={onDeleteEpisode ? (id) => setDeletingEpisodeId(id) : undefined}
                              canDelete={!!onDeleteEpisode}
                            />
                          )
                        })}
                      </SortableContext>
                    </DndContext>
                  )}
                </CollapsibleContent>
              </Collapsible>
            )
          })}
        </div>
      </div>

      <AlertDialog
        open={!!deletingEpisodeId}
        onOpenChange={(open) => !open && setDeletingEpisodeId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除分集</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除「{deletingEpisode?.title || `第${deletingDisplayNumber ?? "?"}集`}」吗？
              删除后该分集的剧本数据也将一并删除，此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "删除中..." : "确认删除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
