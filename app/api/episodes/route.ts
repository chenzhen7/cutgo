import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { throwCutGoError, withError } from "@/lib/api-error"
import { extractEpisodeAssetIds } from "@/lib/utils"

export const GET = withError(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get("projectId")

  if (!projectId) {
    throwCutGoError("MISSING_PARAMS", "projectId is required")
  }

  const episodes = await prisma.episode.findMany({
    where: { projectId },
    orderBy: [{ index: "asc" }, { createdAt: "asc" }],
    include: { episodeAssets: true },
  })

  return NextResponse.json(
    episodes.map((ep) => ({
      ...ep,
      ...extractEpisodeAssetIds(ep.episodeAssets),
      episodeAssets: undefined,
    }))
  )
})

export const POST = withError(async (request: NextRequest) => {
  const body = await request.json()
  const {
    projectId,
    index,
    title,
    rawText,
    duration,
  } = body

  if (!projectId) {
    throwCutGoError("MISSING_PARAMS", "projectId is required")
  }

  let episodeIndex = index
  if (episodeIndex === undefined || episodeIndex === null) {
    const maxIndex = await prisma.episode.aggregate({
      where: { projectId },
      _max: { index: true },
    })
    episodeIndex = (maxIndex._max.index ?? -1) + 1
  }

  const episode = await prisma.episode.create({
    data: {
      projectId,
      index: episodeIndex,
      title: title || `第${episodeIndex + 1}集`,
      rawText: typeof rawText === "string" ? rawText.trim() : null,
      wordCount: typeof rawText === "string" ? rawText.trim().length : null,
      duration: duration || "60s",
    },
    include: { episodeAssets: true },
  })

  return NextResponse.json(
    {
      ...episode,
      ...extractEpisodeAssetIds(episode.episodeAssets),
      episodeAssets: undefined,
    },
    { status: 201 }
  )
})
