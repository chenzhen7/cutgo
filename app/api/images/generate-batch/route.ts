import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

function makePlaceholderUrl(
  prompt: string,
  width: number,
  height: number,
  index?: number
): string {
  const label = encodeURIComponent(
    (index != null ? `#${index + 1} ` : "") +
      prompt.slice(0, 30).replace(/[^\w\s]/g, "")
  )
  const colors = ["264653", "2a9d8f", "e9c46a", "f4a261", "e76f51", "606c38"]
  const bg = colors[Math.floor(Math.random() * colors.length)]
  return `https://placehold.co/${width}x${height}/${bg}/white?text=${label}`
}

async function generateForShot(shot: {
  id: string
  prompt: string
  promptEnd: string | null
  imageType: string
  gridPrompts: string | null
  gridLayout: string | null
  negativePrompt: string | null
}, aspectRatio: string) {
  const [w, h] = aspectRatio === "16:9" ? [768, 432] : [432, 768]
  await new Promise((r) => setTimeout(r, 300 + Math.random() * 500))

  if (shot.imageType === "first_last" && shot.promptEnd) {
    const firstUrl = makePlaceholderUrl("首帧 " + shot.prompt, w, h, 0)
    const lastUrl = makePlaceholderUrl("尾帧 " + shot.promptEnd, w, h, 1)
    await prisma.shot.update({
      where: { id: shot.id },
      data: { imageUrl: firstUrl, imageUrls: JSON.stringify([firstUrl, lastUrl]) },
    })
    return { shotId: shot.id, imageUrl: firstUrl, imageUrls: [firstUrl, lastUrl], status: "success" as const }
  }

  if (shot.imageType === "multi_grid" && shot.gridPrompts && shot.gridLayout) {
    let prompts: string[] = []
    try { prompts = JSON.parse(shot.gridPrompts) } catch { /* empty */ }
    const summary = prompts.map((p, i) => `${i + 1}:${p.slice(0, 12)}`).join("|")
    const imageUrl = makePlaceholderUrl(summary, w, h)
    await prisma.shot.update({
      where: { id: shot.id },
      data: { imageUrl },
    })
    return { shotId: shot.id, imageUrl, status: "success" as const }
  }

  const imageUrl = makePlaceholderUrl(shot.prompt, w, h)
  await prisma.shot.update({
    where: { id: shot.id },
    data: { imageUrl },
  })
  return { shotId: shot.id, imageUrl, status: "success" as const }
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { projectId, episodeId, storyboardId, mode = "missing_only" } = body

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 })
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 })
  }

  const where: Record<string, unknown> = {
    storyboard: { projectId },
  }

  if (storyboardId) {
    where.storyboardId = storyboardId
  } else if (episodeId) {
    where.storyboard = { projectId, script: { episodeId } }
  }

  if (mode === "missing_only") {
    where.imageUrl = null
  }

  const shots = await prisma.shot.findMany({
    where,
    orderBy: [{ storyboardId: "asc" }, { index: "asc" }],
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

  const results: { shotId: string; imageUrl?: string; imageUrls?: string[]; status: "success" | "failed" }[] = []
  let success = 0
  let failed = 0

  for (const shot of shots) {
    try {
      const result = await generateForShot(shot, project.aspectRatio)
      results.push(result)
      success++
    } catch {
      results.push({ shotId: shot.id, status: "failed" })
      failed++
    }
  }

  return NextResponse.json({
    results,
    stats: { total: shots.length, success, failed },
  })
}
