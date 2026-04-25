"use client"

import { useCallback, useMemo } from "react"
import { useParams } from "next/navigation"
import { useScriptShotsStore } from "@/store/script-shot-store"
import { parseJsonArray } from "@/lib/utils"
import type { ShotImageHistoryItem, ShotVideoHistoryItem, ShotInput, Shot, ScriptShotPlan } from "@/lib/types"
import { buildEpisodeDisplayNumberMap } from "@/lib/episode-display"
import {
  ResizableHandle,
  ResizablePanel,
} from "@/components/ui/resizable"
import { ShotPreviewPanel } from "./shot-preview-panel"
import { ShotDetailPanel } from "./shot-detail-panel"

interface ShotRightPanelsProps {
  aspectRatio: string
  onPlayVideo: (shotId: string) => void
}

function ShotRightPanelsContent({
  shot,
  scriptShotPlan,
  aspectRatio,
  onPlayVideo,
  episodeDisplayNumber,
}: {
  shot: Shot
  scriptShotPlan: ScriptShotPlan
  aspectRatio: string
  onPlayVideo: (shotId: string) => void
  episodeDisplayNumber: number
}) {
  const activeShotId = useScriptShotsStore((s) => s.activeShotId)
  const activeDetailTab = useScriptShotsStore((s) => s.activeDetailTab)
  const imageGeneratingIds = useScriptShotsStore((s) => s.imageGeneratingIds)
  const videoGeneratingIds = useScriptShotsStore((s) => s.videoGeneratingIds)
  const assetCharacters = useScriptShotsStore((s) => s.assetCharacters)
  const assetScenes = useScriptShotsStore((s) => s.assetScenes)
  const assetProps = useScriptShotsStore((s) => s.assetProps)
  const scriptShotPlans = useScriptShotsStore((s) => s.scriptShotPlans)

  const setActiveShotId = useScriptShotsStore((s) => s.setActiveShotId)
  const setDetailPanelOpen = useScriptShotsStore((s) => s.setDetailPanelOpen)
  const setActiveDetailTab = useScriptShotsStore((s) => s.setActiveDetailTab)
  const updateShot = useScriptShotsStore((s) => s.updateShot)
  const generateImage = useScriptShotsStore((s) => s.generateImage)
  const generateVideo = useScriptShotsStore((s) => s.generateVideo)
  const clearImage = useScriptShotsStore((s) => s.clearImage)
  const clearVideo = useScriptShotsStore((s) => s.clearVideo)
  const uploadImage = useScriptShotsStore((s) => s.uploadImage)
  const uploadVideo = useScriptShotsStore((s) => s.uploadVideo)

  const allFlatShots = useMemo(() => {
    const activeEpisodeId = useScriptShotsStore.getState().activeEpisodeId
    const visiblePlans = activeEpisodeId
      ? scriptShotPlans.filter((plan) => plan.episodeId === activeEpisodeId)
      : scriptShotPlans
    return visiblePlans.flatMap((plan) => plan.shots.map((shot) => ({ shot, scriptShotPlan: plan })))
  }, [scriptShotPlans])

  const activeShotIndex = useMemo(() => {
    return allFlatShots.findIndex((item) => item.shot.id === activeShotId)
  }, [allFlatShots, activeShotId])

  const hasPrevShot = activeShotIndex > 0
  const hasNextShot = activeShotIndex >= 0 && activeShotIndex < allFlatShots.length - 1

  const handlePrevShot = useCallback(() => {
    if (activeShotIndex > 0) {
      setActiveShotId(allFlatShots[activeShotIndex - 1].shot.id)
    }
  }, [activeShotIndex, allFlatShots, setActiveShotId])

  const handleNextShot = useCallback(() => {
    if (activeShotIndex >= 0 && activeShotIndex < allFlatShots.length - 1) {
      setActiveShotId(allFlatShots[activeShotIndex + 1].shot.id)
    }
  }, [activeShotIndex, allFlatShots, setActiveShotId])

  const handleClearImage = useCallback((target?: "first" | "last") => {
    clearImage(scriptShotPlan.episodeId, shot.id, target)
  }, [scriptShotPlan.episodeId, shot.id, clearImage])

  const handleClearVideo = useCallback(() => {
    clearVideo(scriptShotPlan.episodeId, shot.id)
  }, [scriptShotPlan.episodeId, shot.id, clearVideo])

  const handleUploadImage = useCallback(
    async (file: File, target?: "first" | "last") => {
      await uploadImage(scriptShotPlan.episodeId, shot.id, file, target)
    },
    [scriptShotPlan.episodeId, shot.id, uploadImage]
  )

  const handleUploadVideo = useCallback(
    async (file: File) => {
      await uploadVideo(scriptShotPlan.episodeId, shot.id, file)
    },
    [scriptShotPlan.episodeId, shot.id, uploadVideo]
  )

  const handleRestoreImageHistory = useCallback((item: ShotImageHistoryItem, target?: "first" | "last") => {
    const currentHistory = parseJsonArray<ShotImageHistoryItem>(shot.imageHistory)
    const urlToArchive = target === "last" ? shot.lastFrameUrl : shot.imageUrl

    const newHistory: ShotImageHistoryItem[] = urlToArchive && urlToArchive !== item.url && !currentHistory.some((h) => h.url === urlToArchive)
      ? [
          { url: urlToArchive, createdAt: new Date().toISOString() },
          ...currentHistory.filter((h) => h.url !== item.url),
        ]
      : currentHistory.filter((h) => h.url !== item.url)

    const update: Partial<ShotInput> = {
      imageStatus: "completed",
      imageHistory: JSON.stringify(newHistory),
    }

    if (target === "last") {
      update.lastFrameUrl = item.url
    } else {
      update.imageUrl = item.url
    }

    updateShot(scriptShotPlan.episodeId, shot.id, update)
  }, [shot, scriptShotPlan.episodeId, updateShot])

  const handleRestoreVideoHistory = useCallback((item: ShotVideoHistoryItem) => {
    const currentHistory = parseJsonArray<ShotVideoHistoryItem>(shot.videoHistory)
    const newHistory: ShotVideoHistoryItem[] = shot.videoUrl
      ? [
          { url: shot.videoUrl, videoDuration: shot.videoDuration, createdAt: new Date().toISOString() },
          ...currentHistory.filter((h) => h.url !== item.url || h.createdAt !== item.createdAt),
        ]
      : currentHistory.filter((h) => h.url !== item.url || h.createdAt !== item.createdAt)

    updateShot(scriptShotPlan.episodeId, shot.id, {
      videoUrl: item.url,
      videoDuration: item.videoDuration,
      videoStatus: "completed",
      videoHistory: JSON.stringify(newHistory),
    })
  }, [shot, scriptShotPlan.episodeId, updateShot])

  return (
    <>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={25} minSize="220px">
        <div className="h-full overflow-hidden border-r border-border bg-card">
          <ShotPreviewPanel
            shot={shot}
            aspectRatio={aspectRatio}
            activeTab={activeDetailTab}
            isGeneratingImage={imageGeneratingIds.has(shot.id)}
            isGeneratingVideo={videoGeneratingIds.has(shot.id)}
            onClearImage={handleClearImage}
            onClearVideo={handleClearVideo}
            onPlayVideo={shot.videoUrl ? () => onPlayVideo(shot.id) : undefined}
            onRestoreImageHistory={handleRestoreImageHistory}
            onRestoreVideoHistory={handleRestoreVideoHistory}
            onUploadImage={activeDetailTab === "image" ? handleUploadImage : undefined}
            onUploadVideo={activeDetailTab === "video" ? handleUploadVideo : undefined}
          />
        </div>
      </ResizablePanel>

      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={25} minSize="400px">
        <div className="h-full shrink-0 overflow-hidden bg-card">
          <ShotDetailPanel
            key={shot.id}
            shot={shot}
            scriptShotPlan={scriptShotPlan}
            episodeDisplayNumber={episodeDisplayNumber}
            aspectRatio={aspectRatio}
            activeTab={activeDetailTab}
            isGeneratingImage={imageGeneratingIds.has(shot.id)}
            isGeneratingVideo={videoGeneratingIds.has(shot.id)}
            assetCharacters={assetCharacters}
            assetScenes={assetScenes}
            assetProps={assetProps}
            onPrev={hasPrevShot ? handlePrevShot : null}
            onNext={hasNextShot ? handleNextShot : null}
            onClose={() => setDetailPanelOpen(false)}
            onTabChange={setActiveDetailTab}
            onUpdate={(episodeId, shotId, data) => updateShot(episodeId, shotId, data)}
            onGenerateImage={() => generateImage(scriptShotPlan.episodeId, shot.id)}
            onGenerateVideo={() => generateVideo(scriptShotPlan.episodeId, shot.id)}
          />
        </div>
      </ResizablePanel>
    </>
  )
}

export function ShotRightPanels({ aspectRatio, onPlayVideo }: ShotRightPanelsProps) {
  const params = useParams()
  const projectId = params.id as string

  const scriptShotPlans = useScriptShotsStore((s) => s.scriptShotPlans)
  const activeShotId = useScriptShotsStore((s) => s.activeShotId)
  const detailPanelOpen = useScriptShotsStore((s) => s.detailPanelOpen)
  const episodes = useScriptShotsStore((s) => s.episodes)

  let currentActiveShot: { shot: Shot; scriptShotPlan: ScriptShotPlan } | null = null
  if (activeShotId) {
    for (const plan of scriptShotPlans) {
      const shot = plan.shots.find((item) => item.id === activeShotId)
      if (shot) {
        currentActiveShot = { shot, scriptShotPlan: plan }
        break
      }
    }
  }

  const episodeDisplayMap = buildEpisodeDisplayNumberMap(episodes.filter((e) => e.projectId === projectId))

  if (!detailPanelOpen || !currentActiveShot) return null

  return (
    <ShotRightPanelsContent
      shot={currentActiveShot.shot}
      scriptShotPlan={currentActiveShot.scriptShotPlan}
      aspectRatio={aspectRatio}
      onPlayVideo={onPlayVideo}
      episodeDisplayNumber={episodeDisplayMap.get(currentActiveShot.scriptShotPlan.episodeId) ?? 1}
    />
  )
}
