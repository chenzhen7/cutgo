import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import type { VideoCompositionConfig } from "@/lib/types"
import { DEFAULT_VIDEO_COMPOSITION_CONFIG } from "@/lib/types"

const compositionInclude = {
  episode: {
    select: { id: true, index: true, title: true },
  },
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get("projectId")
  const episodeId = searchParams.get("episodeId")

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 })
  }

  const where: Record<string, unknown> = { projectId }
  if (episodeId) where.episodeId = episodeId

  const compositions = await prisma.videoComposition.findMany({
    where,
    include: compositionInclude,
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(compositions)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, episodeIds, config } = body as {
      projectId: string
      episodeIds?: string[]
      config: VideoCompositionConfig
    }

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 })
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) {
      return NextResponse.json({ error: "项目不存在" }, { status: 404 })
    }

    let targetEpisodes
    if (episodeIds && episodeIds.length > 0) {
      targetEpisodes = await prisma.episode.findMany({
        where: { id: { in: episodeIds }, projectId },
      })
    } else {
      targetEpisodes = await prisma.episode.findMany({
        where: { projectId },
        orderBy: { index: "asc" },
      })
    }

    if (targetEpisodes.length === 0) {
      return NextResponse.json({ error: "没有可合成的分集" }, { status: 400 })
    }

    const mergedConfig = { ...DEFAULT_VIDEO_COMPOSITION_CONFIG, ...config }

    const episodesWithShots = await prisma.episode.findMany({
      where: { projectId },
      include: { shots: true },
    })

    let totalShots = 0
    let missingImages = 0
    for (const ep of episodesWithShots) {
      totalShots += ep.shots.length
      missingImages += ep.shots.filter((s) => !s.imageUrl).length
    }

    const createdTasks = []
    for (const episode of targetEpisodes) {
      const existingTask = await prisma.videoComposition.findFirst({
        where: { episodeId: episode.id, status: { in: ["preparing", "tts_generating", "subtitle_generating", "compositing"] } },
      })
      if (existingTask) continue

      const latestVersion = await prisma.videoComposition.findFirst({
        where: { episodeId: episode.id },
        orderBy: { version: "desc" },
      })
      const version = latestVersion ? latestVersion.version + 1 : 1

      const task = await prisma.videoComposition.create({
        data: {
          projectId,
          episodeId: episode.id,
          config: JSON.stringify(mergedConfig),
          status: "preparing",
          version,
          progress: 0,
          currentStep: "准备素材中...",
        },
        include: compositionInclude,
      })
      createdTasks.push(task)

      simulateComposition(task.id, mergedConfig)
    }

    return NextResponse.json({
      taskIds: createdTasks.map((t) => t.id),
      tasks: createdTasks,
      status: "preparing",
      episodeCount: createdTasks.length,
      totalShots,
      missingImages,
    })
  } catch (e) {
    console.error("POST /api/videos error:", e)
    return NextResponse.json({ error: "创建合成任务失败" }, { status: 500 })
  }
}

async function simulateComposition(taskId: string, config: VideoCompositionConfig) {
  const steps: { status: string; step: string; progress: number; delay: number }[] = [
    { status: "preparing", step: "准备素材中...", progress: 10, delay: 2000 },
    { status: "preparing", step: "下载/验证画面图片", progress: 20, delay: 3000 },
    { status: "tts_generating", step: "生成配音中...", progress: 35, delay: config.tts.enabled ? 5000 : 500 },
    { status: "subtitle_generating", step: "生成字幕文件", progress: 55, delay: 1000 },
    { status: "compositing", step: "FFmpeg 合成中...", progress: 70, delay: 5000 },
    { status: "compositing", step: "FFmpeg 合成中 (帧: 600/1800)", progress: 85, delay: 3000 },
    { status: "compositing", step: "后处理中...", progress: 95, delay: 2000 },
  ]

  for (const step of steps) {
    await new Promise((r) => setTimeout(r, step.delay))
    try {
      const task = await prisma.videoComposition.findUnique({ where: { id: taskId } })
      if (!task || task.status === "error") return
      await prisma.videoComposition.update({
        where: { id: taskId },
        data: { status: step.status, progress: step.progress, currentStep: step.step },
      })
    } catch {
      return
    }
  }

  await new Promise((r) => setTimeout(r, 1000))
  try {
    await prisma.videoComposition.update({
      where: { id: taskId },
      data: {
        status: "completed",
        progress: 100,
        currentStep: null,
        outputPath: `/output/ep_${taskId.slice(-6)}_v1.mp4`,
        fileSize: Math.floor(Math.random() * 30000000) + 20000000,
        videoDuration: Math.floor(Math.random() * 30) + 45,
      },
    })
  } catch {
    // ignore
  }
}
