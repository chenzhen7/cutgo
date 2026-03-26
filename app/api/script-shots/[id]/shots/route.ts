import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: episodeId } = await params
  const body = await request.json()

  const {
    shotSize = "medium",
    cameraMovement = "static",
    cameraAngle = "eye_level",
    composition,
    prompt,
    negativePrompt,
    duration = "3s",
    scriptLineIds,
    dialogueText,
    actionNote,
    characterIds,
    sceneId,
    propIds,
    insertAfter,
  } = body

  if (!composition || !prompt) {
    return NextResponse.json(
      { error: "composition and prompt are required" },
      { status: 400 }
    )
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

  await prisma.shot.create({
    data: {
      episodeId,
      index: newIndex,
      shotSize,
      cameraMovement,
      cameraAngle,
      composition,
      prompt,
      negativePrompt: negativePrompt || null,
      duration,
      scriptLineIds: scriptLineIds || null,
      dialogueText: dialogueText || null,
      actionNote: actionNote || null,
      characterIds: characterIds || null,
      sceneId: sceneId || null,
      propIds: propIds || null,
    },
  })

  const shots = await prisma.shot.findMany({
    where: { episodeId },
    orderBy: { index: "asc" },
  })

  return NextResponse.json(shots)
}
