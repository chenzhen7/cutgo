"use client"

import { useCallback, useMemo, useState } from "react"
import { useScriptShotsStore } from "@/store/script-shot-store"
import { ScriptShotToolbar } from "./script-shot-toolbar"
import { EpisodeSelector } from "./episode-selector"
import { GenerateShotTypeDialog } from "./generate-shot-type-dialog"
import { BatchGenerateImagesDialog } from "./batch-generate-images-dialog"
import { BatchGenerateVideosDialog } from "./batch-generate-videos-dialog"
import type { ShotInput } from "@/lib/types"

interface ScriptShotPageHeaderProps {
  projectId: string
}

export function ScriptShotPageHeader({ projectId }: ScriptShotPageHeaderProps) {
  const scriptShotPlans = useScriptShotsStore((s) => s.scriptShotPlans)
  const generateStatus = useScriptShotsStore((s) => s.generateStatus)
  const activeEpisodeId = useScriptShotsStore((s) => s.activeEpisodeId)
  const batchImageStatus = useScriptShotsStore((s) => s.batchImageStatus)
  const batchImageProgress = useScriptShotsStore((s) => s.batchImageProgress)
  const batchVideoStatus = useScriptShotsStore((s) => s.batchVideoStatus)
  const batchVideoProgress = useScriptShotsStore((s) => s.batchVideoProgress)
  const imageGeneratingIds = useScriptShotsStore((s) => s.imageGeneratingIds)
  const videoGeneratingIds = useScriptShotsStore((s) => s.videoGeneratingIds)

  const generateScriptShots = useScriptShotsStore((s) => s.generateScriptShots)
  const fetchScriptShotPlans = useScriptShotsStore((s) => s.fetchScriptShotPlans)
  const setDetailPanelOpen = useScriptShotsStore((s) => s.setDetailPanelOpen)
  const generateBatchImages = useScriptShotsStore((s) => s.generateBatchImages)
  const generateBatchVideos = useScriptShotsStore((s) => s.generateBatchVideos)
  const updateShot = useScriptShotsStore((s) => s.updateShot)

  const [showShotTypeDialog, setShowShotTypeDialog] = useState(false)
  const [showBatchImageDialog, setShowBatchImageDialog] = useState(false)
  const [showBatchVideoDialog, setShowBatchVideoDialog] = useState(false)

  const hasExistingShots = useMemo(() => {
    if (!activeEpisodeId) return false
    const plans = scriptShotPlans.filter((sb) => sb.episodeId === activeEpisodeId)
    return plans.length > 0 && plans.some((p) => p.shots.length > 0)
  }, [scriptShotPlans, activeEpisodeId])

  const allFlatShots = useMemo(() => {
    const visiblePlans = activeEpisodeId
      ? scriptShotPlans.filter((plan) => plan.episodeId === activeEpisodeId)
      : scriptShotPlans
    return visiblePlans.flatMap((plan) =>
      plan.shots.map((shot) => ({ shot, scriptShotPlan: plan }))
    )
  }, [scriptShotPlans, activeEpisodeId])

  const handleConfirmGenerate = useCallback(async () => {
    if (!activeEpisodeId) return
    setShowShotTypeDialog(false)
    setDetailPanelOpen(false)
    await generateScriptShots(projectId, [activeEpisodeId])
    await fetchScriptShotPlans(projectId, activeEpisodeId)
  }, [
    projectId,
    activeEpisodeId,
    generateScriptShots,
    fetchScriptShotPlans,
    setDetailPanelOpen,
  ])

  const handleGenerateCurrentEpisode = useCallback(() => {
    if (!activeEpisodeId) return
    if (hasExistingShots) {
      setShowShotTypeDialog(true)
      return
    }
    void handleConfirmGenerate()
  }, [activeEpisodeId, hasExistingShots, handleConfirmGenerate])

  const handleBatchGenerateImages = useCallback(
    async (shotIds: string[]) => {
      await generateBatchImages(projectId, {
        episodeId: activeEpisodeId ?? undefined,
        shotIds,
      })
      setShowBatchImageDialog(false)
    },
    [projectId, activeEpisodeId, generateBatchImages]
  )

  const handleBatchGenerateVideos = useCallback(
    (shotIds: string[]) => {
      generateBatchVideos(projectId, {
        episodeId: activeEpisodeId ?? undefined,
        shotIds,
      })
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

  return (
    <>
      {/* Toolbar */}
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
    </>
  )
}
