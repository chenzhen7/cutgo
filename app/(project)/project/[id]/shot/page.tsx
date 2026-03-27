"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { useScriptShotsStore } from "@/store/script-shot-store"
import { Button } from "@/components/ui/button"
import { Loader2, LayoutGrid, ArrowLeft } from "lucide-react"
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
import { EpisodeSelectView } from "./components/episode-select-view"
import { SceneSwimlane } from "./components/scene-swimlane"
import { ShotDetailPanel } from "./components/shot-detail-panel"
import { ScriptLinesDialog } from "./components/script-lines-dialog"
import { VideoPreviewDialog } from "./components/video-preview-dialog"
import type { ShotCardDisplayMode } from "./components/shot-card"
import type { ScriptShotPlan, ShotInput, Shot } from "@/lib/types"
import { buildEpisodeDisplayNumberMap, sortEpisodesByChapterAndIndex } from "@/lib/episode-display"

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
    setActiveEpisodeId,
    setActiveShotId,
    setDetailPanelOpen,
    confirmScriptShots,
    activeEpisodeScriptShots,
    activeShot,
    nextShot,
    prevShot,
  } = useScriptShotsStore()

  const [view, setView] = useState<"episode-select" | "script-shot-list">("episode-select")
  const [loading, setLoading] = useState(true)
  const [deletingShotInfo, setDeletingShotInfo] = useState<{ episodeId: string; shotId: string } | null>(null)
  const [viewingScriptShotPlan, setViewingScriptShotPlan] = useState<ScriptShotPlan | null>(null)

  // Video generation mock state
  const [videoGeneratingIds, setVideoGeneratingIds] = useState<Set<string>>(new Set())
  const [batchVideoStatus, setBatchVideoStatus] = useState<"idle" | "generating" | "completed" | "error">("idle")
  const [batchVideoProgress, setBatchVideoProgress] = useState<{ current: number; total: number } | null>(null)
  const [videoPreviewShot, setVideoPreviewShot] = useState<Shot | null>(null)
  const [shotDisplayMode, setShotDisplayMode] = useState<ShotCardDisplayMode>("composition")

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      const [eps] = await Promise.all([
        fetchEpisodes(projectId),
        fetchScriptShotPlans(projectId),
        fetchAssets(projectId),
      ])

      // 如果没有选中的分集，且有分集数据，默认选中第一个
      if (!activeEpisodeId && eps && eps.length > 0) {
        const sorted = sortEpisodesByChapterAndIndex(eps)
        setActiveEpisodeId(sorted[0].id)
      }

      setLoading(false)
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const handleEnterEpisode = useCallback(
    (episodeId: string) => {
      setActiveEpisodeId(episodeId)
      setView("script-shot-list")
    },
    [setActiveEpisodeId]
  )

  const handleBackToEpisodeSelect = useCallback(() => {
    setView("episode-select")
  }, [])

  const handleGenerateAll = useCallback(
    async (mode: "skip_existing" | "overwrite") => {
      await generateScriptShots(projectId, undefined, mode)
    },
    [projectId, generateScriptShots]
  )

  const handleGenerateEpisodes = useCallback(
    async (episodeIds: string[]) => {
      await generateScriptShots(projectId, episodeIds, "overwrite")
    },
    [projectId, generateScriptShots]
  )

  const handleRegenerateScript = useCallback(
    async (episodeId: string) => {
      await generateScriptShots(projectId, [episodeId], "overwrite")
    },
    [projectId, generateScriptShots]
  )

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

  const handleAddShot = useCallback(
    async (episodeId: string) => {
      await addShot(episodeId, {
        shotSize: "medium",
        composition: "新画面描述",
        prompt: "Cinematic scene, detailed environment, dramatic lighting, photorealistic",
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
    const prev = prevShot()
    if (prev) setActiveShotId(prev.shot.id)
  }, [prevShot, setActiveShotId])

  const handleNextShot = useCallback(() => {
    const next = nextShot()
    if (next) setActiveShotId(next.shot.id)
  }, [nextShot, setActiveShotId])

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
    const active = activeShot()
    if (active) {
      clearImage(active.scriptShotPlan.episodeId, active.shot.id)
    }
  }, [activeShot, clearImage])

  // Mock: simulate single shot video generation (3-5s delay)
  const handleGenerateVideo = useCallback(
    (scriptId: string, shotId: string) => {
      setVideoGeneratingIds((prev) => new Set(prev).add(shotId))
      const delay = 3000 + Math.random() * 2000
      setTimeout(() => {
        setVideoGeneratingIds((prev) => {
          const next = new Set(prev)
          next.delete(shotId)
          return next
        })
        updateShot(scriptId, shotId, {
          videoUrl: `/testVideo.mp4`,
          videoStatus: "completed",
          videoDuration: "5s",
        } as Partial<ShotInput>)
      }, delay)
    },
    [updateShot]
  )

  const handleClearVideo = useCallback(() => {
    const active = activeShot()
    if (active) {
      updateShot(active.scriptShotPlan.id, active.shot.id, {
        videoUrl: undefined,
        videoStatus: undefined,
        videoDuration: undefined,
      } as Partial<ShotInput>)
    }
  }, [activeShot, updateShot])

  // Mock: batch video generation
  const handleBatchGenerateVideos = useCallback(
    (mode: "all" | "missing_only") => {
      const allShots = scriptShotPlans.flatMap((plan) =>
        plan.shots.filter((s) => s.imageUrl).map((s) => ({ episodeId: plan.id, shot: s }))
      )
      const targets = mode === "missing_only"
        ? allShots.filter((s) => !s.shot.videoUrl)
        : allShots
      if (targets.length === 0) return

      setBatchVideoStatus("generating")
      setBatchVideoProgress({ current: 0, total: targets.length })

      targets.forEach((target, i) => {
        const delay = (i + 1) * 1500 + Math.random() * 1000
        setVideoGeneratingIds((prev) => new Set(prev).add(target.shot.id))
        setTimeout(() => {
          setVideoGeneratingIds((prev) => {
            const next = new Set(prev)
            next.delete(target.shot.id)
            return next
          })
          updateShot(target.episodeId, target.shot.id, {
            videoUrl: `/testVideo.mp4`,
            videoStatus: "completed",
            videoDuration: "5s",
          } as Partial<ShotInput>)
          setBatchVideoProgress((prev) => prev ? { ...prev, current: prev.current + 1 } : null)
          if (i === targets.length - 1) {
            setBatchVideoStatus("completed")
            setTimeout(() => {
              setBatchVideoStatus("idle")
              setBatchVideoProgress(null)
            }, 2000)
          }
        }, delay)
      })
    },
    [scriptShotPlans, updateShot]
  )

  const handleBatchGenerateEpisodeVideos = useCallback(() => {
    if (!activeEpisodeId) return
    const episodePlans = scriptShotPlans.filter((plan) => plan.episodeId === activeEpisodeId)
    const targets = episodePlans.flatMap((plan) =>
      plan.shots.filter((s) => s.imageUrl && !s.videoUrl).map((s) => ({ episodeId: plan.id, shot: s }))
    )
    if (targets.length === 0) return

    setBatchVideoStatus("generating")
    setBatchVideoProgress({ current: 0, total: targets.length })

      targets.forEach((target, i) => {
      const delay = (i + 1) * 1500 + Math.random() * 1000
      setVideoGeneratingIds((prev) => new Set(prev).add(target.shot.id))
      setTimeout(() => {
        setVideoGeneratingIds((prev) => {
          const next = new Set(prev)
          next.delete(target.shot.id)
          return next
        })
        updateShot(target.episodeId, target.shot.id, {
          videoUrl: `/testVideo.mp4`,
          videoStatus: "completed",
          videoDuration: "5s",
        } as Partial<ShotInput>)
        setBatchVideoProgress((prev) => prev ? { ...prev, current: prev.current + 1 } : null)
        if (i === targets.length - 1) {
          setBatchVideoStatus("completed")
          setTimeout(() => {
            setBatchVideoStatus("idle")
            setBatchVideoProgress(null)
          }, 2000)
        }
      }, delay)
    })
  }, [activeEpisodeId, scriptShotPlans, updateShot])

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
      if ((e.key === "Delete" || e.key === "Backspace") && activeShotId) {
        e.preventDefault()
        const active = activeShot()
        if (active) {
          setDeletingShotInfo({ episodeId: active.scriptShotPlan.episodeId, shotId: active.shot.id })
        }
      }
      if (e.ctrlKey && e.key === "d" && activeShotId) {
        e.preventDefault()
        const active = activeShot()
        if (active) duplicateShot(active.scriptShotPlan.episodeId, active.shot.id)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [activeShotId, handlePrevShot, handleNextShot, activeShot, duplicateShot])

  const currentScriptShotPlans = activeEpisodeScriptShots()
  const currentActiveShot = activeShot()
  const isGenerating = generateStatus === "generating"

  const imageStats = useMemo(() => {
    const allShots = scriptShotPlans.flatMap((plan) => plan.shots)
    return {
      withImage: allShots.filter((s) => s.imageUrl).length,
      total: allShots.length,
    }
  }, [scriptShotPlans])

  const episodesForProject = useMemo(
    () => episodes.filter((e) => e.projectId === projectId),
    [episodes, projectId]
  )
  const episodeDisplayMap = useMemo(
    () => buildEpisodeDisplayNumberMap(episodesForProject),
    [episodesForProject]
  )

  if (loading) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // 分集选择视图
  if (view === "episode-select") {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto custom-scrollbar">
        <EpisodeSelectView
          episodes={episodes}
          scriptShotPlans={scriptShotPlans}
          onSelectEpisode={handleEnterEpisode}
        />
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Generate error — 全宽贴边条 */}
      {generateStatus === "error" && generateError && (
        <div className="shrink-0 border-b border-destructive/30 bg-destructive/5">
          <div className="px-2.5 py-2.5 sm:px-3">
            <p className="text-sm text-destructive">{generateError}</p>
            <button
              onClick={() => handleGenerateAll("skip_existing")}
              className="mt-2 text-sm text-destructive underline hover:no-underline"
            >
              重试
            </button>
          </div>
        </div>
      )}

      {/* Generating progress */}
      {isGenerating && (
        <div className="flex shrink-0 items-center gap-3 border-b bg-muted/30 px-2.5 py-2.5 sm:px-3">
          <Loader2 className="size-5 shrink-0 animate-spin text-primary" />
          <div className="min-w-0">
            <p className="text-sm font-medium">正在生成分镜...</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              AI 正在为每个场景生成分镜设计，请稍候
            </p>
          </div>
        </div>
      )}

      {/* Main content */}
      <>
          {/* Toolbar — 顶栏全宽贴边 */}
          <div className="flex shrink-0 items-center justify-between gap-2 border-b px-2.5 py-2.5 sm:px-3">
            <div className="flex min-w-0 items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToEpisodeSelect}
                className="-ml-1.5 shrink-0 gap-1.5 text-muted-foreground hover:text-foreground sm:-ml-2"
              >
                <ArrowLeft className="size-4" />
                分集
              </Button>
              <div className="h-4 w-px shrink-0 bg-border" />

              <h2 className="truncate text-xl font-semibold text-foreground">
                分镜生成
              </h2>
            </div>

            <ScriptShotToolbar
              generateStatus={generateStatus}
              batchImageStatus={batchImageStatus}
              batchImageProgress={batchImageProgress}
              onGenerateAll={handleGenerateAll}
              onBatchGenerateImages={handleBatchGenerateImages}
              onBatchGenerateEpisodeImages={handleBatchGenerateEpisodeImages}
              batchVideoStatus={batchVideoStatus}
              batchVideoProgress={batchVideoProgress}
              onBatchGenerateVideos={handleBatchGenerateVideos}
              onBatchGenerateEpisodeVideos={handleBatchGenerateEpisodeVideos}
            />
          </div>

          {/* Two-column layout — 主区水平贴边 */}
          <div className="min-h-0 flex-1">
            <ResizablePanelGroup orientation="horizontal" className="h-full">
              {/* Center: Timeline editor */}
              <ResizablePanel defaultSize={60} minSize={30}>
                <div
                  className={cn(
                    "custom-scrollbar h-full min-w-0 space-y-3 overflow-y-auto  pb-12 ",
                    detailPanelOpen
                      ? "bg-muted/10"
                      : "border-border border-b bg-background"
                  )}
                >
                  {currentScriptShotPlans.length > 0 ? (
                    <div className={cn(
                      "space-y-3",
                      detailPanelOpen ? "p-0" : ""
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
                          shotDisplayMode={shotDisplayMode}
                          assetCharacters={assetCharacters}
                          assetScenes={assetScenes}
                          assetProps={assetProps}
                          onSelectShot={handleSelectShot}
                          onDuplicateShot={(episodeId, shotId) => duplicateShot(episodeId, shotId)}
                          onDeleteShot={(episodeId, shotId) => setDeletingShotInfo({ episodeId, shotId })}
                          onAddShot={handleAddShot}
                          onGenerateImage={handleGenerateImage}
                          onGenerateVideo={handleGenerateVideo}
                          onPlayVideo={handlePlayVideo}
                          onRegenerateScript={handleRegenerateScript}
                          onViewScript={(plan) => setViewingScriptShotPlan(plan)}
                          onToggleShotDisplayMode={() => setShotDisplayMode((m) => m === "composition" ? "prompts" : "composition")}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                      <LayoutGrid className="size-12 text-muted-foreground mb-4" />
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
                          onClick={() => handleGenerateEpisodes([activeEpisodeId])}
                          disabled={isGenerating}
                        >
                          生成该集分镜
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </ResizablePanel>

              {/* Right: Shot detail panel */}
              {detailPanelOpen && currentActiveShot && (
                <>
                  <ResizableHandle withHandle />
                  <ResizablePanel defaultSize={40} minSize={20}>
                    <div className="h-full shrink-0 overflow-hidden border-r border-border bg-card">
                      <ShotDetailPanel
                        shot={currentActiveShot.shot}
                        scriptShotPlan={currentActiveShot.scriptShotPlan}
                        episodeDisplayNumber={
                          episodeDisplayMap.get(
                            currentActiveShot.scriptShotPlan.episodeId
                          ) ?? 1
                        }
                        isGeneratingImage={imageGeneratingIds.has(currentActiveShot.shot.id)}
                        isGeneratingVideo={videoGeneratingIds.has(currentActiveShot.shot.id)}
                        assetCharacters={assetCharacters}
                        assetScenes={assetScenes}
                        assetProps={assetProps}
                        onUpdate={handleUpdateShot}
                        onGenerateImage={() => handleGenerateImage(currentActiveShot.scriptShotPlan.episodeId, currentActiveShot.shot.id)}
                        onClearImage={handleClearImage}
                        onGenerateVideo={() => handleGenerateVideo(currentActiveShot.scriptShotPlan.episodeId, currentActiveShot.shot.id)}
                        onClearVideo={handleClearVideo}
                        onPlayVideo={currentActiveShot.shot.videoUrl ? () => handlePlayVideo(currentActiveShot.shot.id) : undefined}
                        onPrev={prevShot() ? handlePrevShot : null}
                        onNext={nextShot() ? handleNextShot : null}
                        onClose={() => setDetailPanelOpen(false)}
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
