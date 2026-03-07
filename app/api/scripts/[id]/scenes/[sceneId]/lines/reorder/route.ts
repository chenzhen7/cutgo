import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sceneId: string }> }
) {
  const { sceneId } = await params
  const { orderedIds } = await request.json()

  if (!Array.isArray(orderedIds)) {
    return NextResponse.json({ error: "orderedIds is required" }, { status: 400 })
  }

  for (let i = 0; i < orderedIds.length; i++) {
    await prisma.scriptLine.update({
      where: { id: orderedIds[i] },
      data: { index: i },
    })
  }

  const lines = await prisma.scriptLine.findMany({
    where: { sceneId },
    orderBy: { index: "asc" },
  })

  return NextResponse.json(lines)
}
