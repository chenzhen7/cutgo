import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { badRequest } from "@/lib/api-error"

export async function PUT(request: NextRequest) {
  const { projectId, orderedIds } = await request.json()

  if (!projectId || !orderedIds?.length) {
    return badRequest("projectId and orderedIds are required")
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
