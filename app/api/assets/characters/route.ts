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
    const existing = await prisma.assetCharacter.findUnique({
      where: { projectId_name: { projectId, name: data.name } },
    })
    if (existing) {
      throwCutGoError("CONFLICT", `角色名「${data.name}」已存在，请使用不同的名称`)
    }
  }

  const character = await prisma.assetCharacter.create({
    data: { projectId, ...data },
  })

  return NextResponse.json(character, { status: 201 })
})
