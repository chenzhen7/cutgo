import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { cutGoError, withError } from "@/lib/api-error"

export const PUT = withError(async (request: NextRequest) => {
  const { projectId, orderedIds } = await request.json()

  if (!projectId || !orderedIds?.length) {
    throw cutGoError("MISSING_PARAMS", "projectId and orderedIds are required")
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
})
