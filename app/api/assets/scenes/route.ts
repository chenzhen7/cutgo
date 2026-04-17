import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { throwCutGoError, withError } from "@/lib/api-error"

export const POST = withError(async (request: NextRequest) => {
  const body = await request.json()
  const { projectId, ...data } = body

  if (!projectId) {
    throwCutGoError("MISSING_PARAMS", "projectId is required")
  }

  if (data.name) {
    const existing = await prisma.assetScene.findUnique({
      where: { projectId_name: { projectId, name: data.name } },
    })
    if (existing) {
      throwCutGoError("CONFLICT", `场景名「${data.name}」已存在，请使用不同的名称`)
    }
  }

  const scene = await prisma.assetScene.create({
    data: {
      projectId,
      ...data,
      imageStatus: data.imageUrl ? "completed" : "idle",
      imageTaskId: null,
      imageErrorMessage: null,
    },
  })

  return NextResponse.json(scene, { status: 201 })
})
