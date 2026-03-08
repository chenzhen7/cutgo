import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

const storyboardInclude = {
  script: {
    select: {
      id: true,
      title: true,
      content: true,
      episodeId: true,
      episode: { select: { id: true, index: true, title: true } },
    },
  },
  shots: { orderBy: { index: "asc" as const } },
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get("projectId")
  const scriptId = searchParams.get("scriptId")
  const episodeId = searchParams.get("episodeId")

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 })
  }

  const where: Record<string, unknown> = { projectId }

  if (scriptId) {
    where.scriptId = scriptId
  } else if (episodeId) {
    where.script = { episodeId }
  }

  const storyboards = await prisma.storyboard.findMany({
    where,
    include: storyboardInclude,
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json(storyboards)
}

export async function POST(request: NextRequest) {
  const { projectId, scriptId } = await request.json()

  if (!projectId || !scriptId) {
    return NextResponse.json({ error: "projectId and scriptId are required" }, { status: 400 })
  }

  const storyboard = await prisma.storyboard.create({
    data: { projectId, scriptId },
    include: storyboardInclude,
  })

  return NextResponse.json(storyboard)
}
