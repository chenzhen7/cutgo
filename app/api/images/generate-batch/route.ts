import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { createRunningAiTask, markAiTaskFailed, markAiTaskSucceeded } from "@/lib/ai-task-service"
import { getImageProvider } from "@/lib/ai/image"
import type { ImageProvider } from "@/lib/ai/types"

function resolveSize(aspectRatio: string): { width: number; height: number } {
  return aspectRatio === "16:9"
    ? { width: 768, height: 432 }
    : { width: 432, height: 768 }
}

async function generateForShot(
  provider: ImageProvider,
  projectId: string,
  shot: {
    id: string
    prompt: string
    promptEnd: string | null
    imageType: string
    gridPrompts: string | null
    gridLayout: string | null
    negativePrompt: string | null
  },
  aspectRatio: string
) {
  const { width, height } = resolveSize(aspectRatio)
  const neg = shot.negativePrompt ?? undefined

  if (shot.imageType === "first_last" && shot.promptEnd) {
    const [r1, r2] = await Promise.all([
      provider.generate({
        prompt: shot.prompt,
        projectId,
        scope: "shot",
        negativePrompt: neg,
        width,
        height,
      }),
      provider.generate({
        prompt: shot.promptEnd,
        projectId,
        scope: "shot",
        negativePrompt: neg,
        width,
        height,
      }),
    ])
    const firstUrl = Array.isArray(r1) ? r1[0].url : r1.url
    const lastUrl = Array.isArray(r2) ? r2[0].url : r2.url
    await prisma.shot.update({
      where: { id: shot.id },
      data: { imageUrl: firstUrl, imageUrls: JSON.stringify([firstUrl, lastUrl]) },
    })
    return { shotId: shot.id, imageUrl: firstUrl, imageUrls: [firstUrl, lastUrl], status: "success" as const }
  }

  if (shot.imageType === "multi_grid" && shot.gridPrompts) {
    let prompts: string[] = []
    try { prompts = JSON.parse(shot.gridPrompts) } catch { /* empty */ }
    if (prompts.length > 0) {
      const promptObj: Record<string, string> = {}
      prompts.forEach((p, i) => {
        promptObj[String(i + 1)] = p
      })
      const jsonBlock = JSON.stringify(promptObj, null, 2)
      const layoutText = shot.gridLayout ? `宫格布局：${shot.gridLayout}\n` : ""
      const combinedPrompt = `${shot.prompt}\n\n保持原图场景和风格不变，拍摄一套多宫格布局的分镜摄影图。保持每张图不重复，并且具有叙事感和连贯性，分镜之间紧挨着、无边框，4k高清画质${layoutText}\n\n以下 JSON 中数字键 "1"、"2"… 依次对应各子画面（建议从左到右、从上到下）：\n\n${jsonBlock}`

      const result = await provider.generate({
        prompt: combinedPrompt,
        projectId,
        scope: "shot",
        negativePrompt: neg,
        width,
        height,
      })
      const imageUrl = Array.isArray(result) ? result[0].url : result.url
      await prisma.shot.update({
        where: { id: shot.id },
        data: { imageUrl, imageUrls: null },
      })
      return { shotId: shot.id, imageUrl, imageUrls: [imageUrl], status: "success" as const }
    }
  }

  const result = await provider.generate({
    prompt: shot.prompt,
    projectId,
    scope: "shot",
    negativePrompt: neg,
    width,
    height,
  })
  const imageUrl = Array.isArray(result) ? result[0].url : result.url
  await prisma.shot.update({
    where: { id: shot.id },
    data: { imageUrl },
  })
  return { shotId: shot.id, imageUrl, status: "success" as const }
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { projectId, episodeId, mode = "missing_only" } = body

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 })
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 })
  }

  const where: Record<string, unknown> = { episode: { projectId } }
  if (episodeId) where.episodeId = episodeId
  if (mode === "missing_only") where.imageUrl = null

  const shots = await prisma.shot.findMany({
    where,
    orderBy: [{ episodeId: "asc" }, { index: "asc" }],
    select: {
      id: true,
      prompt: true,
      promptEnd: true,
      imageType: true,
      gridPrompts: true,
      gridLayout: true,
      negativePrompt: true,
    },
  })

  let episodeInfo = ""
  if (episodeId) {
    const ep = await prisma.episode.findUnique({ where: { id: episodeId } })
    if (ep) episodeInfo = ` 第${ep.index + 1}集 ${ep.title}`
  }

  const task = await createRunningAiTask({
    projectId,
    episodeId: episodeId || null,
    targetInfo: episodeInfo,
    taskType: "image_generate",
  })

  const provider = await getImageProvider()
  const results: { shotId: string; imageUrl?: string; imageUrls?: string[]; status: "success" | "failed" }[] = []
  let success = 0
  let failed = 0

  for (const shot of shots) {
    try {
      const result = await generateForShot(provider, projectId, shot, project.aspectRatio)
      results.push(result)
      success++
    } catch {
      results.push({ shotId: shot.id, status: "failed" })
      failed++
    }
  }

  if (failed > 0) {
    await markAiTaskFailed(task.id, {
      code: "PARTIAL_FAILED",
      message: `批量生图完成，但有 ${failed}/${shots.length} 个镜头失败`,
    })
  } else {
    await markAiTaskSucceeded(task.id)
  }

  return NextResponse.json({
    results,
    stats: { total: shots.length, success, failed },
  })
}
