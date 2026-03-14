"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useOutlineStore } from "@/store/outline-store"
import { Button } from "@/components/ui/button"
import { Plus, Loader2 } from "lucide-react"
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
import { OutlineEmptyState } from "./components/outline-empty-state"
import { OutlineStatsPanel } from "./components/outline-stats-panel"
import { ChapterFilterBar } from "./components/chapter-filter-bar"
import { ChapterSelectDialog } from "./components/chapter-select-dialog"
import { GenerateOutlineDropdown } from "./components/generate-outline-dropdown"
import { EpisodeCard } from "./components/episode-card"
import { EpisodeFormDialog } from "./components/episode-form-dialog"
import { ConfirmOutlineDialog } from "./components/confirm-outline-dialog"
import type { Episode, EpisodeInput } from "@/lib/types"

export default function OutlinePage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const {
    episodes,
    chapters,
    generateStatus,
    generateError,
    filterChapterIds,
    fetchEpisodes,
    fetchChapters,
    generateOutline,
    addEpisode,
    updateEpisode,
    deleteEpisode,
    addScene,
    updateScene,
    deleteScene,
    setFilterChapterIds,
    confirmOutline,
    filteredEpisodes,
  } = useOutlineStore()

  const [showChapterSelect, setShowChapterSelect] = useState(false)
  const [showAddEpisode, setShowAddEpisode] = useState(false)
  const [editingEpisode, setEditingEpisode] = useState<Episode | null>(null)
  const [deletingEpisodeId, setDeletingEpisodeId] = useState<string | null>(null)
  const [novelConfirmed, setNovelConfirmed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await fetchChapters(projectId)
      await fetchEpisodes(projectId)

      const res = await fetch(`/api/novels?projectId=${projectId}`)
      if (res.ok) {
        const data = await res.json()
        setNovelConfirmed(data?.status === "confirmed")
      }
      setLoading(false)
    }
    init()
  }, [projectId, fetchChapters, fetchEpisodes])

  const handleGenerateAll = useCallback(
    async (mode: "skip_existing" | "overwrite") => {
      await generateOutline(projectId, undefined, mode)
    },
    [projectId, generateOutline]
  )

  const handleGenerateSelected = useCallback(
    async (chapterIds: string[]) => {
      await generateOutline(projectId, chapterIds, "overwrite")
    },
    [projectId, generateOutline]
  )

  const handleAddEpisode = useCallback(
    async (data: EpisodeInput) => {
      await addEpisode(projectId, data)
      setShowAddEpisode(false)
    },
    [projectId, addEpisode]
  )

  const handleUpdateEpisode = useCallback(
    async (data: EpisodeInput) => {
      if (!editingEpisode) return
      await updateEpisode(editingEpisode.id, data)
      setEditingEpisode(null)
    },
    [editingEpisode, updateEpisode]
  )

  const handleDeleteEpisode = useCallback(async () => {
    if (!deletingEpisodeId) return
    await deleteEpisode(deletingEpisodeId)
    setDeletingEpisodeId(null)
  }, [deletingEpisodeId, deleteEpisode])

  const handleConfirm = useCallback(async () => {
    await confirmOutline(projectId)
    router.push(`/project/${projectId}/assets`)
  }, [projectId, confirmOutline, router])

  const displayedEpisodes = filteredEpisodes()
  const hasEpisodes = episodes.length > 0
  const isGenerating = generateStatus === "generating"

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">分集大纲</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            基于小说章节内容，AI 将每个章节拆分为多集短剧大纲
          </p>
        </div>
        {hasEpisodes && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddEpisode(true)}
            >
              <Plus className="size-3.5" />
              添加一集
            </Button>
            <GenerateOutlineDropdown
              generateStatus={generateStatus}
              onGenerateAll={handleGenerateAll}
              onSelectChapters={() => setShowChapterSelect(true)}
            />
          </div>
        )}
      </div>

      {/* Generate error */}
      {generateStatus === "error" && generateError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">{generateError}</p>
          <button
            onClick={() => handleGenerateAll("skip_existing")}
            className="mt-2 text-sm text-destructive underline hover:no-underline"
          >
            重试
          </button>
        </div>
      )}

      {/* Generating progress */}
      {isGenerating && (
        <div className="rounded-lg border bg-muted/30 p-4 flex items-center gap-3">
          <Loader2 className="size-5 animate-spin text-primary" />
          <div>
            <p className="text-sm font-medium">正在生成分集大纲...</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              AI 正在分析章节内容并生成大纲，请稍候
            </p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!hasEpisodes && !isGenerating && (
        <OutlineEmptyState
          chapters={chapters}
          novelConfirmed={novelConfirmed}
          onGenerateAll={() => handleGenerateAll("skip_existing")}
          onSelectChapters={() => setShowChapterSelect(true)}
          onGoToImport={() => router.push(`/project/${projectId}/import`)}
        />
      )}

      {/* Stats + Filter + List */}
      {hasEpisodes && (
        <>
          <OutlineStatsPanel episodes={episodes} chapters={chapters} />

          <div>
            <p className="text-xs text-muted-foreground mb-2">按章节筛选：</p>
            <ChapterFilterBar
              chapters={chapters}
              episodes={episodes}
              filterChapterIds={filterChapterIds}
              onFilterChange={setFilterChapterIds}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">
                分集列表
                {filterChapterIds.length > 0 && (

                  <span className="text-muted-foreground ml-1">
                    ({displayedEpisodes.length}/{episodes.length})
                  </span>
                )}
              </h3>
            </div>

            {displayedEpisodes.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  当前筛选条件下暂无分集大纲
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {displayedEpisodes.map((ep) => (
                  <EpisodeCard
                    key={ep.id}
                    episode={ep}
                    onEdit={() => setEditingEpisode(ep)}
                    onDelete={() => setDeletingEpisodeId(ep.id)}
                    onAddScene={(data) => addScene(ep.id, data)}
                    onUpdateScene={(sceneId, data) => updateScene(ep.id, sceneId, data)}
                    onDeleteScene={(sceneId) => deleteScene(ep.id, sceneId)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}


      {/* Chapter select dialog */}
      <ChapterSelectDialog
        open={showChapterSelect}
        onOpenChange={setShowChapterSelect}
        chapters={chapters}
        episodes={episodes}
        onGenerate={handleGenerateSelected}
      />

      {/* Add episode dialog */}
      <EpisodeFormDialog
        open={showAddEpisode}
        onOpenChange={setShowAddEpisode}
        chapters={chapters}
        totalEpisodes={episodes.length}
        onSave={handleAddEpisode}
      />

      {/* Edit episode dialog */}
      {editingEpisode && (
        <EpisodeFormDialog
          open={!!editingEpisode}
          onOpenChange={(open) => !open && setEditingEpisode(null)}
          episode={editingEpisode}
          chapters={chapters}
          totalEpisodes={episodes.length}
          onSave={handleUpdateEpisode}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deletingEpisodeId}
        onOpenChange={(open) => !open && setDeletingEpisodeId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除分集</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这一集吗？该集下的所有场景也会一并删除，此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEpisode}>
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
