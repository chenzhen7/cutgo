import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { projectId } = await request.json()

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 })
    }

    const completedTask = await prisma.videoComposition.findFirst({
      where: { projectId, status: "completed" },
    })

    if (!completedTask) {
      return NextResponse.json(
        { error: "至少需要有 1 集视频合成完成才能进入下一步" },
        { status: 400 }
      )
    }

    const project = await prisma.project.update({
      where: { id: projectId },
      data: { step: 7, stepLabel: "导出发布" },
    })

    return NextResponse.json(project)
  } catch (e) {
    console.error("POST /api/videos/confirm error:", e)
    return NextResponse.json({ error: "确认合成失败" }, { status: 500 })
  }
}
