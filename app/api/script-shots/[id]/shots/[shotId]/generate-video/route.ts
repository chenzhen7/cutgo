import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { throwCutGoError, withError, CutGoError } from "@/lib/api-error"
import { callVideo } from "@/lib/ai/video"
import { createRunningAiTask, markAiTaskFailed } from "@/lib/ai-task-service"

export const POST = withError(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; shotId: string }> }
) => {
  const { id: episodeId, shotId } = await params

  const shot = await prisma.shot.findUnique({ where: { id: shotId } })
  if (!shot || shot.episodeId !== episodeId) {
    throwCutGoError("NOT_FOUND", "镜头不存在")
  }

  // 无图不可生成视频
  if (!shot.imageUrl) {
    throwCutGoError("VALIDATION", "请先生成分镜图片，再进行图生视频")
  }

  // 构建视频参考图列表
  // - first_last：从 imageUrls JSON 数组中取首尾帧（最多 2 张）
  // - keyframe / multi_grid：使用 imageUrl 作为单首帧参考
  let imageUrls: string[] = []
  if (shot.imageType === "first_last" && shot.imageUrls) {
    try {
      const parsed = JSON.parse(shot.imageUrls) as string[]
      imageUrls = parsed.filter(Boolean).slice(0, 2)
    } catch {
      imageUrls = [shot.imageUrl]
    }
  } else {
    imageUrls = [shot.imageUrl]
  }

  // 从 shot.duration 解析秒数
  const durationSeconds = shot.duration || 3

  // 获取项目宽高比用于视频输出
  const episode = await prisma.episode.findUnique({
    where: { id: episodeId },
    include: { project: { select: { aspectRatio: true } } },
  })
  const ratio = episode?.project?.aspectRatio ?? "9:16"

  const targetInfo = `第${episode?.index !== undefined ? episode.index + 1 : "?"}集 ${episode?.title || "未知"} - 镜头${shot.index + 1}`
  const task = await createRunningAiTask({
    projectId: episode?.projectId || shot.episodeId,
    episodeId: episodeId,
    shotId: shot.id,
    targetInfo,
    taskType: "shot_video_generate",
  })

  try {
    const result = await callVideo({
      prompt: shot.videoPrompt || "",
      imageUrls,
      durationSeconds,
      ratio,
    })

    const updated = await prisma.shot.update({
      where: { id: shotId },
      data: {
        videoStatus: "generating",
        videoTaskId: result.taskId,
        videoUrl: null,
      },
    })

    return NextResponse.json({ shot: updated })
  } catch (err) {
    await markAiTaskFailed(task.id, err)
    throw err
  }
})
