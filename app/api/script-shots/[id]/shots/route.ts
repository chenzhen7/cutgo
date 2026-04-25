import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { throwCutGoError, withError } from "@/lib/api-error"
import { buildShotAssetData, extractShotAssetIds } from "@/lib/utils"

export const POST = withError(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id: episodeId } = await params
  const body = await request.json()

  const {
    content,
    lastContent,
    negativePrompt,
    duration = 3,
    scriptLineIds,
    dialogueText,
    actionNote,
    characterIds,
    sceneId,
    propIds,
    insertAfter,
    volume = 100,
    speed = 1,
  } = body

  if (!content) {
    throwCutGoError("MISSING_PARAMS", "缺少分镜描述")
  }

  const existingShots = await prisma.shot.findMany({
    where: { episodeId },
    orderBy: { index: "asc" },
  })

  let newIndex: number
  if (insertAfter) {
    const afterShot = existingShots.find((s) => s.id === insertAfter)
    newIndex = afterShot ? afterShot.index + 1 : existingShots.length
  } else {
    newIndex = existingShots.length
  }

  const shotsToShift = existingShots.filter((s) => s.index >= newIndex)
  for (const shot of shotsToShift) {
    await prisma.shot.update({
      where: { id: shot.id },
      data: { index: shot.index + 1 },
    })
  }

  const shot = await prisma.shot.create({
    data: {
      episodeId,
      index: newIndex,
      content,
      lastContent: lastContent || null,
      negativePrompt: negativePrompt || null,
      duration,
      scriptLineIds: scriptLineIds || null,
      dialogueText: dialogueText || null,
      actionNote: actionNote || null,
      volume,
      speed,
    },
  })

  const assets = buildShotAssetData(shot.id, characterIds, sceneId, propIds)
  if (assets.length > 0) {
    await prisma.shotAsset.createMany({ data: assets })
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
})
