import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { conflict } from "@/lib/api-error"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  if (body.name) {
    const current = await prisma.assetScene.findUnique({ where: { id } })
    if (current && body.name !== current.name) {
      const dup = await prisma.assetScene.findUnique({
        where: { projectId_name: { projectId: current.projectId, name: body.name } },
      })
      if (dup) {
        return conflict(`场景名「${body.name}」已存在，请使用不同的名称`)
      }
    }
  }

  const scene = await prisma.assetScene.update({
    where: { id },
    data: body,
  })

  return NextResponse.json(scene)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  await prisma.assetScene.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
