import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { throwCutGoError, withError, CutGoError } from "@/lib/api-error"
import { queryVideoTask } from "@/lib/ai/video"

export const GET = withError(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; shotId: string }> }
) => {
  const { id: episodeId, shotId } = await params

  const shot = await prisma.shot.findUnique({ where: { id: shotId } })
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
      const updated = await prisma.shot.update({
        where: { id: shotId },
        data: {
          videoUrl: status.url,
          videoStatus: "completed",
          videoTaskId: null,
        },
      })
      return NextResponse.json({ videoStatus: "completed", videoUrl: status.url, shot: updated })
    }

    if (status.status === "failed") {
      const updated = await prisma.shot.update({
        where: { id: shotId },
        data: {
          videoStatus: "error",
          videoTaskId: null,
        },
      })
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
