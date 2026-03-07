import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sceneId: string }> }
) {
  const { sceneId } = await params
  const body = await request.json()

  const scene = await prisma.episodeScene.update({
    where: { id: sceneId },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.summary !== undefined && { summary: body.summary }),
      ...(body.duration !== undefined && { duration: body.duration }),
      ...(body.characters !== undefined && { characters: body.characters }),
      ...(body.emotion !== undefined && { emotion: body.emotion }),
    },
  })

  return NextResponse.json(scene)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; sceneId: string }> }
) {
  const { id: episodeId, sceneId } = await params

  await prisma.episodeScene.delete({ where: { id: sceneId } })

  const remaining = await prisma.episodeScene.findMany({
    where: { episodeId },
    orderBy: { index: "asc" },
  })

  for (let i = 0; i < remaining.length; i++) {
    if (remaining[i].index !== i) {
      await prisma.episodeScene.update({
        where: { id: remaining[i].id },
        data: { index: i },
      })
      remaining[i] = { ...remaining[i], index: i }
    }
  }

  return NextResponse.json(remaining)
}
