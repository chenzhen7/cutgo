import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { throwCutGoError, withError } from "@/lib/api-error"

export const GET = withError(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get("projectId") ?? ""

  if (!projectId) {
    throwCutGoError("MISSING_PARAMS", "projectId is required")
  }

  const [characters, scenes, props] = await Promise.all([
    prisma.assetCharacter.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.assetScene.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.assetProp.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
    }),
  ])

  return NextResponse.json({ characters, scenes, props })
})
