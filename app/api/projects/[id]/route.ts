import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const project = await prisma.project.findUnique({ where: { id } })

  if (!project) {
    return NextResponse.json({ error: "项目不存在" }, { status: 404 })
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
    return NextResponse.json({ error: "项目不存在" }, { status: 404 })
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
    return NextResponse.json({ error: "项目不存在" }, { status: 404 })
  }

  await prisma.project.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
