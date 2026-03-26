"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
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
  Loader2,
  Trash2,
  GripVertical,
  Plus,
} from "lucide-react"
import { cn } from "@/lib/utils"
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
  Episode,
  ScriptGenerateStatus,
} from "@/lib/types"
import { buildEpisodeDisplayNumberMap } from "@/lib/episode-display"
import { parseSourceChapterIds } from "@/lib/episode-source-chapters"

interface EpisodeNavListProps {
  projectId: string
  episodes: Episode[]
  activeEpisodeId: string | null
  generateStatus: ScriptGenerateStatus
  assetCharacters: AssetCharacter[]
  assetScenes: AssetScene[]
  assetProps: AssetProp[]
  onSelectEpisode: (ep: Episode) => void
  onDeleteEpisode?: (projectId: string, episodeId: string) => Promise<void>
  onReorderEpisodes?: (projectId: string, orderedIds: string[]) => Promise<void>
  onCreateEpisodeScript?: (chapterIds: string[]) => Promise<void>
}

interface SortableEpisodeItemProps {
  ep: Episode
  displayEpisodeNumber: number
  hasScript: boolean
  isActive: boolean
  assetCharacters: AssetCharacter[]
  assetScenes: AssetScene[]
  assetProps: AssetProp[]
  onSelectEpisode: (ep: Episode) => void
  onDeleteEpisode?: (episodeId: string) => void
  canDelete: boolean
}

function SortableEpisodeItem({
  ep,
  displayEpisodeNumber,
  hasScript,
  isActive,
  assetCharacters,
  assetScenes,
  assetProps,
  onSelectEpisode,
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
        onSelectEpisode(ep)
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
            <span className="text-[10px] text-muted-foreground shrink-0">
              第{displayEpisodeNumber}集
            </span>
            <span className="text-sm font-medium truncate min-w-0 flex-1">
              {ep.title}
            </span>
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

        {hasScript || ep.outline?.trim() ? (
          <div className="flex flex-col gap-1 pl-5">
            {ep.outline?.trim() && (
              <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                {ep.outline}
              </p>
            )}
            <ScriptAssetStrip
              episode={ep}
              assetCharacters={assetCharacters}
              assetScenes={assetScenes}
              assetProps={assetProps}
              mode="nav"
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function EpisodeNavList({
  projectId,
  episodes,
  activeEpisodeId,
  generateStatus,
  assetCharacters,
  assetScenes,
  assetProps,
  onSelectEpisode,
  onDeleteEpisode,
  onReorderEpisodes,
  onCreateEpisodeScript,
}: EpisodeNavListProps) {
  const episodesForProject = useMemo(
    () =>
      episodes
        .filter((ep) => ep.projectId === projectId)
        .sort((a, b) => a.index - b.index),
    [episodes, projectId]
  )

  const episodeDisplayMap = useMemo(
    () => buildEpisodeDisplayNumberMap(episodesForProject),
    [episodesForProject]
  )

  const [localOrder, setLocalOrder] = useState<string[] | null>(null)
  const [deletingEpisodeId, setDeletingEpisodeId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [creating, setCreating] = useState(false)

  const orderedIds = localOrder ?? episodesForProject.map((e) => e.id)
  const orderedEpisodes = orderedIds
    .map((id) => episodesForProject.find((e) => e.id === id))
    .filter(Boolean) as Episode[]

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const currentIds = localOrder ?? episodesForProject.map((e) => e.id)
    const oldIndex = currentIds.indexOf(active.id as string)
    const newIndex = currentIds.indexOf(over.id as string)
    if (oldIndex === -1 || newIndex === -1) return

    const newOrder = arrayMove(currentIds, oldIndex, newIndex)
    setLocalOrder(newOrder)
    onReorderEpisodes?.(projectId, newOrder)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingEpisodeId) return
    setDeleting(true)
    try {
      await onDeleteEpisode?.(projectId, deletingEpisodeId)
      setLocalOrder((prev) =>
        prev ? prev.filter((id) => id !== deletingEpisodeId) : null
      )
    } finally {
      setDeleting(false)
      setDeletingEpisodeId(null)
    }
  }

  const handleAddEpisode = async () => {
    if (!onCreateEpisodeScript || creating || episodesForProject.length === 0) return
    const lastEp = orderedEpisodes[orderedEpisodes.length - 1]
    setCreating(true)
    try {
      const ids = parseSourceChapterIds(lastEp)
      await onCreateEpisodeScript(ids)
      setLocalOrder(null)
    } finally {
      setCreating(false)
    }
  }

  const isGenerating = generateStatus === "generating"

  const deletingEpisode = episodesForProject.find((ep) => ep.id === deletingEpisodeId)
  const deletingDisplayNumber =
    deletingEpisodeId != null ? episodeDisplayMap.get(deletingEpisodeId) : undefined

  return (
    <>
      <div className="h-full min-h-0 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b shrink-0">
          <span className="text-xs font-semibold text-muted-foreground">
            全部分集 · {episodesForProject.length} 集
          </span>
          {onCreateEpisodeScript && episodesForProject.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
              disabled={creating || isGenerating}
              onClick={handleAddEpisode}
              title="新增分集"
            >
              {creating ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Plus className="size-3.5" />
              )}
            </Button>
          )}
        </div>

        {/* Episode list */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          {orderedEpisodes.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-muted-foreground">
              暂无分集
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={orderedIds}
                strategy={verticalListSortingStrategy}
              >
                {orderedEpisodes.map((ep) => {
                  const hasScript = !!ep.script
                  const isActive = ep.id === activeEpisodeId

                  return (
                    <SortableEpisodeItem
                      key={ep.id}
                      ep={ep}
                      displayEpisodeNumber={episodeDisplayMap.get(ep.id) ?? 1}
                      hasScript={hasScript}
                      isActive={isActive}
                      assetCharacters={assetCharacters}
                      assetScenes={assetScenes}
                      assetProps={assetProps}
                      onSelectEpisode={onSelectEpisode}
                      onDeleteEpisode={
                        onDeleteEpisode
                          ? (id) => setDeletingEpisodeId(id)
                          : undefined
                      }
                      canDelete={!!onDeleteEpisode}
                    />
                  )
                })}
              </SortableContext>
            </DndContext>
          )}
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
