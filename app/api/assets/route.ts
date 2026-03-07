import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get("projectId")

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 })
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
