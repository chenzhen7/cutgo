"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useStoryboardStore } from "@/store/storyboard-store"
import { Button } from "@/components/ui/button"
import { Loader2, LayoutGrid } from "lucide-react"
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
import { StoryboardEmptyState } from "./components/storyboard-empty-state"
import { StoryboardToolbar } from "./components/storyboard-toolbar"
import { EpisodeSelectDialog } from "./components/episode-select-dialog"
import { EpisodeNavList } from "./components/episode-nav-list"
import { SceneSwimlane } from "./components/scene-swimlane"
import { ShotDetailPanel } from "./components/shot-detail-panel"
import { ConfirmStoryboardDialog } from "./components/confirm-storyboard-dialog"
import { ScriptLinesDialog } from "./components/script-lines-dialog"
import type { Storyboard, ShotInput } from "@/lib/types"

export default function StoryboardPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const {
    storyboards,
    episodes,
    scripts,
    assetCharacters,
    assetScenes,
    assetProps,
    generateStatus,
    generateError,
    activeEpisodeId,
    activeShotId,
    selectedShotIds,
    detailPanelOpen,
    imageGeneratingIds,
    batchImageStatus,
    batchImageProgress,
    fetchStoryboards,
    fetchEpisodes,
    fetchScripts,
    fetchAssets,
    generateStoryboards,
    addShot,
    updateShot,
    deleteShot,
    duplicateShot,
    generateImage,
    generateBatchImages,
    clearImage,
    setActiveEpisodeId,
    setActiveShotId,
    setDetailPanelOpen,
    confirmStoryboards,
    activeEpisodeStoryboards,
    activeShot,
    nextShot,
    prevShot,
    storyboardStats,
  } = useStoryboardStore()

  const [showEpisodeSelect, setShowEpisodeSelect] = useState(false)
  const [scriptConfirmed, setScriptConfirmed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [deletingShotInfo, setDeletingShotInfo] = useState<{ storyboardId: string; shotId: string } | null>(null)
  const [viewingScriptStoryboard, setViewingScriptStoryboard] = useState<Storyboard | null>(null)

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await Promise.all([
        fetchEpisodes(projectId),
        fetchScripts(projectId),
        fetchStoryboards(projectId),
        fetchAssets(projectId),
      ])

      const res = await fetch(`/api/projects/${projectId}`)
      if (res.ok) {
        const project = await res.json()
        setScriptConfirmed(project.step >= 5)
      }
      setLoading(false)
    }
    init()
  }, [projectId, fetchEpisodes, fetchScripts, fetchStoryboards, fetchAssets])

  useEffect(() => {
    if (episodes.length > 0 && !activeEpisodeId) {
      setActiveEpisodeId(episodes[0].id)
    }
  }, [episodes, activeEpisodeId, setActiveEpisodeId])

  const handleGenerateAll = useCallback(
    async (mode: "skip_existing" | "overwrite") => {
      await generateStoryboards(projectId, undefined, undefined, mode)
    },
    [projectId, generateStoryboards]
  )

  const handleGenerateEpisodes = useCallback(
    async (episodeIds: string[]) => {
      await generateStoryboards(projectId, episodeIds, undefined, "overwrite")
    },
    [projectId, generateStoryboards]
  )

  const handleRegenerateScript = useCallback(
    async (scriptId: string) => {
      await generateStoryboards(projectId, undefined, [scriptId], "overwrite")
    },
    [projectId, generateStoryboards]
  )

  const handleConfirm = useCallback(async () => {
    await confirmStoryboards(projectId)
    router.push(`/project/${projectId}/images`)
  }, [projectId, confirmStoryboards, router])

  const handleDeleteShot = useCallback(
    async (storyboardId: string, shotId: string) => {
      await deleteShot(storyboardId, shotId)
      setDeletingShotInfo(null)
      if (activeShotId === shotId) {
        setActiveShotId(null)
      }
    },
    [deleteShot, activeShotId, setActiveShotId]
  )

  const handleAddShot = useCallback(
    async (storyboardId: string) => {
      await addShot(storyboardId, {
        shotSize: "medium",
        composition: "新画面描述",
        prompt: "Cinematic scene, detailed environment, dramatic lighting, photorealistic",
      })
    },
    [addShot]
  )

  const handleUpdateShot = useCallback(
    (storyboardId: string, shotId: string, data: Partial<ShotInput>) => {
      updateShot(storyboardId, shotId, data)
    },
    [updateShot]
  )

  const handleSelectShot = useCallback(
    (shotId: string) => {
      setActiveShotId(shotId)
    },
    [setActiveShotId]
  )

  const handlePrevShot = useCallback(() => {
    const prev = prevShot()
    if (prev) setActiveShotId(prev.shot.id)
  }, [prevShot, setActiveShotId])

  const handleNextShot = useCallback(() => {
    const next = nextShot()
    if (next) setActiveShotId(next.shot.id)
  }, [nextShot, setActiveShotId])

  const handleGenerateImage = useCallback(
    (storyboardId: string, shotId: string) => {
      generateImage(storyboardId, shotId)
    },
    [generateImage]
  )

  const handleBatchGenerateImages = useCallback(
    (mode: "all" | "missing_only") => {
      generateBatchImages(projectId, { mode })
    },
    [projectId, generateBatchImages]
  )

  const handleBatchGenerateEpisodeImages = useCallback(() => {
    if (activeEpisodeId) {
      generateBatchImages(projectId, { episodeId: activeEpisodeId, mode: "missing_only" })
    }
  }, [projectId, activeEpisodeId, generateBatchImages])

  const handleClearImage = useCallback(() => {
    const active = activeShot()
    if (active) {
      clearImage(active.storyboard.id, active.shot.id)
    }
  }, [activeShot, clearImage])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      if (e.key === "ArrowLeft") {
        e.preventDefault()
        handlePrevShot()
      }
      if (e.key === "ArrowRight") {
        e.preventDefault()
        handleNextShot()
      }
      if ((e.key === "Delete" || e.key === "Backspace") && activeShotId) {
        e.preventDefault()
        const active = activeShot()
        if (active) {
          setDeletingShotInfo({ storyboardId: active.storyboard.id, shotId: active.shot.id })
        }
      }
      if (e.ctrlKey && e.key === "d" && activeShotId) {
        e.preventDefault()
        const active = activeShot()
        if (active) duplicateShot(active.storyboard.id, active.shot.id)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [activeShotId, handlePrevShot, handleNextShot, activeShot, duplicateShot])

  const currentStoryboards = activeEpisodeStoryboards()
  const currentActiveShot = activeShot()
  const stats = storyboardStats()
  const hasStoryboards = storyboards.some((sb) => sb.shots.length > 0)
  const isGenerating = generateStatus === "generating"

  const imageStats = useMemo(() => {
    const allShots = storyboards.flatMap((sb) => sb.shots)
    return {
      withImage: allShots.filter((s) => s.imageUrl).length,
      total: allShots.length,
    }
  }, [storyboards])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-0.5rem)]">
      {/* Header */}
      <div className="flex items-start justify-between px-6 pt-6 pb-4 shrink-0">
        <div>
          <h2 className="text-xl font-semibold text-foreground">分镜设置</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            根据剧本自动生成分镜设计，可直接为每个镜头生成画面
          </p>
        </div>
      </div>

      {/* Generate error */}
      {generateStatus === "error" && generateError && (
        <div className="mx-6 mb-4 rounded-lg border border-destructive/50 bg-destructive/5 p-4 shrink-0">
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
        <div className="mx-6 mb-4 rounded-lg border bg-muted/30 p-4 flex items-center gap-3 shrink-0">
          <Loader2 className="size-5 animate-spin text-primary" />
          <div>
            <p className="text-sm font-medium">正在生成分镜...</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              AI 正在为每个场景生成分镜设计，请稍候
            </p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!hasStoryboards && !isGenerating && (
        <div className="px-6">
          <StoryboardEmptyState
            scripts={scripts}
            scriptConfirmed={scriptConfirmed}
            onGenerateAll={() => handleGenerateAll("skip_existing")}
            onSelectEpisodes={() => setShowEpisodeSelect(true)}
            onGoToScript={() => router.push(`/project/${projectId}/script`)}
          />
        </div>
      )}

      {/* Main content */}
      {(hasStoryboards || isGenerating) && (
        <>
          {/* Toolbar */}
          <div className="px-6 mb-4 shrink-0">
            <StoryboardToolbar
              generateStatus={generateStatus}
              batchImageStatus={batchImageStatus}
              batchImageProgress={batchImageProgress}
              stats={stats}
              imageStats={imageStats}
              onGenerateAll={handleGenerateAll}
              onSelectEpisodes={() => setShowEpisodeSelect(true)}
              onBatchGenerateImages={handleBatchGenerateImages}
              onBatchGenerateEpisodeImages={handleBatchGenerateEpisodeImages}
            />
          </div>

          {/* Three-column layout */}
          <div className="flex flex-1 min-h-0 px-6 gap-4 pb-20">
            {/* Left: Episode navigation */}
            <div className="w-48 h-full shrink-0 rounded-lg border bg-card overflow-hidden">
              <EpisodeNavList
                episodes={episodes}
                scripts={scripts}
                storyboards={storyboards}
                activeEpisodeId={activeEpisodeId}
                onSelectEpisode={setActiveEpisodeId}
              />
            </div>

            {/* Center: Timeline editor */}
            <div className="flex-1 h-full min-w-0 overflow-y-auto space-y-3 pr-2 pb-12 custom-scrollbar">
              {currentStoryboards.length > 0 ? (
                currentStoryboards.map((sb) => (
                  <SceneSwimlane
                    key={sb.id}
                    storyboard={sb}
                    activeShotId={activeShotId}
                    selectedShotIds={selectedShotIds}
                    imageGeneratingIds={imageGeneratingIds}
                    assetCharacters={assetCharacters}
                    assetScenes={assetScenes}
                    assetProps={assetProps}
                    onSelectShot={handleSelectShot}
                    onDuplicateShot={(sbId, shotId) => duplicateShot(sbId, shotId)}
                    onDeleteShot={(sbId, shotId) => setDeletingShotInfo({ storyboardId: sbId, shotId })}
                    onAddShot={handleAddShot}
                    onGenerateImage={handleGenerateImage}
                    onRegenerateScript={handleRegenerateScript}
                    onViewScript={(sb) => setViewingScriptStoryboard(sb)}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <LayoutGrid className="size-12 text-muted-foreground mb-4" />
                  <h3 className="text-base font-medium mb-2">
                    {activeEpisodeId ? "该分集尚未生成分镜" : "选择一个分集"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {activeEpisodeId
                      ? "点击上方「AI 生成分镜」按钮为该分集生成分镜设计"
                      : "从左侧列表中选择一个分集进行查看和编辑"}
                  </p>
                  {activeEpisodeId && (
                    <Button
                      size="sm"
                      onClick={() => handleGenerateEpisodes([activeEpisodeId])}
                      disabled={isGenerating}
                    >
                      生成该集分镜
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Right: Shot detail panel */}
            {detailPanelOpen && currentActiveShot && (
              <div className="w-96 h-full shrink-0 rounded-lg border bg-card overflow-hidden">
                <ShotDetailPanel
                  shot={currentActiveShot.shot}
                  storyboard={currentActiveShot.storyboard}
                  isGeneratingImage={imageGeneratingIds.has(currentActiveShot.shot.id)}
                  assetCharacters={assetCharacters}
                  assetScenes={assetScenes}
                  assetProps={assetProps}
                  onUpdate={handleUpdateShot}
                  onGenerateImage={() => handleGenerateImage(currentActiveShot.storyboard.id, currentActiveShot.shot.id)}
                  onClearImage={handleClearImage}
                  onPrev={prevShot() ? handlePrevShot : null}
                  onNext={nextShot() ? handleNextShot : null}
                  onClose={() => setDetailPanelOpen(false)}
                />
              </div>
            )}
          </div>

          {/* Bottom bar */}
          <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur-sm px-6 py-4">
            <div className="mx-auto max-w-3xl">
              <ConfirmStoryboardDialog
                storyboards={storyboards}
                onConfirm={handleConfirm}
              />
            </div>
          </div>
        </>
      )}

      {/* Episode select dialog */}
      <EpisodeSelectDialog
        open={showEpisodeSelect}
        onOpenChange={setShowEpisodeSelect}
        episodes={episodes}
        scripts={scripts}
        storyboards={storyboards}
        onGenerate={handleGenerateEpisodes}
      />

      {/* Script lines dialog */}
      <ScriptLinesDialog
        open={!!viewingScriptStoryboard}
        onOpenChange={(open) => !open && setViewingScriptStoryboard(null)}
        storyboard={viewingScriptStoryboard}
      />

      {/* Delete shot confirmation */}
      <AlertDialog
        open={!!deletingShotInfo}
        onOpenChange={(open) => !open && setDeletingShotInfo(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除镜头</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这个镜头吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingShotInfo) {
                  handleDeleteShot(deletingShotInfo.storyboardId, deletingShotInfo.shotId)
                }
              }}
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
