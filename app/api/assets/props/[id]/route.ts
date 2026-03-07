import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  const prop = await prisma.assetProp.update({
    where: { id },
    data: body,
  })

  return NextResponse.json(prop)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  await prisma.assetProp.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
