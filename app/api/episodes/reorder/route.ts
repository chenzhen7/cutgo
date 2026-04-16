import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { throwCutGoError, withError } from "@/lib/api-error"
import { extractEpisodeAssetIds } from "@/lib/utils"

export const PUT = withError(async (request: NextRequest) => {
  const { projectId, orderedIds } = await request.json()

  if (!projectId || !orderedIds?.length) {
    throwCutGoError("MISSING_PARAMS", "projectId and orderedIds are required")
  }

  for (let i = 0; i < orderedIds.length; i++) {
    await prisma.episode.update({
      where: { id: orderedIds[i] },
      data: { index: i },
    })
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
