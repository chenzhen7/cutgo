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

  const shot = await prisma.shot.findUnique({ 
    where: { id: shotId },
    include: { episode: true }
  })
  if (!shot || shot.episodeId !== episodeId) {
    throwCutGoError("NOT_FOUND", "镜头不存在")
  }

  // 无进行中任务，直接返回当前状态
  if (!shot.videoTaskId) {
    return NextResponse.json({
      videoStatus: shot.videoStatus,
      videoUrl: shot.videoUrl,
      shot,
    })
  }

  try {
    const status = await queryVideoTask(shot.videoTaskId)

    if (status.status === "success") {
      try {
        if (!status.url) {
          throwCutGoError("INTERNAL", "视频任务成功但未返回视频地址")
        }

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

        const aiTask = await prisma.aiTask.findFirst({
          where: { shotId, taskType: "shot_video_generate", status: "running" },
          orderBy: { createdAt: "desc" },
        })
        if (aiTask) {
          await markAiTaskSucceeded(aiTask.id)
        }

        return NextResponse.json({ videoStatus: "completed", videoUrl: localVideoUrl, shot: updated })
      } catch (err) {
        const reason = (err as Error)?.message || "视频入库失败"
        const updated = await prisma.shot.update({
          where: { id: shotId },
          data: {
            videoUrl: null,
            videoStatus: "error",
            videoTaskId: null,
          },
        })
        const aiTask = await prisma.aiTask.findFirst({
          where: { shotId, taskType: "shot_video_generate", status: "running" },
          orderBy: { createdAt: "desc" },
        })
        if (aiTask) {
          await markAiTaskFailed(aiTask.id, { message: reason })
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

      const aiTask = await prisma.aiTask.findFirst({
        where: { shotId, taskType: "shot_video_generate", status: "running" },
        orderBy: { createdAt: "desc" },
      })
      if (aiTask) {
        await markAiTaskFailed(aiTask.id, { message: status.reason })
      }

      return NextResponse.json({
        videoStatus: "error",
        videoUrl: null,
        shot: updated,
        reason: status.reason,
      })
    }

    // pending / processing：任务进行中，不修改 DB
    return NextResponse.json({
      videoStatus: "generating",
      videoUrl: null,
      shot,
    })
  } catch (err) {
    if (err instanceof CutGoError) throw err
    // 查询失败时不修改 DB，让前端继续重试
    return NextResponse.json({
      videoStatus: shot.videoStatus,
      videoUrl: shot.videoUrl,
      shot,
    })
  }
})
