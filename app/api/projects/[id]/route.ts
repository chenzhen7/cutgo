import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { throwCutGoError, withError } from "@/lib/api-error"

export const GET = withError(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params

  const project = await prisma.project.findUnique({ where: { id } })

  if (!project) {
    throwCutGoError("NOT_FOUND", "项目不存在")
  }

  return NextResponse.json(project)
})

export const PATCH = withError(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const body = await request.json()

  const existing = await prisma.project.findUnique({ where: { id } })
  if (!existing) {
    throwCutGoError("NOT_FOUND", "项目不存在")
  }

  const project = await prisma.project.update({
    where: { id },
    data: body,
  })

  return NextResponse.json(project)
})

export const DELETE = withError(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params

  const existing = await prisma.project.findUnique({ where: { id } })
  if (!existing) {
    throwCutGoError("NOT_FOUND", "项目不存在")
  }

  await prisma.project.delete({ where: { id } })

  return NextResponse.json({ success: true })
})
