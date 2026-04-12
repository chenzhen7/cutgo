import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { throwCutGoError, withError } from "@/lib/api-error"
import { callVideo } from "@/lib/ai/video"
import { createRunningAiTask, markAiTaskFailed } from "@/lib/ai-task-service"

export const POST = withError(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; shotId: string }> }
) => {
  const { id: episodeId, shotId } = await params
  console.info("[图生视频] 开始生成", { episodeId, shotId })

  const shot = await prisma.shot.findUnique({ where: { id: shotId } })
  if (!shot || shot.episodeId !== episodeId) {
    console.warn("[图生视频] 镜头不存在或不属于该分集", { episodeId, shotId, actualEpisodeId: shot?.episodeId })
    throwCutGoError("NOT_FOUND", "镜头不存在")
  }

  // 无图不可生成视频
  if (!shot.imageUrl) {
    console.warn("[图生视频] 缺少分镜图片，无法生成视频", { episodeId, shotId })
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
    include: { project: { select: { aspectRatio: true, stylePreset: true } } },
  })
  if (!episode) {
    console.warn("[图生视频] 分集不存在", { episodeId, shotId })
    throwCutGoError("NOT_FOUND", "分集不存在")
  }
  const ratio = episode.project?.aspectRatio ?? "9:16"
  const stylePreset = episode.project?.stylePreset

  const targetInfo = `第${episode.index + 1}集 ${episode.title || "未知"} - 镜头${shot.index + 1}`
  const task = await createRunningAiTask({
    projectId: episode.projectId,
    episodeId: episodeId,
    shotId: shot.id,
    targetInfo,
    taskType: "shot_video_generate",
  })
  console.info("[图生视频] 已创建 AI 任务", {
    aiTaskId: task.id,
    projectId: episode.projectId,
    episodeId,
    shotId,
    ratio,
    durationSeconds,
    imageCount: imageUrls.length,
  })

  try {
    const promptParts = []
    // if (shot.content) {
    //   promptParts.push(`画面讲述了：${shot.content}`)
    // }
    if (shot.videoPrompt) {
      promptParts.push(shot.videoPrompt)
    }
    if (shot.imageType === "multi_grid") {
      let gridCount = 9
      if (shot.gridLayout) {
        const match = shot.gridLayout.match(/(\d+)x(\d+)/i)
        if (match) {
          gridCount = parseInt(match[1]) * parseInt(match[2])
        }
      }
      promptParts.push(`立即从0.1秒处剪切，参考分镜顺序。起始于左上角第一格，依次在视频里串联${gridCount}宫格图片，人物动作流程自然。`)
    }
    if (stylePreset) {
      promptParts.push(`视觉风格：${stylePreset}`)
    }
    const combinedPrompt = promptParts.join("\n")

    console.info("[图生视频] 开始调用视频生成", {
      aiTaskId: task.id,
      episodeId,
      shotId,
      ratio,
      durationSeconds,
      imageCount: imageUrls.length,
      hasPrompt: Boolean(combinedPrompt?.trim()),
    })
    
    const result = await callVideo({
      prompt: combinedPrompt,
      imageUrls,
      durationSeconds,
      ratio,
    })
    console.info("[图生视频] 视频任务已创建", { aiTaskId: task.id, episodeId, shotId, videoTaskId: result.taskId })

    const updated = await prisma.shot.update({
      where: { id: shotId },
      data: {
        videoStatus: "generating",
        videoTaskId: result.taskId,
        videoUrl: null,
      },
    })
    console.info("[图生视频] 已更新镜头视频状态为 generating", { episodeId, shotId, videoTaskId: result.taskId })

    return NextResponse.json({ shot: updated })
  } catch (err) {
    console.error("[图生视频] 生成失败", { episodeId, shotId, aiTaskId: task.id, error: (err as Error)?.message || err })
    await markAiTaskFailed(task.id, err)
    throw err
  }
})
