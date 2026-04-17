import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { throwCutGoError, withError } from "@/lib/api-error"

export const GET = withError(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get("projectId") ?? ""
  const characterIds = searchParams.getAll("characterIds").filter(Boolean)
  const sceneIds = searchParams.getAll("sceneIds").filter(Boolean)
  const propIds = searchParams.getAll("propIds").filter(Boolean)

  if (!projectId) {
    throwCutGoError("MISSING_PARAMS", "projectId is required")
  }

  const [characters, scenes, props] = await Promise.all([
    prisma.assetCharacter.findMany({
      where: {
        projectId,
        ...(characterIds.length > 0 ? { id: { in: characterIds } } : {}),
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.assetScene.findMany({
      where: {
        projectId,
        ...(sceneIds.length > 0 ? { id: { in: sceneIds } } : {}),
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.assetProp.findMany({
      where: {
        projectId,
        ...(propIds.length > 0 ? { id: { in: propIds } } : {}),
      },
      orderBy: { createdAt: "asc" },
    }),
  ])

  return NextResponse.json({ characters, scenes, props })
})
