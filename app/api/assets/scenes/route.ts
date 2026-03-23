import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import * as apiError from "@/lib/api-error"

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { projectId, ...data } = body

  if (!projectId) {
    return apiError.badRequest("projectId is required")
  }

  if (data.name) {
    const existing = await prisma.assetScene.findUnique({
      where: { projectId_name: { projectId, name: data.name } },
    })
    if (existing) {
      return apiError.conflict(`场景名「${data.name}」已存在，请使用不同的名称`)
    }
  }

  const scene = await prisma.assetScene.create({
    data: { projectId, ...data },
  })

  return NextResponse.json(scene, { status: 201 })
}
