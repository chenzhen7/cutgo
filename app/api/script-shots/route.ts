import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { badRequest, notFound } from "@/lib/api-error"

const scriptWithShotsInclude = {
  episode: { select: { id: true, index: true, title: true } },
  shots: { orderBy: { index: "asc" as const } },
}

function toScriptShotPlan(script: {
  id: string
  projectId: string
  status: string
  createdAt: Date
  updatedAt: Date
  title: string
  content: string
  episodeId: string
  episode: { id: string; index: number; title: string }
  shots: unknown[]
}) {
  return {
    id: script.id,
    projectId: script.projectId,
    scriptId: script.id,
    script: {
      id: script.id,
      title: script.title,
      content: script.content,
      episodeId: script.episodeId,
      episode: script.episode,
    },
    status: script.status,
    shots: script.shots,
    createdAt: script.createdAt,
    updatedAt: script.updatedAt,
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get("projectId")
  const scriptId = searchParams.get("scriptId")
  const episodeId = searchParams.get("episodeId")

  if (!projectId) {
    return badRequest("projectId is required")
  }

  const where: Record<string, unknown> = { projectId }

  if (scriptId) {
    where.id = scriptId
  } else if (episodeId) {
    where.episodeId = episodeId
  }

  const scripts = await prisma.script.findMany({
    where,
    include: scriptWithShotsInclude,
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json(scripts.map(toScriptShotPlan))
}

export async function POST(request: NextRequest) {
  const { projectId, scriptId } = await request.json()

  if (!projectId || !scriptId) {
    return badRequest("projectId and scriptId are required")
  }

  const script = await prisma.script.findFirst({
    where: { id: scriptId, projectId },
    include: scriptWithShotsInclude,
  })
  if (!script) return notFound("script not found")

  return NextResponse.json(toScriptShotPlan(script))
}
