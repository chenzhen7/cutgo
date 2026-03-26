import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { throwCutGoError, withError } from "@/lib/api-error"

export const GET = withError(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get("projectId")
  const episodeId = searchParams.get("episodeId")

  if (!projectId) {
    throwCutGoError("MISSING_PARAMS", "projectId is required")
  }

  const where: Record<string, string> = { projectId: projectId! }
  if (episodeId) where.id = episodeId

  const episodes = await prisma.episode.findMany({
    where,
    orderBy: { index: "asc" },
  })

  return NextResponse.json(episodes)
})

export const POST = withError(async (request: NextRequest) => {
  const body = await request.json()
  const { projectId, episodeId } = body

  if (!projectId || !episodeId) {
    throwCutGoError("MISSING_PARAMS", "projectId, episodeId are required")
  }

  const episode = await prisma.episode.findUnique({ where: { id: episodeId } })
  if (!episode) {
    throwCutGoError("NOT_FOUND", "分集不存在")
  }

  return NextResponse.json(episode, { status: 201 })
})
