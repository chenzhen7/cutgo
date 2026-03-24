import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { cutGoError, withError } from "@/lib/api-error"

export const POST = withError(async (request: NextRequest) => {
  const { projectId } = await request.json()

  if (!projectId) {
    throw cutGoError("MISSING_PARAMS", "projectId is required")
  }

  const shotCount = await prisma.shot.count({
    where: { script: { projectId } },
  })
  const hasShots = shotCount > 0
  if (!hasShots) {
    throw cutGoError("VALIDATION", "至少需要 1 个已生成的分镜")
  }

  const project = await prisma.project.update({
    where: { id: projectId },
    data: { step: 4, stepLabel: "视频合成" },
  })

  return NextResponse.json(project)
})
