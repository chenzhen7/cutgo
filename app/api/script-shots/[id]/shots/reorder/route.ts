import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: episodeId } = await params
  const { orderedIds } = await request.json()

  if (!Array.isArray(orderedIds)) {
    return NextResponse.json({ error: "orderedIds must be an array" }, { status: 400 })
  }

  for (let i = 0; i < orderedIds.length; i++) {
    await prisma.shot.update({
      where: { id: orderedIds[i] },
      data: { index: i },
    })
  }

  const shots = await prisma.shot.findMany({
    where: { episodeId },
    orderBy: { index: "asc" },
  })

  return NextResponse.json(shots)
}
