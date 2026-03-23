import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: scriptId } = await params
  const data = await request.json()

  const script = await prisma.script.update({
    where: { id: scriptId },
    data: { ...(data.status !== undefined && { status: data.status }) },
  })

  return NextResponse.json({ id: script.id, status: script.status })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: scriptId } = await params

  await prisma.shot.deleteMany({ where: { scriptId } })
  await prisma.script.update({
    where: { id: scriptId },
    data: { status: "draft" },
  })

  return NextResponse.json({ success: true })
}
