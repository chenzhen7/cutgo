import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { throwCutGoError, withError } from "@/lib/api-error"

export const PATCH = withError(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const body = await request.json()

  if (body.name) {
    const current = await prisma.assetScene.findUnique({ where: { id } })
    if (current && body.name !== current.name) {
      const dup = await prisma.assetScene.findUnique({
        where: { projectId_name: { projectId: current.projectId, name: body.name } },
      })
      if (dup) {
        throwCutGoError("CONFLICT", `场景名「${body.name}」已存在，请使用不同的名称`)
      }
    }
  }

  const updateData = { ...body } as Record<string, unknown>
  if (body.imageUrl !== undefined && body.imageStatus === undefined) {
    updateData.imageStatus = body.imageUrl ? "completed" : "idle"
  }
  if (body.imageUrl !== undefined && body.imageTaskId === undefined) {
    updateData.imageTaskId = null
  }
  if (body.imageUrl !== undefined && body.imageErrorMessage === undefined) {
    updateData.imageErrorMessage = null
  }

  const scene = await prisma.assetScene.update({
    where: { id },
    data: updateData,
  })

  return NextResponse.json(scene)
})

export const DELETE = withError(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params

  await prisma.$transaction([
    prisma.episodeAsset.deleteMany({ where: { assetId: id, assetType: "scene" } }),
    prisma.shotAsset.deleteMany({ where: { assetId: id, assetType: "scene" } }),
    prisma.assetScene.delete({ where: { id } }),
  ])

  return NextResponse.json({ success: true })
})
