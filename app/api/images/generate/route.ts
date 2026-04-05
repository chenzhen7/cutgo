import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { CutGoError, throwCutGoError, withError } from "@/lib/api-error"
import {
  createRunningAiTask,
  markAiTaskFailed,
  markAiTaskSucceeded,
} from "@/lib/ai-task-service"
import { getImageProvider } from "@/lib/ai/image"
import { buildMultiGridPrompt } from "@/app/api/images/prompt-utils"

interface GenerateImageRequest {
  shotId: string
  imageType: "keyframe" | "first_last" | "multi_grid"
  prompt: string
  promptEnd?: string
  gridPrompts?: string[]
  negativePrompt?: string
  aspectRatio?: string
  resolution?: string
  referenceImages?: string[]
}

export const POST = withError(async (request: NextRequest) => {
  const body: GenerateImageRequest = await request.json()
  const { shotId, imageType, prompt, promptEnd, gridPrompts, negativePrompt, aspectRatio, resolution, referenceImages } = body

  if (!shotId || !prompt) {
    throwCutGoError("MISSING_PARAMS", "shotId and prompt are required")
  }

  const shot = await prisma.shot.findUnique({
    where: { id: shotId },
    include: {
      episode: {
        select: {
          id: true,
          projectId: true,
          index: true,
          title: true,
          project: { select: { name: true, aspectRatio: true, resolution: true } },
        },
      },
    },
  })
  if (!shot) {
    throwCutGoError("NOT_FOUND", "Shot not found")
  }

  const task = await createRunningAiTask({
    projectId: shot.episode.projectId,
    episodeId: shot.episode.id,
    shotId: shot.id,
    targetInfo: `第${shot.episode.index + 1}集 ${shot.episode.title} 分镜 ${shot.index + 1}`,
    taskType: "image_generate",
  })

  try {
    const provider = await getImageProvider()
    const type = imageType || "keyframe"
 

    if (type === "keyframe") {
      const result = await provider.generate({
        prompt,
        projectId: shot.episode.projectId,
        scope: "shot",
        negativePrompt,
        aspectRatio,
        resolution,
        referenceImages,
      })
      const imageUrl = Array.isArray(result) ? result[0].url : result.url
      const updated = await prisma.shot.update({
        where: { id: shotId },
        data: { imageUrl, imageType: "keyframe", imageUrls: null },
      })
      await markAiTaskSucceeded(task.id)
      return NextResponse.json({ shotId, imageUrl, imageType: "keyframe", shot: updated })
    }

    if (type === "first_last") {
      if (!promptEnd) {
        await markAiTaskFailed(task.id, { code: "VALIDATION_ERROR", message: "promptEnd is required for first_last type" })
        throwCutGoError("VALIDATION", "promptEnd is required for first_last type")
      }
      const [r1, r2] = await Promise.all([
        provider.generate({
          prompt,
          projectId: shot.episode.projectId,
          scope: "shot",
          negativePrompt,
          aspectRatio,
          resolution,
          referenceImages,
        }),
        provider.generate({
          prompt: promptEnd,
          projectId: shot.episode.projectId,
          scope: "shot",
          negativePrompt,
          aspectRatio,
          resolution,
          referenceImages,
        }),
      ])
      const firstUrl = Array.isArray(r1) ? r1[0].url : r1.url
      const lastUrl = Array.isArray(r2) ? r2[0].url : r2.url
      const imageUrls = JSON.stringify([firstUrl, lastUrl])
      const updated = await prisma.shot.update({
        where: { id: shotId },
        data: { imageUrl: firstUrl, imageType: "first_last", imageUrls, promptEnd },
      })
      await markAiTaskSucceeded(task.id)
      return NextResponse.json({ shotId, imageUrl: firstUrl, imageUrls: [firstUrl, lastUrl], imageType: "first_last", shot: updated })
    }

    if (type === "multi_grid") {
      if (!gridPrompts?.length) {
        await markAiTaskFailed(task.id, { code: "VALIDATION_ERROR", message: "gridPrompts are required for multi_grid type" })
        throwCutGoError("VALIDATION", "gridPrompts are required for multi_grid type")
      }

      const combinedPrompt = buildMultiGridPrompt(prompt, gridPrompts, shot.gridLayout)
      const result = await provider.generate({
        prompt: combinedPrompt,
        projectId: shot.episode.projectId,
        scope: "shot",
        negativePrompt,
        aspectRatio,
        resolution,
        referenceImages,
      })
      const imageUrl = Array.isArray(result) ? result[0].url : result.url
      const updated = await prisma.shot.update({
        where: { id: shotId },
        data: {
          imageUrl,
          imageType: "multi_grid",
          imageUrls: null,
        },
      })
      await markAiTaskSucceeded(task.id)
      return NextResponse.json({ shotId, imageUrl, imageUrls: [imageUrl], imageType: "multi_grid", shot: updated })
    }

    await markAiTaskFailed(task.id, { code: "VALIDATION_ERROR", message: "Invalid imageType" })
    throwCutGoError("VALIDATION", "Invalid imageType")
  } catch (err) {
    console.error("Image generation failed:", err)
    await markAiTaskFailed(task.id, err)
    if (err instanceof CutGoError) {
      throw err
    }
    throwCutGoError("INTERNAL", err instanceof Error ? err.message : "Image generation failed")
  }
})
