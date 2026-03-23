import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import * as apiError from "@/lib/api-error"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get("projectId")

  if (!projectId) {
    return apiError.badRequest("projectId is required")
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
}
