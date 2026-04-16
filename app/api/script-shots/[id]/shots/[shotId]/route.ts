import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { buildShotAssetData, extractShotAssetIds } from "@/lib/utils"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; shotId: string }> }
) {
  const { shotId } = await params
  const body = await request.json()

  const updateData: Record<string, unknown> = {}
  const fields = [
    "content", "prompt", "negativePrompt", "duration", "imageUrl",
    "imageType", "imageUrls", "promptEnd", "gridLayout", "gridPrompts",
    "scriptLineIds", "dialogueText", "actionNote",
    "videoUrl", "videoStatus", "videoPrompt", "videoDuration", "videoTaskId",
  ]

  for (const field of fields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field]
    }
  }

  const shot = await prisma.shot.update({
    where: { id: shotId },
    data: updateData,
    include: { shotAssets: true },
  })

  // Sync ShotAsset relations if asset arrays are provided
  const hasAssetUpdate =
    body.characterIds !== undefined ||
    body.sceneId !== undefined ||
    body.propIds !== undefined

  if (hasAssetUpdate) {
    const current = extractShotAssetIds(shot.shotAssets)
    const nextCharacterIds = body.characterIds !== undefined ? body.characterIds : current.characterIds
    const nextSceneId = body.sceneId !== undefined ? body.sceneId : current.sceneId
    const nextPropIds = body.propIds !== undefined ? body.propIds : current.propIds

    await prisma.$transaction([
      prisma.shotAsset.deleteMany({ where: { shotId } }),
      ...(nextCharacterIds.length + (nextSceneId ? 1 : 0) + nextPropIds.length > 0
        ? [
            prisma.shotAsset.createMany({
              data: buildShotAssetData(shotId, nextCharacterIds, nextSceneId, nextPropIds),
            }),
          ]
        : []),
    ])
  }

  const updatedShot = await prisma.shot.findUnique({
    where: { id: shotId },
    include: { shotAssets: true },
  })

  return NextResponse.json({
    ...updatedShot,
    ...extractShotAssetIds(updatedShot!.shotAssets),
    shotAssets: undefined,
  })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; shotId: string }> }
) {
  const { id: episodeId, shotId } = await params

  await prisma.shot.delete({ where: { id: shotId } })

  const remaining = await prisma.shot.findMany({
    where: { episodeId },
    orderBy: { index: "asc" },
  })

  for (let i = 0; i < remaining.length; i++) {
    if (remaining[i].index !== i) {
      await prisma.shot.update({
        where: { id: remaining[i].id },
        data: { index: i },
      })
    }
  }

  const shots = await prisma.shot.findMany({
    where: { episodeId },
    orderBy: { index: "asc" },
    include: { shotAssets: true },
  })

  return NextResponse.json(
    shots.map((s) => ({
      ...s,
      ...extractShotAssetIds(s.shotAssets),
      shotAssets: undefined,
    }))
  )
}
