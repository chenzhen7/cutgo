import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: scriptId } = await params
  const { orderedIds } = await request.json()

  if (!Array.isArray(orderedIds)) {
    return NextResponse.json({ error: "orderedIds is required" }, { status: 400 })
  }

  for (let i = 0; i < orderedIds.length; i++) {
    await prisma.scriptScene.update({
      where: { id: orderedIds[i] },
      data: { index: i },
    })
  }

  const scenes = await prisma.scriptScene.findMany({
    where: { scriptId },
    orderBy: { index: "asc" },
    include: { lines: { orderBy: { index: "asc" } } },
  })

  return NextResponse.json(scenes)
}
