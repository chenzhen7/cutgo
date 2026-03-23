import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { badRequest, validationError } from "@/lib/api-error"

export async function POST(request: NextRequest) {
  const { projectId } = await request.json()

  if (!projectId) {
    return badRequest("projectId is required")
  }

  const shotCount = await prisma.shot.count({
    where: { script: { projectId } },
  })
  const hasShots = shotCount > 0
  if (!hasShots) {
    return validationError("至少需要 1 个已生成的分镜")
  }

  const project = await prisma.project.update({
    where: { id: projectId },
    data: { step: 4, stepLabel: "视频合成" },
  })

  return NextResponse.json(project)
}
