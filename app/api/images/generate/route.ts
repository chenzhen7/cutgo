import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { API_ERRORS } from "@/lib/api-error"
import {
  createRunningAiTask,
  markAiTaskFailed,
  markAiTaskSucceeded,
} from "@/lib/ai-task-service"
import { getImageProvider } from "@/lib/ai/image"

interface GenerateImageRequest {
  shotId: string
  imageType: "keyframe" | "first_last" | "multi_grid"
  prompt: string
  promptEnd?: string
  gridPrompts?: string[]
  gridLayout?: string
  negativePrompt?: string
  aspectRatio?: string
  stylePreset?: string
  referenceImages?: string[]
}

function resolveSize(aspectRatio?: string): { width: number; height: number } {
  return aspectRatio === "16:9"
    ? { width: 768, height: 432 }
    : { width: 432, height: 768 }
}

export async function POST(request: NextRequest) {
  const body: GenerateImageRequest = await request.json()
  const { shotId, imageType, prompt, promptEnd, gridPrompts, negativePrompt, aspectRatio, referenceImages } = body

  if (!shotId || !prompt) {
    return NextResponse.json({ error: "shotId and prompt are required" }, { status: 400 })
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
          project: { select: { name: true } },
        },
      },
    },
  })
  if (!shot) {
    return NextResponse.json({ error: "Shot not found" }, { status: 404 })
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
    const { width, height } = resolveSize(aspectRatio)

    if (type === "keyframe") {
      const result = await provider.generate({ prompt, negativePrompt, width, height, referenceImages })
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
        const error = { code: API_ERRORS.VALIDATION.code, message: "promptEnd is required for first_last type" }
        await markAiTaskFailed(task.id, error)
        return NextResponse.json({ error: "promptEnd is required for first_last type" }, { status: 400 })
      }
      const [r1, r2] = await Promise.all([
        provider.generate({ prompt, negativePrompt, width, height, referenceImages }),
        provider.generate({ prompt: promptEnd, negativePrompt, width, height, referenceImages }),
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
        const error = { code: API_ERRORS.VALIDATION.code, message: "gridPrompts are required for multi_grid type" }
        await markAiTaskFailed(task.id, error)
        return NextResponse.json({ error: "gridPrompts are required for multi_grid type" }, { status: 400 })
      }
      const results = await Promise.all(
        gridPrompts.map((p) => provider.generate({ prompt: p, negativePrompt, width, height, referenceImages }))
      )
      const urls = results.map((r) => (Array.isArray(r) ? r[0].url : r.url))
      const imageUrl = urls[0]
      const updated = await prisma.shot.update({
        where: { id: shotId },
        data: {
          imageUrl,
          imageType: "multi_grid",
          imageUrls: JSON.stringify(urls),
        },
      })
      await markAiTaskSucceeded(task.id)
      return NextResponse.json({ shotId, imageUrl, imageUrls: urls, imageType: "multi_grid", shot: updated })
    }

    await markAiTaskFailed(task.id, { code: API_ERRORS.VALIDATION.code, message: "Invalid imageType" })
    return NextResponse.json({ error: "Invalid imageType" }, { status: 400 })
  } catch (err) {
    console.error("Image generation failed:", err)
    await markAiTaskFailed(task.id, err)
    return NextResponse.json({ error: "Image generation failed" }, { status: 500 })
  }
}
