import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { badRequest, conflict } from "@/lib/api-error"

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { projectId, ...data } = body

  if (!projectId) {
    return badRequest("projectId is required")
  }

  if (data.name) {
    const existing = await prisma.assetProp.findUnique({
      where: { projectId_name: { projectId, name: data.name } },
    })
    if (existing) {
      return conflict(`道具名「${data.name}」已存在，请使用不同的名称`)
    }
  }

  const prop = await prisma.assetProp.create({
    data: { projectId, ...data },
  })

  return NextResponse.json(prop, { status: 201 })
}
