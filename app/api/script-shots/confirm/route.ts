import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { throwCutGoError, withError } from "@/lib/api-error"

export const POST = withError(async (request: NextRequest) => {
  const { projectId } = await request.json()

  if (!projectId) {
    throwCutGoError("MISSING_PARAMS", "projectId is required")
  }

  const shotCount = await prisma.shot.count({
    where: { episode: { projectId } },
  })
  if (shotCount === 0) {
    throwCutGoError("VALIDATION", "至少需要 1 个已生成的分镜")
  }

  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
  })

  return NextResponse.json(project)
})
