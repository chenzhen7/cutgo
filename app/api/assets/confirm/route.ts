import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { throwCutGoError, withError } from "@/lib/api-error"

export const POST = withError(async (request: NextRequest) => {
  const { projectId } = await request.json()

  if (!projectId) {
    throwCutGoError("MISSING_PARAMS", "projectId is required")
  }

  const characterCount = await prisma.assetCharacter.count({ where: { projectId } })
  if (characterCount === 0) {
    throwCutGoError("VALIDATION", "至少需要 1 个角色资产")
  }

  const project = await prisma.project.update({
    where: { id: projectId },
    data: { step: 2, stepLabel: "剧本生成" },
  })

  return NextResponse.json(project)
})
