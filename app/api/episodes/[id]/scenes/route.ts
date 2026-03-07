import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: episodeId } = await params
  const body = await request.json()

  const maxIndex = await prisma.episodeScene.aggregate({
    where: { episodeId },
    _max: { index: true },
  })
  const nextIndex = (maxIndex._max.index ?? -1) + 1

  const scene = await prisma.episodeScene.create({
    data: {
      episodeId,
      index: nextIndex,
      title: body.title || "新场景",
      summary: body.summary || "",
      duration: body.duration || "15s",
      characters: body.characters || null,
      emotion: body.emotion || null,
    },
  })

  return NextResponse.json(scene, { status: 201 })
}
