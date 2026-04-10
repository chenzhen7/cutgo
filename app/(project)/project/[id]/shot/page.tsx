"use client"

import { useCallback, useEffect, useMemo, useState, useRef } from "react"
import { useParams } from "next/navigation"
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
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { ScriptShotToolbar } from "./components/script-shot-toolbar"
import { EpisodeSelector } from "./components/episode-selector"
import { SceneSwimlane } from "./components/scene-swimlane"
import { ShotDetailPanel } from "./components/shot-detail-panel"
import { ShotPreviewPanel } from "./components/shot-preview-panel"
import { ScriptLinesDialog } from "./components/script-lines-dialog"
import { VideoPreviewDialog } from "./components/video-preview-dialog"
import { GenerateShotTypeDialog } from "./components/generate-shot-type-dialog"
import type { ScriptShotPlan, ShotInput, Shot, ImageType, GridLayout, Project } from "@/lib/types"
import { buildEpisodeDisplayNumberMap, sortEpisodesByChapterAndIndex } from "@/lib/episode-display"
import { apiFetch } from "@/lib/api-client"

export default function ScriptShotPage() {
  const params = useParams()
  const projectId = params.id as string

  const {
    scriptShotPlans,
    episodes,
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
    videoGeneratingIds,
    batchVideoStatus,
    batchVideoProgress,
    fetchScriptShotPlans,
    fetchEpisodes,
    fetchAssets,
    generateScriptShots,
    addShot,
    updateShot,
    deleteShot,
    duplicateShot,
    generateImage,
    generateBatchImages,
    clearImage,
    generateVideo,
    generateBatchVideos,
    clearVideo,
    reorderShots,
    setActiveEpisodeId,
    setActiveShotId,
    setDetailPanelOpen,
    shotLayout,
    setShotLayout,
  } = useScriptShotsStore()

  const currentScriptShotPlans = useMemo(() => {
    if (!activeEpisodeId) return scriptShotPlans
    return scriptShotPlans.filter((sb) => sb.episodeId === activeEpisodeId)
  }, [scriptShotPlans, activeEpisodeId])

  const currentActiveShot = useMemo(() => {
    if (!activeShotId) return null
    for (const sb of scriptShotPlans) {
      const shot = sb.shots.find((s) => s.id === activeShotId)
      if (shot) return { shot, scriptShotPlan: sb }
    }
    return null
  }, [scriptShotPlans, activeShotId])

  const allFlatShots = useMemo(() => {
    const episodeSbs = activeEpisodeId
      ? scriptShotPlans.filter((sb) => sb.episodeId === activeEpisodeId)
      : scriptShotPlans
    return episodeSbs.flatMap((sb) => sb.shots.map((shot) => ({ shot, scriptShotPlan: sb })))
  }, [scriptShotPlans, activeEpisodeId])

  const activeShotIndex = useMemo(() => {
    if (!activeShotId) return -1
    return allFlatShots.findIndex((item) => item.shot.id === activeShotId)
  }, [allFlatShots, activeShotId])

  const hasPrevShot = activeShotIndex > 0
  const hasNextShot = activeShotIndex >= 0 && activeShotIndex < allFlatShots.length - 1

  const [initialLoading, setInitialLoading] = useState(true)
  const [episodeLoading, setEpisodeLoading] = useState(false)
  const [aspectRatio, setAspectRatio] = useState<string>("9:16")
  const [activeDetailTab, setActiveDetailTab] = useState<"image" | "video">("image")
  const [deletingShotInfo, setDeletingShotInfo] = useState<{ episodeId: string; shotId: string } | null>(null)
  const [showShotTypeDialog, setShowShotTypeDialog] = useState(false)
  const [viewingScriptShotPlan, setViewingScriptShotPlan] = useState<ScriptShotPlan | null>(null)

  const [videoPreviewShot, setVideoPreviewShot] = useState<Shot | null>(null)

  useEffect(() => {
    const init = async () => {
      setInitialLoading(true)
      const [eps] = await Promise.all([
        fetchEpisodes(projectId),
        fetchAssets(projectId),
        apiFetch<Project>(`/api/projects/${projectId}`).then((proj) => {
          setAspectRatio(proj.aspectRatio || "9:16")
        }).catch(() => { }),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const prevEpisodeIdRef = useRef(activeEpisodeId)

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
    return () => {
      cancelled = true
    }
  }, [projectId, activeEpisodeId, fetchScriptShotPlans, setActiveShotId])

  const hasExistingShots = useMemo(
    () => currentScriptShotPlans.length > 0 && currentScriptShotPlans.some(p => p.shots.length > 0),
    [currentScriptShotPlans]
  )

  const defaultShotType = useMemo(() => {
    const plan = currentScriptShotPlans.find(p => p.episodeId === activeEpisodeId)
    return plan?.episode?.shotType as ImageType | undefined
  }, [currentScriptShotPlans, activeEpisodeId])

  const handleGenerateCurrentEpisode = useCallback(() => {
    if (!activeEpisodeId) return
    setShowShotTypeDialog(true)
  }, [activeEpisodeId])

  const handleConfirmGenerate = useCallback(async (imageType: ImageType, gridLayout: GridLayout | null) => {
    if (!activeEpisodeId) return
    setShowShotTypeDialog(false)
    setDetailPanelOpen(false)
    await generateScriptShots(projectId, [activeEpisodeId], imageType, gridLayout)
    // 生成流程包含先删后建，完成后主动重拉，确保页面显示最新镜头列表
    await fetchScriptShotPlans(projectId, activeEpisodeId)
  }, [projectId, activeEpisodeId, generateScriptShots, fetchScriptShotPlans, setDetailPanelOpen])

  const handleDeleteShot = useCallback(
    async (episodeId: string, shotId: string) => {
      await deleteShot(episodeId, shotId)
      setDeletingShotInfo(null)
      if (activeShotId === shotId) {
        setActiveShotId(null)
      }
    },
    [deleteShot, activeShotId, setActiveShotId]
  )

  const handleViewScript = useCallback(
    (plan: ScriptShotPlan) => {
      setViewingScriptShotPlan(plan)
    },
    []
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

  const handleConfirmDeleteShot = useCallback(
    (episodeId: string, shotId: string) => {
      setDeletingShotInfo({ episodeId, shotId })
    },
    []
  )

  const handleAddShot = useCallback(
    async (episodeId: string) => {
      await addShot(episodeId, {
        prompt: "Storyboard prompt: cinematic scene, detailed environment, dramatic lighting, photorealistic",
      })
    },
    [addShot]
  )

  const handleUpdateShot = useCallback(
    (episodeId: string, shotId: string, data: Partial<ShotInput>) => {
      updateShot(episodeId, shotId, data)
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
    if (activeShotIndex > 0) {
      setActiveShotId(allFlatShots[activeShotIndex - 1].shot.id)
    }
  }, [activeShotIndex, allFlatShots, setActiveShotId])

  const handleNextShot = useCallback(() => {
    if (activeShotIndex >= 0 && activeShotIndex < allFlatShots.length - 1) {
      setActiveShotId(allFlatShots[activeShotIndex + 1].shot.id)
    }
  }, [activeShotIndex, allFlatShots, setActiveShotId])

  const handleGenerateImage = useCallback(
    (episodeId: string, shotId: string) => {
      generateImage(episodeId, shotId)
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
    if (currentActiveShot) {
      clearImage(currentActiveShot.scriptShotPlan.episodeId, currentActiveShot.shot.id)
    }
  }, [currentActiveShot, clearImage])

  const handleGenerateVideo = useCallback(
    (episodeId: string, shotId: string) => {
      generateVideo(episodeId, shotId)
    },
    [generateVideo]
  )

  const handleClearVideo = useCallback(() => {
    if (currentActiveShot) {
      clearVideo(currentActiveShot.scriptShotPlan.episodeId, currentActiveShot.shot.id)
    }
  }, [currentActiveShot, clearVideo])

  const handleBatchGenerateVideos = useCallback(
    (mode: "all" | "missing_only") => {
      generateBatchVideos(projectId, { mode })
    },
    [generateBatchVideos, projectId]
  )

  const handleBatchGenerateEpisodeVideos = useCallback(() => {
    if (!activeEpisodeId) return
    generateBatchVideos(projectId, { episodeId: activeEpisodeId, mode: "missing_only" })
  }, [activeEpisodeId, generateBatchVideos, projectId])

  const handlePlayVideo = useCallback(
    (shotId: string) => {
      const allShots = scriptShotPlans.flatMap((plan) => plan.shots)
      const shot = allShots.find((s) => s.id === shotId)
      if (shot?.videoUrl) setVideoPreviewShot(shot)
    },
    [scriptShotPlans]
  )

  const handleVideoPreviewPrev = useCallback(() => {
    if (!videoPreviewShot) return
    const allShots = scriptShotPlans.flatMap((plan) => plan.shots).filter((s) => s.videoUrl)
    const idx = allShots.findIndex((s) => s.id === videoPreviewShot.id)
    if (idx > 0) setVideoPreviewShot(allShots[idx - 1])
  }, [videoPreviewShot, scriptShotPlans])

  const handleVideoPreviewNext = useCallback(() => {
    if (!videoPreviewShot) return
    const allShots = scriptShotPlans.flatMap((plan) => plan.shots).filter((s) => s.videoUrl)
    const idx = allShots.findIndex((s) => s.id === videoPreviewShot.id)
    if (idx < allShots.length - 1) setVideoPreviewShot(allShots[idx + 1])
  }, [videoPreviewShot, scriptShotPlans])

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
      if ((e.key === "Delete" || e.key === "Backspace") && currentActiveShot) {
        e.preventDefault()
        setDeletingShotInfo({ episodeId: currentActiveShot.scriptShotPlan.episodeId, shotId: currentActiveShot.shot.id })
      }
      if (e.ctrlKey && e.key === "d" && currentActiveShot) {
        e.preventDefault()
        duplicateShot(currentActiveShot.scriptShotPlan.episodeId, currentActiveShot.shot.id)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [currentActiveShot, handlePrevShot, handleNextShot, duplicateShot])

  const isGenerating = generateStatus === "generating"

  const episodesForProject = useMemo(
    () => episodes.filter((e) => e.projectId === projectId),
    [episodes, projectId]
  )
  const episodeDisplayMap = useMemo(
    () => buildEpisodeDisplayNumberMap(episodesForProject),
    [episodesForProject]
  )

  if (initialLoading) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex h-full max-h-[100dvh] min-h-0 flex-1 flex-col overflow-hidden">
      {/* Generate error — 全宽贴边条 */}
      {generateStatus === "error" && generateError && (
        <div className="shrink-0 border-b border-destructive/30 bg-destructive/5">
          <div className="px-2.5 py-2.5 sm:px-3">
            <p className="text-sm text-destructive">{generateError}</p>
            <button
              onClick={handleGenerateCurrentEpisode}
              disabled={!activeEpisodeId}
              className="mt-2 text-sm text-destructive underline hover:no-underline"
            >
              重试
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <>
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
              onBatchGenerateImages={handleBatchGenerateImages}
              onBatchGenerateEpisodeImages={handleBatchGenerateEpisodeImages}
              batchVideoStatus={batchVideoStatus}
              batchVideoProgress={batchVideoProgress}
              onBatchGenerateVideos={handleBatchGenerateVideos}
              onBatchGenerateEpisodeVideos={handleBatchGenerateEpisodeVideos}
            />
          </div>
        </div>

        {/* Main layout — 主区水平贴边 */}
        <div className="min-h-0 flex-1">
          <ResizablePanelGroup orientation="horizontal" className="h-full">
            {/* Left: Timeline editor */}
            <ResizablePanel defaultSize={50} minSize="350px">
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
                    detailPanelOpen ? "bg-muted/10" : "border-border border-b bg-background"
                  )}
                >
                {episodeLoading ? (
                  <div className="flex min-h-[240px] items-center justify-center">
                    <Loader2 className="size-5 animate-spin text-muted-foreground" />
                  </div>
                ) : currentScriptShotPlans.length > 0 ? (
                  <div className={cn(
                      "space-y-3",
                      detailPanelOpen ? "p-0" : "",
                      isGenerating ? "pointer-events-none opacity-60" : ""
                    )}>
                      {currentScriptShotPlans.map((plan) => (
                        <SceneSwimlane
                          key={plan.id}
                          scriptShotPlan={plan}
                          episodeDisplayNumber={
                            episodeDisplayMap.get(plan.episodeId) ?? 1
                          }
                          activeShotId={activeShotId}
                          selectedShotIds={selectedShotIds}
                          imageGeneratingIds={imageGeneratingIds}
                          videoGeneratingIds={videoGeneratingIds}
                          layout={shotLayout}
                          aspectRatio={aspectRatio}
                          assetCharacters={assetCharacters}
                          assetScenes={assetScenes}
                          assetProps={assetProps}
                          onSelectShot={handleSelectShot}
                          onDuplicateShot={handleDuplicateShot}
                          onDeleteShot={handleConfirmDeleteShot}
                          onAddShot={handleAddShot}
                          onGenerateImage={handleGenerateImage}
                          onGenerateVideo={handleGenerateVideo}
                          onPlayVideo={handlePlayVideo}
                          onViewScript={handleViewScript}
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
            </ResizablePanel>

            {/* Middle: Image/Video preview */}
            {detailPanelOpen && currentActiveShot && (
              <>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={25} minSize="220px">
                  <div className="h-full overflow-hidden border-r border-border bg-card">
                    <ShotPreviewPanel
                      shot={currentActiveShot.shot}
                      aspectRatio={aspectRatio}
                      activeTab={activeDetailTab}
                      isGeneratingImage={imageGeneratingIds.has(currentActiveShot.shot.id)}
                      isGeneratingVideo={videoGeneratingIds.has(currentActiveShot.shot.id)}
                      onTabChange={setActiveDetailTab}
                      onClearImage={handleClearImage}
                      onClearVideo={handleClearVideo}
                      onPlayVideo={currentActiveShot.shot.videoUrl ? () => handlePlayVideo(currentActiveShot.shot.id) : undefined}
                      onPrev={hasPrevShot ? handlePrevShot : null}
                      onNext={hasNextShot ? handleNextShot : null}
                      onClose={() => setDetailPanelOpen(false)}
                    />
                  </div>
                </ResizablePanel>
              </>
            )}

            {/* Right: Shot detail panel */}
            {detailPanelOpen && currentActiveShot && (
              <>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={25} minSize="300px">
                  <div className="h-full shrink-0 overflow-hidden bg-card">
                    <ShotDetailPanel
                      shot={currentActiveShot.shot}
                      scriptShotPlan={currentActiveShot.scriptShotPlan}
                      episodeDisplayNumber={
                        episodeDisplayMap.get(
                          currentActiveShot.scriptShotPlan.episodeId
                        ) ?? 1
                      }
                      aspectRatio={aspectRatio}
                      activeTab={activeDetailTab}
                      isGeneratingImage={imageGeneratingIds.has(currentActiveShot.shot.id)}
                      isGeneratingVideo={videoGeneratingIds.has(currentActiveShot.shot.id)}
                      assetCharacters={assetCharacters}
                      assetScenes={assetScenes}
                      assetProps={assetProps}
                      onTabChange={setActiveDetailTab}
                      onUpdate={handleUpdateShot}
                      onGenerateImage={() => handleGenerateImage(currentActiveShot.scriptShotPlan.episodeId, currentActiveShot.shot.id)}
                      onGenerateVideo={() => handleGenerateVideo(currentActiveShot.scriptShotPlan.episodeId, currentActiveShot.shot.id)}
                    />
                  </div>
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </div>

      </>

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
        hasExistingShots={hasExistingShots}
        defaultShotType={defaultShotType}
        onCancel={() => setShowShotTypeDialog(false)}
        onConfirm={handleConfirmGenerate}
      />

      {/* Video preview dialog */}
      <VideoPreviewDialog
        open={!!videoPreviewShot}
        onOpenChange={(open) => !open && setVideoPreviewShot(null)}
        shot={videoPreviewShot}
        onPrev={handleVideoPreviewPrev}
        onNext={handleVideoPreviewNext}
      />
    </div>
  )
}
