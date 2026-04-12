import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { throwCutGoError, withError, CutGoError } from "@/lib/api-error"
import { queryVideoTask } from "@/lib/ai/video"
import { markAiTaskSucceeded, markAiTaskFailed } from "@/lib/ai-task-service"
import { persistGeneratedVideoLocally } from "@/lib/utils/local-video"

export const GET = withError(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; shotId: string }> }
) => {
  const { id: episodeId, shotId } = await params
  console.info("[视频状态] 开始查询", { episodeId, shotId })

  const shot = await prisma.shot.findUnique({
    where: { id: shotId },
    include: { episode: true }
  })
  if (!shot || shot.episodeId !== episodeId) {
    console.warn("[视频状态] 镜头不存在或不属于该分集", { episodeId, shotId, actualEpisodeId: shot?.episodeId })
    throwCutGoError("NOT_FOUND", "镜头不存在")
  }

  // 无进行中任务，直接返回当前状态
  if (!shot.videoTaskId) {
    console.info("[视频状态] 无进行中任务，直接返回当前状态", {
      episodeId,
      shotId,
      videoStatus: shot.videoStatus,
      hasVideoUrl: Boolean(shot.videoUrl),
    })
    return NextResponse.json({
      videoStatus: shot.videoStatus,
      videoUrl: shot.videoUrl,
      shot,
    })
  }

  try {
    console.info("[视频状态] 查询视频任务状态", { episodeId, shotId, videoTaskId: shot.videoTaskId })
    const status = await queryVideoTask(shot.videoTaskId)
    console.info("[视频状态] 查询结果", { episodeId, shotId, videoTaskId: shot.videoTaskId, status: status.status })

    if (status.status === "success") {
      try {
        if (!status.url) {
          throwCutGoError("INTERNAL", "视频任务成功但未返回视频地址")
        }

        console.info("[视频状态] 开始保存视频到本地", { sourceUrl: status.url, episodeId, shotId, videoTaskId: shot.videoTaskId })
        const localVideoUrl = await persistGeneratedVideoLocally({
          sourceUrl: status.url,
          projectId: shot.episode.projectId,
          scope: "shot",
        })

        if (!localVideoUrl.startsWith("/")) {
          throwCutGoError("INTERNAL", "视频入库失败：未生成本地链接")
        }

        const updated = await prisma.shot.update({
          where: { id: shotId },
          data: {
            videoUrl: localVideoUrl,
            videoStatus: "completed",
            videoTaskId: null,
          },
        })
        console.info("[视频状态] 已入库并更新为 completed", { episodeId, shotId, localVideoUrl })

        const aiTask = await prisma.aiTask.findFirst({
          where: { shotId, taskType: "shot_video_generate", status: "running" },
          orderBy: { createdAt: "desc" },
        })
        if (aiTask) {
          await markAiTaskSucceeded(aiTask.id)
          console.info("[视频状态] 已标记 AI 任务成功", { aiTaskId: aiTask.id, episodeId, shotId })
        }

        return NextResponse.json({ videoStatus: "completed", videoUrl: localVideoUrl, shot: updated })
      } catch (err) {
        console.error("[视频状态] 视频保存/入库失败", { episodeId, shotId, videoTaskId: shot.videoTaskId}, err)
        const reason = (err as Error)?.message || "视频入库失败"
        const updated = await prisma.shot.update({
          where: { id: shotId },
          data: {
            videoUrl: null,
            videoStatus: "error",
            videoTaskId: null,
          },
        })
        console.warn("[视频状态] 已更新为 error 并清理 videoTaskId", { episodeId, shotId, reason })
        const aiTask = await prisma.aiTask.findFirst({
          where: { shotId, taskType: "shot_video_generate", status: "running" },
          orderBy: { createdAt: "desc" },
        })
        if (aiTask) {
          await markAiTaskFailed(aiTask.id, { message: reason })
          console.info("[视频状态] 已标记 AI 任务失败", { aiTaskId: aiTask.id, episodeId, shotId, reason })
        }
        return NextResponse.json({
          videoStatus: "error",
          videoUrl: null,
          shot: updated,
          reason,
        })
      }
    }

    if (status.status === "failed") {
      const updated = await prisma.shot.update({
        where: { id: shotId },
        data: {
          videoStatus: "error",
          videoTaskId: null,
        },
      })
      console.warn("[视频状态] 视频任务失败，已更新为 error", {
        episodeId,
        shotId,
        videoTaskId: shot.videoTaskId,
        reason: status.reason,
      })

      const aiTask = await prisma.aiTask.findFirst({
        where: { shotId, taskType: "shot_video_generate", status: "running" },
        orderBy: { createdAt: "desc" },
      })
      if (aiTask) {
        await markAiTaskFailed(aiTask.id, { message: status.reason })
        console.info("[视频状态] 已标记 AI 任务失败", { aiTaskId: aiTask.id, episodeId, shotId, reason: status.reason })
      }

      return NextResponse.json({
        videoStatus: "error",
        videoUrl: null,
        shot: updated,
        reason: status.reason,
      })
    }

    // pending / processing：任务进行中，不修改 DB
    console.info("[视频状态] 任务进行中", { episodeId, shotId, videoTaskId: shot.videoTaskId, status: status.status })
    return NextResponse.json({
      videoStatus: "generating",
      videoUrl: null,
      shot,
    })
  } catch (err) {
    if (err instanceof CutGoError) throw err
    console.error("[视频状态] 查询异常（不修改 DB，前端可重试）", {
      episodeId,
      shotId,
      videoTaskId: shot.videoTaskId,
      error: (err as Error)?.message || err,
    })
    // 查询失败时不修改 DB，让前端继续重试
    return NextResponse.json({
      videoStatus: shot.videoStatus,
      videoUrl: shot.videoUrl,
      shot,
    })
  }
})
