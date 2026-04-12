import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { CutGoError, throwCutGoError, withError } from "@/lib/api-error"
import {
  createRunningAiTask,
  markAiTaskFailed,
  markAiTaskSucceeded,
} from "@/lib/ai-task-service"
import { callImage } from "@/lib/ai/image"
import { buildMultiGridPrompt, buildImagePrompt } from "@/app/api/images/prompt-utils"

interface GenerateImageRequest {
  shotId: string
  imageType?: "keyframe" | "first_last" | "multi_grid"
  content?: string
  prompt?: string
  promptEnd?: string
  gridPrompts?: string[]
  gridLayout?: string
  negativePrompt?: string
  aspectRatio?: string
  resolution?: string
  referenceImages?: string[]
  refLabels?: string[]
}

export const POST = withError(async (request: NextRequest) => {
  const body: GenerateImageRequest = await request.json()
  const { shotId, imageType, content, prompt, promptEnd, gridPrompts, negativePrompt, referenceImages, refLabels } = body

  if (!shotId) {
    throwCutGoError("MISSING_PARAMS", "shotId is required")
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

  // Use values from request body or fallback to database values
  const type = imageType || shot.imageType || "keyframe"
  const finalContent = content ?? shot.content
  const finalPromptBase = prompt ?? shot.prompt
  const finalPromptEndBase = promptEnd ?? shot.promptEnd
  
  if (type !== "multi_grid" && !finalPromptBase) {
    throwCutGoError("MISSING_PARAMS", "prompt is required")
  }

  const episode = shot.episode;
  const project = episode.project;

  const task = await createRunningAiTask({
    projectId: episode.projectId,
    episodeId: episode.id,
    shotId: shot.id,
    targetInfo: `第${episode.index + 1}集 ${episode.title} 分镜 ${shot.index + 1}`,
    taskType: "image_generate",
  })

  try {
    const type = imageType || "keyframe"


    if (type === "keyframe") {
      const generatedPrompt = buildImagePrompt(finalContent, finalPromptBase, refLabels, project.stylePreset)
      const result = await callImage({
        prompt: generatedPrompt,
        projectId: episode.projectId,
        scope: "shot",
        negativePrompt,
        aspectRatio: project.aspectRatio,
        resolution: project.resolution,
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
      if (!finalPromptEndBase) {
        await markAiTaskFailed(task.id, { code: "VALIDATION_ERROR", message: "promptEnd is required for first_last type" })
        throwCutGoError("VALIDATION", "promptEnd is required for first_last type")
      }
      const promptStart = buildImagePrompt(finalContent, finalPromptBase, refLabels, project.stylePreset)
      const promptEndGen = buildImagePrompt(finalContent, finalPromptEndBase, refLabels, project.stylePreset)
      const [r1, r2] = await Promise.all([
        callImage({
          prompt: promptStart,
          projectId: episode.projectId,
          scope: "shot",
          negativePrompt,
          aspectRatio: project.aspectRatio,
          resolution: project.resolution,
          referenceImages,
        }),
        callImage({
          prompt: promptEndGen,
          projectId: episode.projectId,
          scope: "shot",
          negativePrompt,
          aspectRatio: project.aspectRatio,
          resolution: project.resolution,
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

      const combinedPrompt = buildMultiGridPrompt(finalContent, gridPrompts, shot.gridLayout, refLabels, project.stylePreset)
      const result = await callImage({
        prompt: combinedPrompt,
        projectId: episode.projectId,
        scope: "shot",
        negativePrompt,
        aspectRatio: project.aspectRatio,
        resolution: project.resolution,
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
