import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { throwCutGoError, withError } from "@/lib/api-error"
import { buildEpisodeAssetData, extractEpisodeAssetIds } from "@/lib/utils"

export const PATCH = withError(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const body = await request.json()

  const episode = await prisma.episode.update({
    where: { id },
    data: {
      ...(body.index !== undefined && { index: body.index }),
      ...(body.title !== undefined && { title: body.title }),
      ...(body.duration !== undefined && { duration: body.duration }),
      ...(body.rawText !== undefined && {
        rawText: typeof body.rawText === "string" ? body.rawText.trim() : null,
      }),
      ...(body.wordCount !== undefined && { wordCount: body.wordCount }),
    },
    include: { episodeAssets: true },
  })

  // Sync EpisodeAsset relations if asset arrays are provided
  const hasAssetUpdate =
    body.characterIds !== undefined ||
    body.sceneIds !== undefined ||
    body.propIds !== undefined

  if (hasAssetUpdate) {
    const current = extractEpisodeAssetIds(episode.episodeAssets)
    const nextCharacterIds = body.characterIds !== undefined ? body.characterIds : current.characterIds
    const nextSceneIds = body.sceneIds !== undefined ? body.sceneIds : current.sceneIds
    const nextPropIds = body.propIds !== undefined ? body.propIds : current.propIds

    await prisma.$transaction([
      prisma.episodeAsset.deleteMany({ where: { episodeId: id } }),
      ...(nextCharacterIds.length + nextSceneIds.length + nextPropIds.length > 0
        ? [
            prisma.episodeAsset.createMany({
              data: buildEpisodeAssetData(id, nextCharacterIds, nextSceneIds, nextPropIds),
            }),
          ]
        : []),
    ])
  }

  return NextResponse.json({
    ...episode,
    ...extractEpisodeAssetIds(episode.episodeAssets),
    episodeAssets: undefined,
  })
})

export const DELETE = withError(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params

  const episode = await prisma.episode.findUnique({ where: { id } })
  if (!episode) {
    throwCutGoError("NOT_FOUND", "分集不存在")
  }

  await prisma.episode.delete({ where: { id } })

  const remaining = await prisma.episode.findMany({
    where: { projectId: episode.projectId },
    orderBy: [{ index: "asc" }, { createdAt: "asc" }],
  })

  // 维护 index 连续性
  for (let i = 0; i < remaining.length; i++) {
    if (remaining[i].index !== i) {
      await prisma.episode.update({
        where: { id: remaining[i].id },
        data: { index: i },
      })
      remaining[i].index = i
    }
  }

  return NextResponse.json(remaining)
})
