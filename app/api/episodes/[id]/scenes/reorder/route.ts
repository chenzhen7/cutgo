import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: episodeId } = await params
  const { orderedIds } = await request.json()

  if (!orderedIds?.length) {
    return NextResponse.json({ error: "orderedIds is required" }, { status: 400 })
  }

  for (let i = 0; i < orderedIds.length; i++) {
    await prisma.episodeScene.update({
      where: { id: orderedIds[i] },
      data: { index: i },
    })
  }

  const scenes = await prisma.episodeScene.findMany({
    where: { episodeId },
    orderBy: { index: "asc" },
  })

  return NextResponse.json(scenes)
}
