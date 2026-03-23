import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { badRequest, conflict } from "@/lib/api-error"

const scriptInclude = {
  episode: {
    select: {
      id: true,
      index: true,
      title: true,
      chapterIds: true,
    },
  },
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get("projectId")
  const episodeId = searchParams.get("episodeId")

  if (!projectId) {
    return badRequest("projectId is required")
  }

  const where: Record<string, string> = { projectId }
  if (episodeId) where.episodeId = episodeId

  const scripts = await prisma.script.findMany({
    where,
    orderBy: { createdAt: "asc" },
    include: scriptInclude,
  })

  return NextResponse.json(scripts)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { projectId, episodeId, title } = body

  if (!projectId || !episodeId || !title) {
    return badRequest("projectId, episodeId, title are required")
  }

  const existing = await prisma.script.findUnique({ where: { episodeId } })
  if (existing) {
    return conflict("该分集已有剧本")
  }

  const script = await prisma.script.create({
    data: { projectId, episodeId, title },
    include: scriptInclude,
  })

  return NextResponse.json(script, { status: 201 })
}
