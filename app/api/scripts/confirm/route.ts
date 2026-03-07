import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(request: NextRequest) {
  const { projectId } = await request.json()

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 })
  }

  const scriptCount = await prisma.script.count({ where: { projectId } })
  if (scriptCount === 0) {
    return NextResponse.json(
      { error: "至少需要 1 个已生成的剧本" },
      { status: 400 }
    )
  }

  const project = await prisma.project.update({
    where: { id: projectId },
    data: { step: 4, stepLabel: "角色生成" },
  })

  return NextResponse.json(project)
}
