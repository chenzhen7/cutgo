import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { notFound } from "@/lib/api-error"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const project = await prisma.project.findUnique({ where: { id } })

  if (!project) {
    return notFound("项目不存在")
  }

  return NextResponse.json(project)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  const existing = await prisma.project.findUnique({ where: { id } })
  if (!existing) {
    return notFound("项目不存在")
  }

  const project = await prisma.project.update({
    where: { id },
    data: body,
  })

  return NextResponse.json(project)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const existing = await prisma.project.findUnique({ where: { id } })
  if (!existing) {
    return notFound("项目不存在")
  }

  await prisma.project.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
