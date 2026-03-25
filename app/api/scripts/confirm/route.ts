import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { throwCutGoError, withError } from "@/lib/api-error"

export const POST = withError(async (request: NextRequest) => {
  const { projectId } = await request.json()

  if (!projectId) {
    throwCutGoError("MISSING_PARAMS", "projectId is required")
  }

  const scriptCount = await prisma.script.count({ where: { projectId } })
  if (scriptCount === 0) {
    throwCutGoError("VALIDATION", "至少需要 1 个已生成的剧本")
  }

  const project = await prisma.project.update({
    where: { id: projectId },
    data: { step: 3, stepLabel: "分镜生成" },
  })

  return NextResponse.json(project)
})
