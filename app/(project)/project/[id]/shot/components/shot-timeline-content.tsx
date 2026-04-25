"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useScriptShotsStore } from "@/store/script-shot-store"
import { Button } from "@/components/ui/button"
import { Loader2, Clapperboard } from "lucide-react"
import { cn } from "@/lib/utils"
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
import { ScriptShotToolbar } from "./script-shot-toolbar"
import { EpisodeSelector } from "./episode-selector"
import { SceneSwimlane } from "./scene-swimlane"
import { ScriptLinesDialog } from "./script-lines-dialog"
import { GenerateShotTypeDialog } from "./generate-shot-type-dialog"
import { BatchGenerateImagesDialog } from "./batch-generate-images-dialog"
import { BatchGenerateVideosDialog } from "./batch-generate-videos-dialog"
import type { ScriptShotPlan, ShotInput } from "@/lib/types"
import { buildEpisodeDisplayNumberMap, sortEpisodesByChapterAndIndex } from "@/lib/episode-display"
import { apiFetch } from "@/lib/api-client"
import type { Project } from "@/lib/types"

interface ShotTimelineContentProps {
  projectId: string
  aspectRatio: string
  onPlayVideo: (shotId: string) => void
}

export function ShotTimelineContent({
  projectId,
  aspectRatio,
  onPlayVideo,
}: ShotTimelineContentProps) {
  const scriptShotPlans = useScriptShotsStore((s) => s.scriptShotPlans)
  const episodes = useScriptShotsStore((s) => s.episodes)
  const assetCharacters = useScriptShotsStore((s) => s.assetCharacters)
  const assetScenes = useScriptShotsStore((s) => s.assetScenes)
  const assetProps = useScriptShotsStore((s) => s.assetProps)
  const generateStatus = useScriptShotsStore((s) => s.generateStatus)
  const activeEpisodeId = useScriptShotsStore((s) => s.activeEpisodeId)
  const shotLayout = useScriptShotsStore((s) => s.shotLayout)
  const activeDetailTab = useScriptShotsStore((s) => s.activeDetailTab)
  const imageGeneratingIds = useScriptShotsStore((s) => s.imageGeneratingIds)
  const batchImageStatus = useScriptShotsStore((s) => s.batchImageStatus)
  const batchImageProgress = useScriptShotsStore((s) => s.batchImageProgress)
  const videoGeneratingIds = useScriptShotsStore((s) => s.videoGeneratingIds)
  const batchVideoStatus = useScriptShotsStore((s) => s.batchVideoStatus)
  const batchVideoProgress = useScriptShotsStore((s) => s.batchVideoProgress)

  const fetchScriptShotPlans = useScriptShotsStore((s) => s.fetchScriptShotPlans)
  const fetchEpisodeShotCounts = useScriptShotsStore((s) => s.fetchEpisodeShotCounts)
  const fetchEpisodes = useScriptShotsStore((s) => s.fetchEpisodes)
  const fetchAssets = useScriptShotsStore((s) => s.fetchAssets)
  const generateScriptShots = useScriptShotsStore((s) => s.generateScriptShots)
  const addShot = useScriptShotsStore((s) => s.addShot)
  const updateShot = useScriptShotsStore((s) => s.updateShot)
  const deleteShot = useScriptShotsStore((s) => s.deleteShot)
  const duplicateShot = useScriptShotsStore((s) => s.duplicateShot)
  const generateImage = useScriptShotsStore((s) => s.generateImage)
  const generateVideo = useScriptShotsStore((s) => s.generateVideo)
  const generateBatchImages = useScriptShotsStore((s) => s.generateBatchImages)
  const generateBatchVideos = useScriptShotsStore((s) => s.generateBatchVideos)
  const reorderShots = useScriptShotsStore((s) => s.reorderShots)
  const setActiveEpisodeId = useScriptShotsStore((s) => s.setActiveEpisodeId)
  const setActiveShotId = useScriptShotsStore((s) => s.setActiveShotId)
  const setDetailPanelOpen = useScriptShotsStore((s) => s.setDetailPanelOpen)
  const setShotLayout = useScriptShotsStore((s) => s.setShotLayout)

  const [initialLoading, setInitialLoading] = useState(true)
  const [episodeLoading, setEpisodeLoading] = useState(false)
  const [deletingShotInfo, setDeletingShotInfo] = useState<{ episodeId: string; shotId: string } | null>(null)
  const [showShotTypeDialog, setShowShotTypeDialog] = useState(false)
  const [showBatchImageDialog, setShowBatchImageDialog] = useState(false)
  const [showBatchVideoDialog, setShowBatchVideoDialog] = useState(false)
  const [viewingScriptShotPlan, setViewingScriptShotPlan] = useState<ScriptShotPlan | null>(null)

  const prevEpisodeIdRef = useRef(activeEpisodeId)

  // 初始化
  useEffect(() => {
    const init = async () => {
      setInitialLoading(true)
      const [eps] = await Promise.all([
        fetchEpisodes(projectId),
        fetchEpisodeShotCounts(projectId),
        fetchAssets(projectId),
        apiFetch<Project>(`/api/projects/${projectId}`).then(() => {}).catch(() => {}),
      ])
      const currentActiveEpisodeId = useScriptShotsStore.getState().activeEpisodeId
      if (eps && eps.length > 0) {
        const isActiveValid = eps.some(e => e.id === currentActiveEpisodeId)
        if (!isActiveValid) {
          const sorted = sortEpisodesByChapterAndIndex(eps)
          setActiveEpisodeId(sorted[0].id)
        }
      }
      setInitialLoading(false)
    }
    init()
  }, [projectId, fetchEpisodeShotCounts, fetchEpisodes, fetchAssets, setActiveEpisodeId])

  // 分集切换加载
  useEffect(() => {
    if (!activeEpisodeId) return
    let cancelled = false
    const loadActiveEpisode = async () => {
      setEpisodeLoading(true)
      if (prevEpisodeIdRef.current !== activeEpisodeId) {
        setActiveShotId(null)
      }
      prevEpisodeIdRef.current = activeEpisodeId
      try {
        await fetchScriptShotPlans(projectId, activeEpisodeId)
      } finally {
        if (!cancelled) {
          setEpisodeLoading(false)
        }
      }
    }
    loadActiveEpisode()
    return () => { cancelled = true }
  }, [projectId, activeEpisodeId, fetchScriptShotPlans, setActiveShotId])

  const currentScriptShotPlans = useMemo(() => {
    if (!activeEpisodeId) return scriptShotPlans
    return scriptShotPlans.filter((sb) => sb.episodeId === activeEpisodeId)
  }, [scriptShotPlans, activeEpisodeId])

  const assetCharacterMap = useMemo(
    () => new Map(assetCharacters.map((c) => [c.id, c])),
    [assetCharacters]
  )
  const assetSceneMap = useMemo(
    () => new Map(assetScenes.map((s) => [s.id, s])),
    [assetScenes]
  )
  const assetPropMap = useMemo(
    () => new Map(assetProps.map((p) => [p.id, p])),
    [assetProps]
  )

  const episodeDisplayMap = useMemo(
    () => buildEpisodeDisplayNumberMap(episodes.filter((e) => e.projectId === projectId)),
    [episodes, projectId]
  )

  const isGenerating = generateStatus === "generating"
  const hasExistingShots = useMemo(
    () => currentScriptShotPlans.length > 0 && currentScriptShotPlans.some(p => p.shots.length > 0),
    [currentScriptShotPlans]
  )

  const allFlatShots = useMemo(() => {
    const visiblePlans = activeEpisodeId
      ? scriptShotPlans.filter((plan) => plan.episodeId === activeEpisodeId)
      : scriptShotPlans
    return visiblePlans.flatMap((plan) => plan.shots.map((shot) => ({ shot, scriptShotPlan: plan })))
  }, [scriptShotPlans, activeEpisodeId])

  const handleConfirmGenerate = useCallback(async () => {
    if (!activeEpisodeId) return
    setShowShotTypeDialog(false)
    setDetailPanelOpen(false)
    await generateScriptShots(projectId, [activeEpisodeId])
    await fetchScriptShotPlans(projectId, activeEpisodeId)
  }, [projectId, activeEpisodeId, generateScriptShots, fetchScriptShotPlans, setDetailPanelOpen])

  const handleGenerateCurrentEpisode = useCallback(() => {
    if (!activeEpisodeId) return
    if (hasExistingShots) {
      setShowShotTypeDialog(true)
      return
    }
    void handleConfirmGenerate()
  }, [activeEpisodeId, hasExistingShots, handleConfirmGenerate])

  const handleDeleteShot = useCallback(
    async (episodeId: string, shotId: string) => {
      await deleteShot(episodeId, shotId)
      setDeletingShotInfo(null)
    },
    [deleteShot]
  )

  const handleDuplicateShot = useCallback(
    (episodeId: string, shotId: string) => {
      duplicateShot(episodeId, shotId)
    },
    [duplicateShot]
  )

  const handleReorderShots = useCallback(
    (episodeId: string, orderedIds: string[]) => {
      reorderShots(episodeId, orderedIds)
    },
    [reorderShots]
  )

  const handleAddShot = useCallback(
    async (episodeId: string) => {
      await addShot(episodeId, { content: "新分镜" })
    },
    [addShot]
  )

  const handleSelectShot = useCallback(
    (shotId: string) => {
      setActiveShotId(shotId)
    },
    [setActiveShotId]
  )

  const handleGenerateImage = useCallback(
    (episodeId: string, shotId: string) => {
      generateImage(episodeId, shotId)
    },
    [generateImage]
  )

  const handleGenerateVideo = useCallback(
    (episodeId: string, shotId: string) => {
      generateVideo(episodeId, shotId)
    },
    [generateVideo]
  )

  const handleBatchGenerateImages = useCallback(
    async (shotIds: string[]) => {
      await generateBatchImages(projectId, { episodeId: activeEpisodeId ?? undefined, shotIds })
      setShowBatchImageDialog(false)
    },
    [projectId, activeEpisodeId, generateBatchImages]
  )

  const handleBatchGenerateVideos = useCallback(
    (shotIds: string[]) => {
      generateBatchVideos(projectId, { episodeId: activeEpisodeId ?? undefined, shotIds })
      setShowBatchVideoDialog(false)
    },
    [generateBatchVideos, projectId, activeEpisodeId]
  )

  const handleUpdateShot = useCallback(
    (episodeId: string, shotId: string, data: Partial<ShotInput>) => {
      updateShot(episodeId, shotId, data)
    },
    [updateShot]
  )

  // 键盘事件
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      const state = useScriptShotsStore.getState()
      const { scriptShotPlans: plans, activeShotId, activeEpisodeId: epId, duplicateShot: dup, setActiveShotId } = state

      const visiblePlans = epId ? plans.filter((p) => p.episodeId === epId) : plans
      const flatShots = visiblePlans.flatMap((plan) => plan.shots.map((shot) => ({ shot, scriptShotPlan: plan })))
      const idx = activeShotId ? flatShots.findIndex((item) => item.shot.id === activeShotId) : -1

      if (e.key === "ArrowLeft") {
        e.preventDefault()
        if (idx > 0) setActiveShotId(flatShots[idx - 1].shot.id)
      }
      if (e.key === "ArrowRight") {
        e.preventDefault()
        if (idx >= 0 && idx < flatShots.length - 1) setActiveShotId(flatShots[idx + 1].shot.id)
      }
      if ((e.key === "Delete" || e.key === "Backspace") && activeShotId && idx >= 0) {
        e.preventDefault()
        const current = flatShots[idx]
        setDeletingShotInfo({ episodeId: current.scriptShotPlan.episodeId, shotId: current.shot.id })
      }
      if (e.ctrlKey && e.key === "d" && activeShotId && idx >= 0) {
        e.preventDefault()
        const current = flatShots[idx]
        dup(current.scriptShotPlan.episodeId, current.shot.id)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  if (initialLoading) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex h-full max-h-[100dvh] min-h-0 flex-1 flex-col overflow-hidden">
      {/* Toolbar — 顶栏全宽贴边 */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b px-2.5 py-2.5 sm:px-3">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="truncate text-xl font-semibold text-foreground">
            分镜生成
          </h2>
          <div className="h-4 w-px shrink-0 bg-border" />
          <EpisodeSelector />
        </div>

        <div className="flex items-center gap-2">
          <ScriptShotToolbar
            generateStatus={generateStatus}
            batchImageStatus={batchImageStatus}
            batchImageProgress={batchImageProgress}
            canGenerateCurrentEpisode={!!activeEpisodeId}
            onGenerateCurrentEpisode={handleGenerateCurrentEpisode}
            onOpenBatchImageDialog={() => setShowBatchImageDialog(true)}
            batchVideoStatus={batchVideoStatus}
            batchVideoProgress={batchVideoProgress}
            onOpenBatchVideoDialog={() => setShowBatchVideoDialog(true)}
          />
        </div>
      </div>

      {/* Timeline content */}
      <div className="min-h-0 flex-1">
        <div className="relative h-full min-w-0">
          {isGenerating && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-[1px]">
              <div className="flex flex-col items-center justify-center gap-3 rounded-lg border bg-background p-6 shadow-lg">
                <Loader2 className="size-8 animate-spin text-primary" />
                <div className="text-center">
                  <p className="text-sm font-medium">正在生成分镜</p>
                  <p className="mt-1 text-xs text-muted-foreground">这可能需要几十秒时间...</p>
                </div>
              </div>
            </div>
          )}
          <div
            className={cn(
              "custom-scrollbar h-full min-w-0 space-y-3 overflow-y-auto pb-12",
              "border-border border-b bg-background"
            )}
          >
            {episodeLoading ? (
              <div className="flex min-h-[240px] items-center justify-center">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : currentScriptShotPlans.length > 0 ? (
              <div className={cn(
                "space-y-3",
                isGenerating ? "pointer-events-none opacity-60" : ""
              )}>
                {currentScriptShotPlans.map((plan) => (
                  <SceneSwimlane
                    key={plan.id}
                    scriptShotPlan={plan}
                    episodeDisplayNumber={episodeDisplayMap.get(plan.episodeId) ?? 1}
                    detailTab={activeDetailTab}
                    layout={shotLayout}
                    aspectRatio={aspectRatio}
                    assetCharacterMap={assetCharacterMap}
                    assetSceneMap={assetSceneMap}
                    assetPropMap={assetPropMap}
                    onSelectShot={handleSelectShot}
                    onDuplicateShot={handleDuplicateShot}
                    onDeleteShot={(episodeId, shotId) => setDeletingShotInfo({ episodeId, shotId })}
                    onAddShot={handleAddShot}
                    onGenerateImage={handleGenerateImage}
                    onGenerateVideo={handleGenerateVideo}
                    onPlayVideo={onPlayVideo}
                    onViewScript={setViewingScriptShotPlan}
                    onShotLayoutChange={setShotLayout}
                    onReorderShots={handleReorderShots}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <Clapperboard className="size-12 text-muted-foreground mb-4" />
                <h3 className="text-base font-medium mb-2">
                  {activeEpisodeId ? "该分集尚未生成分镜" : "选择一个分集"}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {activeEpisodeId
                    ? "点击上方「AI 生成分镜」按钮为该分集生成分镜设计"
                    : "从上方选择一个分集进行查看和编辑"}
                </p>
                {activeEpisodeId && (
                  <Button
                    size="sm"
                    onClick={handleGenerateCurrentEpisode}
                    disabled={isGenerating}
                  >
                    生成该集分镜
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Script lines dialog */}
      <ScriptLinesDialog
        open={!!viewingScriptShotPlan}
        onOpenChange={(open) => !open && setViewingScriptShotPlan(null)}
        scriptShotPlan={viewingScriptShotPlan}
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
                  handleDeleteShot(deletingShotInfo.episodeId, deletingShotInfo.shotId)
                }
              }}
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Generate storyboard type selection dialog */}
      <GenerateShotTypeDialog
        open={showShotTypeDialog}
        onCancel={() => setShowShotTypeDialog(false)}
        onConfirm={handleConfirmGenerate}
      />

      {/* Batch generate images dialog */}
      <BatchGenerateImagesDialog
        open={showBatchImageDialog}
        onOpenChange={setShowBatchImageDialog}
        shots={allFlatShots}
        onConfirm={handleBatchGenerateImages}
        onUpdateShot={handleUpdateShot}
        imageGeneratingIds={imageGeneratingIds}
      />

      {/* Batch generate videos dialog */}
      <BatchGenerateVideosDialog
        open={showBatchVideoDialog}
        onOpenChange={setShowBatchVideoDialog}
        shots={allFlatShots}
        onConfirm={handleBatchGenerateVideos}
        onUpdateShot={handleUpdateShot}
        videoGeneratingIds={videoGeneratingIds}
      />

    </div>
  )
}
