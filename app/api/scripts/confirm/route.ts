import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { badRequest, validationError } from "@/lib/api-error"

export async function POST(request: NextRequest) {
  const { projectId } = await request.json()

  if (!projectId) {
    return badRequest("projectId is required")
  }

  const scriptCount = await prisma.script.count({ where: { projectId } })
  if (scriptCount === 0) {
    return validationError("至少需要 1 个已生成的剧本")
  }

  const project = await prisma.project.update({
    where: { id: projectId },
    data: { step: 3, stepLabel: "分镜生成" },
  })

  return NextResponse.json(project)
}
