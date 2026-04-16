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
    const current = await prisma.assetProp.findUnique({ where: { id } })
    if (current && body.name !== current.name) {
      const dup = await prisma.assetProp.findUnique({
        where: { projectId_name: { projectId: current.projectId, name: body.name } },
      })
      if (dup) {
        throwCutGoError("CONFLICT", `道具名「${body.name}」已存在，请使用不同的名称`)
      }
    }
  }

  const prop = await prisma.assetProp.update({
    where: { id },
    data: body,
  })

  return NextResponse.json(prop)
})

export const DELETE = withError(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params

  await prisma.$transaction([
    prisma.episodeAsset.deleteMany({ where: { assetId: id, assetType: "prop" } }),
    prisma.shotAsset.deleteMany({ where: { assetId: id, assetType: "prop" } }),
    prisma.assetProp.delete({ where: { id } }),
  ])

  return NextResponse.json({ success: true })
})
