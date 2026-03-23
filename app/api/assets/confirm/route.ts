import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import * as apiError from "@/lib/api-error"

export async function POST(request: NextRequest) {
  const { projectId } = await request.json()

  if (!projectId) {
    return apiError.badRequest("projectId is required")
  }

  const characterCount = await prisma.assetCharacter.count({ where: { projectId } })
  if (characterCount === 0) {
    return apiError.validationError("至少需要 1 个角色资产")
  }

  const project = await prisma.project.update({
    where: { id: projectId },
    data: { step: 2, stepLabel: "剧本生成" },
  })

  return NextResponse.json(project)
}
