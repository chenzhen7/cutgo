import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; shotId: string }> }
) {
  const { shotId } = await params
  const body = await request.json()

  const updateData: Record<string, unknown> = {}
  const fields = [
    "prompt", "negativePrompt", "duration", "imageUrl",
    "imageType", "imageUrls", "promptEnd", "gridLayout", "gridPrompts",
    "scriptLineIds", "dialogueText", "actionNote",
    "videoUrl", "videoStatus", "videoPrompt", "videoDuration", "videoTaskId",
    "characterIds", "sceneId", "propIds",
  ]

  for (const field of fields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field]
    }
  }

  const shot = await prisma.shot.update({
    where: { id: shotId },
    data: updateData,
  })

  return NextResponse.json(shot)
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
  })

  return NextResponse.json(shots)
}
