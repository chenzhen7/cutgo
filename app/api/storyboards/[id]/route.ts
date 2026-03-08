import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const data = await request.json()

  const storyboard = await prisma.storyboard.update({
    where: { id },
    data: {
      ...(data.status !== undefined && { status: data.status }),
    },
  })

  return NextResponse.json(storyboard)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  await prisma.storyboard.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
