"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useStoryboardStore } from "@/store/storyboard-store"
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
import { StoryboardEmptyState } from "./components/storyboard-empty-state"
import { StoryboardToolbar } from "./components/storyboard-toolbar"
import { EpisodeSelectView } from "./components/episode-select-view"
import { SceneSwimlane } from "./components/scene-swimlane"
import { ShotDetailPanel } from "./components/shot-detail-panel"
import { ConfirmStoryboardDialog } from "./components/confirm-storyboard-dialog"
import { ScriptLinesDialog } from "./components/script-lines-dialog"
import { VideoPreviewDialog } from "./components/video-preview-dialog"
import type { ShotCardDisplayMode } from "./components/shot-card"
import type { Storyboard, ShotInput, Shot } from "@/lib/types"

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
  } = useStoryboardStore()

  const [view, setView] = useState<"episode-select" | "storyboard-list">("storyboard-list")
  const [scriptConfirmed, setScriptConfirmed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [deletingShotInfo, setDeletingShotInfo] = useState<{ storyboardId: string; shotId: string } | null>(null)
  const [viewingScriptStoryboard, setViewingScriptStoryboard] = useState<Storyboard | null>(null)

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
        fetchScripts(projectId),
        fetchStoryboards(projectId),
        fetchAssets(projectId),
      ])

      const res = await fetch(`/api/projects/${projectId}`)
      if (res.ok) {
        const project = await res.json()
        setScriptConfirmed(project.step >= 5)
      }

      // 如果没有选中的分集，且有分集数据，默认选中第一个
      if (!activeEpisodeId && eps && eps.length > 0) {
        setActiveEpisodeId(eps[0].id)
      }

      setLoading(false)
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  // 默认进入分镜列表页面，如果已有分集则选中第一个

  const handleEnterEpisode = useCallback(
    (episodeId: string) => {
      setActiveEpisodeId(episodeId)
      setView("storyboard-list")
    },
    [setActiveEpisodeId]
  )

  const handleBackToEpisodeSelect = useCallback(() => {
    setView("episode-select")
  }, [])

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
    router.push(`/project/${projectId}/video`)
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

  // Mock: simulate single shot video generation (3-5s delay)
  const handleGenerateVideo = useCallback(
    (_storyboardId: string, shotId: string) => {
      setVideoGeneratingIds((prev) => new Set(prev).add(shotId))
      const delay = 3000 + Math.random() * 2000
      setTimeout(() => {
        setVideoGeneratingIds((prev) => {
          const next = new Set(prev)
          next.delete(shotId)
          return next
        })
        // Mock: update shot with a fake videoUrl
        updateShot(_storyboardId, shotId, {
          videoUrl: `/mock-videos/${shotId}.mp4`,
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
      updateShot(active.storyboard.id, active.shot.id, {
        videoUrl: undefined,
        videoStatus: undefined,
        videoDuration: undefined,
      } as Partial<ShotInput>)
    }
  }, [activeShot, updateShot])

  // Mock: batch video generation
  const handleBatchGenerateVideos = useCallback(
    (mode: "all" | "missing_only") => {
      const allShots = storyboards.flatMap((sb) =>
        sb.shots.filter((s) => s.imageUrl).map((s) => ({ storyboardId: sb.id, shot: s }))
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
          updateShot(target.storyboardId, target.shot.id, {
            videoUrl: `/mock-videos/${target.shot.id}.mp4`,
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
    [storyboards, updateShot]
  )

  const handleBatchGenerateEpisodeVideos = useCallback(() => {
    if (!activeEpisodeId) return
    const epStoryboards = storyboards.filter((sb) => sb.script.episode.id === activeEpisodeId)
    const targets = epStoryboards.flatMap((sb) =>
      sb.shots.filter((s) => s.imageUrl && !s.videoUrl).map((s) => ({ storyboardId: sb.id, shot: s }))
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
        updateShot(target.storyboardId, target.shot.id, {
          videoUrl: `/mock-videos/${target.shot.id}.mp4`,
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
  }, [activeEpisodeId, storyboards, updateShot])

  const handlePlayVideo = useCallback(
    (shotId: string) => {
      const allShots = storyboards.flatMap((sb) => sb.shots)
      const shot = allShots.find((s) => s.id === shotId)
      if (shot?.videoUrl) setVideoPreviewShot(shot)
    },
    [storyboards]
  )

  const handleVideoPreviewPrev = useCallback(() => {
    if (!videoPreviewShot) return
    const allShots = storyboards.flatMap((sb) => sb.shots).filter((s) => s.videoUrl)
    const idx = allShots.findIndex((s) => s.id === videoPreviewShot.id)
    if (idx > 0) setVideoPreviewShot(allShots[idx - 1])
  }, [videoPreviewShot, storyboards])

  const handleVideoPreviewNext = useCallback(() => {
    if (!videoPreviewShot) return
    const allShots = storyboards.flatMap((sb) => sb.shots).filter((s) => s.videoUrl)
    const idx = allShots.findIndex((s) => s.id === videoPreviewShot.id)
    if (idx < allShots.length - 1) setVideoPreviewShot(allShots[idx + 1])
  }, [videoPreviewShot, storyboards])

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

  // 分集选择视图
  if (view === "episode-select") {
    return (
      <div className="flex flex-col h-[calc(100vh-0.5rem)] overflow-y-auto custom-scrollbar">
        <EpisodeSelectView
          episodes={episodes}
          scripts={scripts}
          storyboards={storyboards}
          onSelectEpisode={handleEnterEpisode}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-0.5rem)]">
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
        <div className="px-6 pt-4">
          <div className="mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToEpisodeSelect}
              className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2"
            >
              <ArrowLeft className="size-4" />
              分集
            </Button>
          </div>
          <StoryboardEmptyState
            scripts={scripts}
            scriptConfirmed={scriptConfirmed}
            onGenerateAll={() => handleGenerateAll("skip_existing")}
            onSelectEpisodes={handleBackToEpisodeSelect}
            onGoToScript={() => router.push(`/project/${projectId}/script`)}
          />
        </div>
      )}

      {/* Main content */}
      {(hasStoryboards || isGenerating) && (
        <>
          {/* Toolbar */}
          <div className="px-6 pt-4 mb-2 shrink-0 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToEpisodeSelect}
                className="gap-1.5 text-muted-foreground hover:text-foreground shrink-0 -ml-2"
              >
                <ArrowLeft className="size-4" />
                分集
              </Button>
              <div className="w-px h-4 bg-border shrink-0" />
            </div>
            <StoryboardToolbar
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

          {/* Two-column layout with Resizable */}
          <div className="flex-1 min-h-0 px-6">
            <ResizablePanelGroup orientation="horizontal" className="h-full">
              {/* Center: Timeline editor */}
              <ResizablePanel defaultSize={60} minSize={30}>
                <div className={cn(
                  "h-full min-w-0 overflow-y-auto space-y-3 px-2 pb-12 custom-scrollbar",
                  detailPanelOpen ? "border-y border-l bg-background/50 rounded-l-lg" : "border rounded-lg"
                )}>
                  {currentStoryboards.length > 0 ? (
                    <div className={cn(
                      "space-y-3",
                      detailPanelOpen ? "p-0" : ""
                    )}>
                      {currentStoryboards.map((sb) => (
                        <SceneSwimlane
                          key={sb.id}
                          storyboard={sb}
                          activeShotId={activeShotId}
                          selectedShotIds={selectedShotIds}
                          imageGeneratingIds={imageGeneratingIds}
                          videoGeneratingIds={videoGeneratingIds}
                          shotDisplayMode={shotDisplayMode}
                          assetCharacters={assetCharacters}
                          assetScenes={assetScenes}
                          assetProps={assetProps}
                          onSelectShot={handleSelectShot}
                          onDuplicateShot={(sbId, shotId) => duplicateShot(sbId, shotId)}
                          onDeleteShot={(sbId, shotId) => setDeletingShotInfo({ storyboardId: sbId, shotId })}
                          onAddShot={handleAddShot}
                          onGenerateImage={handleGenerateImage}
                          onGenerateVideo={handleGenerateVideo}
                          onPlayVideo={handlePlayVideo}
                          onRegenerateScript={handleRegenerateScript}
                          onViewScript={(sb) => setViewingScriptStoryboard(sb)}
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
                    <div className="h-full shrink-0 border-y border-r rounded-r-lg bg-card overflow-hidden">
                      <ShotDetailPanel
                        shot={currentActiveShot.shot}
                        storyboard={currentActiveShot.storyboard}
                        isGeneratingImage={imageGeneratingIds.has(currentActiveShot.shot.id)}
                        isGeneratingVideo={videoGeneratingIds.has(currentActiveShot.shot.id)}
                        assetCharacters={assetCharacters}
                        assetScenes={assetScenes}
                        assetProps={assetProps}
                        onUpdate={handleUpdateShot}
                        onGenerateImage={() => handleGenerateImage(currentActiveShot.storyboard.id, currentActiveShot.shot.id)}
                        onClearImage={handleClearImage}
                        onGenerateVideo={() => handleGenerateVideo(currentActiveShot.storyboard.id, currentActiveShot.shot.id)}
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
      )}

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
