import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(request: NextRequest) {
  const { projectId } = await request.json()

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 })
  }

  const episodeCount = await prisma.episode.count({ where: { projectId } })
  if (episodeCount === 0) {
    return NextResponse.json({ error: "至少需要 1 集分集大纲" }, { status: 400 })
  }

  await prisma.project.update({
    where: { id: projectId },
    data: { step: 3, stepLabel: "资产生成" },
  })

  return NextResponse.json({ success: true })
}
