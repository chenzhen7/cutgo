import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { throwCutGoError, withError } from "@/lib/api-error"
import { episodeWithShotsInclude, toScriptShotPlan } from "./utils"

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

