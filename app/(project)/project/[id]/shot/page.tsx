"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useScriptShotsStore } from "@/store/script-shot-store"
import {
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { ShotTimelineContent } from "./components/shot-timeline-content"
import { ShotRightPanels } from "./components/shot-right-panels"
import { VideoPreviewDialog } from "./components/video-preview-dialog"
import type { Shot } from "@/lib/types"
import { apiFetch } from "@/lib/api-client"
import type { Project } from "@/lib/types"

export default function ScriptShotPage() {
  const params = useParams()
  const projectId = params.id as string

  const generateStatus = useScriptShotsStore((s) => s.generateStatus)
  const generateError = useScriptShotsStore((s) => s.generateError)

  const [aspectRatio, setAspectRatio] = useState<string>("9:16")
  const [videoPreviewShot, setVideoPreviewShot] = useState<Shot | null>(null)

  // 获取项目画幅比
  useEffect(() => {
    apiFetch<Project>(`/api/projects/${projectId}`)
      .then((proj) => setAspectRatio(proj.aspectRatio || "9:16"))
      .catch(() => {})
  }, [projectId])

  // 通过 getState() 在回调内读取最新数据，避免订阅 scriptShotPlans
  const handlePlayVideo = useCallback((shotId: string) => {
    const { scriptShotPlans: plans } = useScriptShotsStore.getState()
    const shot = plans.flatMap((plan) => plan.shots).find((s) => s.id === shotId)
    if (shot?.videoUrl) setVideoPreviewShot(shot)
  }, [])

  const handleVideoPreviewPrev = useCallback(() => {
    if (!videoPreviewShot) return
    const { scriptShotPlans: plans } = useScriptShotsStore.getState()
    const shotsWithVideo = plans.flatMap((plan) => plan.shots).filter((s) => s.videoUrl)
    const idx = shotsWithVideo.findIndex((s) => s.id === videoPreviewShot.id)
    if (idx > 0) setVideoPreviewShot(shotsWithVideo[idx - 1])
  }, [videoPreviewShot])

  const handleVideoPreviewNext = useCallback(() => {
    if (!videoPreviewShot) return
    const { scriptShotPlans: plans } = useScriptShotsStore.getState()
    const shotsWithVideo = plans.flatMap((plan) => plan.shots).filter((s) => s.videoUrl)
    const idx = shotsWithVideo.findIndex((s) => s.id === videoPreviewShot.id)
    if (idx < shotsWithVideo.length - 1) setVideoPreviewShot(shotsWithVideo[idx + 1])
  }, [videoPreviewShot])

  return (
    <div className="flex h-full max-h-[100dvh] min-h-0 flex-1 flex-col overflow-hidden">
      {/* Generate error — 全宽贴边条 */}
      {generateStatus === "error" && generateError && (
        <div className="shrink-0 border-b border-destructive/30 bg-destructive/5">
          <div className="px-2.5 py-2.5 sm:px-3">
            <p className="text-sm text-destructive">{generateError}</p>
            <button
              onClick={() => {
                const state = useScriptShotsStore.getState()
                const { activeEpisodeId, generateScriptShots, fetchScriptShotPlans, setDetailPanelOpen } = state
                if (!activeEpisodeId) return
                setDetailPanelOpen(false)
                void generateScriptShots(projectId, [activeEpisodeId]).then(() => {
                  void fetchScriptShotPlans(projectId, activeEpisodeId)
                })
              }}
              className="mt-2 text-sm text-destructive underline hover:no-underline"
            >
              重试
            </button>
          </div>
        </div>
      )}

      {/* Main layout */}
      <div className="min-h-0 flex-1">
        <ResizablePanelGroup orientation="horizontal" className="h-full">
          {/* Left: Timeline editor */}
          <ResizablePanel defaultSize={50} minSize="300px">
            <ShotTimelineContent
              projectId={projectId}
              aspectRatio={aspectRatio}
              onPlayVideo={handlePlayVideo}
            />
          </ResizablePanel>

          {/* Right: Preview + Detail panels */}
          <ShotRightPanels aspectRatio={aspectRatio} onPlayVideo={handlePlayVideo} />
        </ResizablePanelGroup>
      </div>

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
