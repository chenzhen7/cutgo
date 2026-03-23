import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function PUT(request: NextRequest) {
  const { projectId, orderedIds } = await request.json()

  if (!projectId || !orderedIds?.length) {
    return NextResponse.json({ error: "projectId and orderedIds are required" }, { status: 400 })
  }

  for (let i = 0; i < orderedIds.length; i++) {
    await prisma.episode.update({
      where: { id: orderedIds[i] },
      data: { index: i + 1 },
    })
  }

  const episodes = await prisma.episode.findMany({
    where: { projectId },
    orderBy: [{ index: "asc" }, { createdAt: "asc" }],
  })

  return NextResponse.json(episodes)
}
