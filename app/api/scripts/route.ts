import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { throwCutGoError, withError } from "@/lib/api-error"

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

export const GET = withError(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get("projectId")
  const episodeId = searchParams.get("episodeId")

  if (!projectId) {
    throwCutGoError("MISSING_PARAMS", "projectId is required")
  }

  const where: Record<string, string> = { projectId }
  if (episodeId) where.episodeId = episodeId

  const scripts = await prisma.script.findMany({
    where,
    orderBy: { createdAt: "asc" },
    include: scriptInclude,
  })

  return NextResponse.json(scripts)
})

export const POST = withError(async (request: NextRequest) => {
  const body = await request.json()
  const { projectId, episodeId, title } = body

  if (!projectId || !episodeId || !title) {
    throwCutGoError("MISSING_PARAMS", "projectId, episodeId, title are required")
  }

  const existing = await prisma.script.findUnique({ where: { episodeId } })
  if (existing) {
    throwCutGoError("CONFLICT", "该分集已有剧本")
  }

  const script = await prisma.script.create({
    data: { projectId, episodeId, title },
    include: scriptInclude,
  })

  return NextResponse.json(script, { status: 201 })
})
