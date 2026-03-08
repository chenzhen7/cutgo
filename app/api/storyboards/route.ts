import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

const storyboardInclude = {
  scriptScene: {
    include: {
      lines: { orderBy: { index: "asc" as const } },
      script: {
        select: {
          id: true,
          episodeId: true,
          episode: { select: { id: true, index: true, title: true } },
        },
      },
    },
  },
  shots: { orderBy: { index: "asc" as const } },
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get("projectId")
  const scriptSceneId = searchParams.get("scriptSceneId")
  const episodeId = searchParams.get("episodeId")

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 })
  }

  const where: Record<string, unknown> = { projectId }

  if (scriptSceneId) {
    where.scriptSceneId = scriptSceneId
  } else if (episodeId) {
    where.scriptScene = {
      script: { episodeId },
    }
  }

  const storyboards = await prisma.storyboard.findMany({
    where,
    include: storyboardInclude,
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json(storyboards)
}

export async function POST(request: NextRequest) {
  const { projectId, scriptSceneId } = await request.json()

  if (!projectId || !scriptSceneId) {
    return NextResponse.json({ error: "projectId and scriptSceneId are required" }, { status: 400 })
  }

  const existing = await prisma.storyboard.findUnique({ where: { scriptSceneId } })
  if (existing) {
    return NextResponse.json({ error: "该场景已有分镜板" }, { status: 409 })
  }

  const storyboard = await prisma.storyboard.create({
    data: { projectId, scriptSceneId },
    include: storyboardInclude,
  })

  return NextResponse.json(storyboard)
}
