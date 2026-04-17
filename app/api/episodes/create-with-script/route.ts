import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { throwCutGoError, withError } from "@/lib/api-error"
import { countWords } from "@/lib/novel-utils"
import { extractEpisodeAssetIds } from "@/lib/utils"

export const POST = withError(async (request: NextRequest) => {
  const body = await request.json()
  const {
    projectId,
    title: rawTitle,
    rawText,
    extractAssets,
  } = body as {
    projectId: string
    title?: string
    rawText: string
    extractAssets?: boolean
  }

  if (!projectId) throwCutGoError("MISSING_PARAMS", "projectId is required")
  if (!rawTitle?.trim()) throwCutGoError("VALIDATION", "分集标题不能为空")
  if (!rawText?.trim()) throwCutGoError("VALIDATION", "原文内容不能为空")

  const maxIndex = await prisma.episode.aggregate({
    where: { projectId },
    _max: { index: true },
  })
  const episodeIndex = (maxIndex._max.index ?? -1) + 1

  const episode = await prisma.episode.create({
    data: {
      projectId,
      index: episodeIndex,
      title: rawTitle.trim(),
      rawText: rawText.trim(),
      wordCount: countWords(rawText.trim()),
      duration: "3min",
    },
    include: { episodeAssets: true },
  })

  return NextResponse.json(
    {
      episode: {
        ...episode,
        ...extractEpisodeAssetIds(episode.episodeAssets),
        episodeAssets: undefined,
      },
      extractAssets: extractAssets ?? false,
    },
    { status: 201 }
  )
})
