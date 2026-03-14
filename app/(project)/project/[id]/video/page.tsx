"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useVideoStore } from "@/store/video-store"
import { VideoToolbar } from "./components/video-toolbar"
import { EpisodeNavList } from "./components/episode-nav-list"
import { VideoEmptyState } from "./components/video-empty-state"
import { CompositionConfigDialog } from "./components/composition-config-dialog"
import { CompositionProgressPanel } from "./components/composition-progress-panel"
import { VideoPlayer } from "./components/video-player"
import { VideoTimeline } from "./components/video-timeline"
import { ConfirmCompositionDialog } from "./components/confirm-composition-dialog"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowRight, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import type { Storyboard } from "@/lib/types"

export default function VideoPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const {
    tasks,
    episodes,
    isLoading,
    isStarting,
    activeEpisodeId,
    episodeTaskStatus,
    episodeLatestTask,
    completedCount,
    fetchTasks,
    fetchEpisodes,
    fetchAssetCharacters,
    startComposition,
    setActiveEpisodeId,
    confirmComposition,
    stopPolling,
  } = useVideoStore()

  const [loading, setLoading] = useState(true)
  const [storyboards, setStoryboards] = useState<Storyboard[]>([])
  const [configOpen, setConfigOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [projectStep, setProjectStep] = useState(0)

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await Promise.all([
        fetchEpisodes(projectId),
        fetchTasks(projectId),
        fetchAssetCharacters(projectId),
      ])

      const [projectRes, sbRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/storyboards?projectId=${projectId}`),
      ])

      if (projectRes.ok) {
        const p = await projectRes.json()
        setProjectStep(p.step)
      }
      if (sbRes.ok) {
        const sb = await sbRes.json()
        setStoryboards(sb)
      }

      setLoading(false)
    }
    init()

    return () => {
      stopPolling()
    }
  }, [projectId, fetchEpisodes, fetchTasks, fetchAssetCharacters, stopPolling])

  useEffect(() => {
    if (episodes.length > 0 && !activeEpisodeId) {
      setActiveEpisodeId(episodes[0].id)
    }
  }, [episodes, activeEpisodeId, setActiveEpisodeId])

  const activeEpisode = useMemo(
    () => episodes.find((ep) => ep.id === activeEpisodeId) ?? null,
    [episodes, activeEpisodeId]
  )

  const activeTask = useMemo(
    () => (activeEpisodeId ? episodeLatestTask(activeEpisodeId) : null),
    [activeEpisodeId, episodeLatestTask, tasks]
  )

  const activeStatus = useMemo(
    () => (activeEpisodeId ? episodeTaskStatus(activeEpisodeId) : "none"),
    [activeEpisodeId, episodeTaskStatus, tasks]
  )

  const activeStoryboards = useMemo(
    () =>
      storyboards.filter((sb) =>
        activeEpisode
          ? sb.script.episode.id === activeEpisode.id
          : false
      ),
    [storyboards, activeEpisode]
  )

  const totalShots = useMemo(
    () => storyboards.flatMap((sb) => sb.shots).length,
    [storyboards]
  )

  const shotsWithImage = useMemo(
    () => storyboards.flatMap((sb) => sb.shots).filter((s) => s.imageUrl).length,
    [storyboards]
  )

  const hasAnyTask = tasks.length > 0
  const hasActiveTasks = tasks.some(
    (t) =>
      t.status === "preparing" ||
      t.status === "tts_generating" ||
      t.status === "subtitle_generating" ||
      t.status === "compositing"
  )

  const handleStartAll = useCallback(async () => {
    await startComposition(projectId)
  }, [projectId, startComposition])

  const handleConfirm = useCallback(async () => {
    setIsConfirming(true)
    try {
      await confirmComposition(projectId)
      toast.success("已确认合成，即将进入导出发布")
      router.push(`/project/${projectId}/export`)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setIsConfirming(false)
      setConfirmOpen(false)
    }
  }, [projectId, confirmComposition, router])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b px-6 py-4">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-foreground">视频合成</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            自动加字幕、配音、BGM，合成 MP4
          </p>
        </div>
        <VideoToolbar
          projectId={projectId}
          episodes={episodes}
          onOpenConfig={() => setConfigOpen(true)}
        />
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-52 shrink-0 overflow-y-auto border-r">
          <EpisodeNavList episodes={episodes} />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {hasActiveTasks && (
            <CompositionProgressPanel episodes={episodes} />
          )}

          {!hasAnyTask && episodes.length > 0 && (
            <VideoEmptyState
              projectId={projectId}
              episodeCount={episodes.length}
              totalShots={totalShots}
              shotsWithImage={shotsWithImage}
              onConfigure={() => setConfigOpen(true)}
              onStartAll={handleStartAll}
              isStarting={isStarting}
            />
          )}

          {activeEpisode && (
            <div className="space-y-4">
              {activeTask && activeTask.status === "completed" && (
                <VideoPlayer task={activeTask} />
              )}

              {activeStatus !== "none" && activeStatus !== "completed" && activeTask && (
                <div className="flex items-center gap-3 rounded-lg border bg-primary/5 px-4 py-3">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <div>
                    <p className="text-sm font-medium">
                      正在合成：第{activeEpisode.index + 1}集 · {activeEpisode.title}
                    </p>
                    {activeTask.currentStep && (
                      <p className="text-xs text-muted-foreground">{activeTask.currentStep} · {activeTask.progress}%</p>
                    )}
                  </div>
                </div>
              )}

              {activeStoryboards.length > 0 && (
                <VideoTimeline
                  storyboards={activeStoryboards}
                  episodeTitle={`第${activeEpisode.index + 1}集 · ${activeEpisode.title}`}
                />
              )}
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t bg-card px-6 py-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {completedCount() > 0
              ? `已完成 ${completedCount()}/${episodes.length} 集合成`
              : "完成合成后可进入导出发布"}
          </p>
          <Button
            onClick={() => setConfirmOpen(true)}
            disabled={completedCount() === 0}
            className="gap-2"
          >
            确认合成，进入导出发布
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <CompositionConfigDialog open={configOpen} onClose={() => setConfigOpen(false)} />
      <ConfirmCompositionDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
        episodes={episodes}
        isConfirming={isConfirming}
      />
    </div>
  )
}
