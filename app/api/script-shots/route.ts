import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { throwCutGoError, withError } from "@/lib/api-error"

const episodeWithShotsInclude = {
  shots: { orderBy: { index: "asc" as const } },
}

function toScriptShotPlan(episode: {
  id: string
  projectId: string
  index: number
  title: string
  script: string
  createdAt: Date
  updatedAt: Date
  shots: unknown[]
}) {
  return {
    id: episode.id,
    projectId: episode.projectId,
    episodeId: episode.id,
    episode: {
      id: episode.id,
      index: episode.index,
      title: episode.title,
      script: episode.script,
    },
    status: episode.script ? "generated" : "draft",
    shots: episode.shots,
    createdAt: episode.createdAt,
    updatedAt: episode.updatedAt,
  }
}

export const GET = withError(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get("projectId")
  const episodeId = searchParams.get("episodeId")

  if (!projectId) {
    throwCutGoError("MISSING_PARAMS", "projectId is required")
  }

  const where: Record<string, unknown> = { projectId }
  if (episodeId) where.id = episodeId

  const episodes = await prisma.episode.findMany({
    where,
    include: episodeWithShotsInclude,
    orderBy: { index: "asc" },
  })

  return NextResponse.json(episodes.map(toScriptShotPlan))
})

export const POST = withError(async (request: NextRequest) => {
  const { projectId, episodeId } = await request.json()

  if (!projectId || !episodeId) {
    throwCutGoError("MISSING_PARAMS", "projectId and episodeId are required")
  }

  const episode = await prisma.episode.findFirst({
    where: { id: episodeId, projectId },
    include: episodeWithShotsInclude,
  })
  if (!episode) throwCutGoError("NOT_FOUND", "分集不存在")

  return NextResponse.json(toScriptShotPlan(episode!))
})
