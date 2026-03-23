import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import * as apiError from "@/lib/api-error"

export async function POST(request: NextRequest) {
  const { projectId } = await request.json()

  if (!projectId) {
    return apiError.badRequest("projectId is required")
  }

  const shotCount = await prisma.shot.count({
    where: { script: { projectId } },
  })
  const hasShots = shotCount > 0
  if (!hasShots) {
    return apiError.validationError("至少需要 1 个已生成的分镜")
  }

  const project = await prisma.project.update({
    where: { id: projectId },
    data: { step: 4, stepLabel: "视频合成" },
  })

  return NextResponse.json(project)
}
