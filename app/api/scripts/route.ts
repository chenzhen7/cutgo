import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

const scriptInclude = {
  episode: {
    select: {
      id: true,
      index: true,
      title: true,
      chapterId: true,
      chapter: { select: { id: true, index: true, title: true } },
    },
  },
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get("projectId")
  const episodeId = searchParams.get("episodeId")

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 })
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
    return NextResponse.json(
      { error: "projectId, episodeId, title are required" },
      { status: 400 }
    )
  }

  const existing = await prisma.script.findUnique({ where: { episodeId } })
  if (existing) {
    return NextResponse.json(
      { error: "该分集已有剧本" },
      { status: 409 }
    )
  }

  const script = await prisma.script.create({
    data: { projectId, episodeId, title },
    include: scriptInclude,
  })

  return NextResponse.json(script, { status: 201 })
}
