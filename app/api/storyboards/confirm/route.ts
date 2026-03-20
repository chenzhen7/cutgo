import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(request: NextRequest) {
  const { projectId } = await request.json()

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 })
  }

  const storyboards = await prisma.storyboard.findMany({
    where: { projectId },
    include: { shots: true },
  })

  const hasShots = storyboards.some((sb) => sb.shots.length > 0)
  if (!hasShots) {
    return NextResponse.json({ error: "至少需要 1 个已生成的分镜" }, { status: 400 })
  }

  const project = await prisma.project.update({
    where: { id: projectId },
    data: { step: 5, stepLabel: "视频合成" },
  })

  return NextResponse.json(project)
}
