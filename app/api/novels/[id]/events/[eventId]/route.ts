import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  const { eventId } = await params
  const body = await request.json()

  const existing = await prisma.plotEvent.findUnique({ where: { id: eventId } })
  if (!existing) {
    return NextResponse.json({ error: "事件不存在" }, { status: 404 })
  }

  const event = await prisma.plotEvent.update({
    where: { id: eventId },
    data: body,
  })

  return NextResponse.json(event)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  const { eventId } = await params

  const existing = await prisma.plotEvent.findUnique({ where: { id: eventId } })
  if (!existing) {
    return NextResponse.json({ error: "事件不存在" }, { status: 404 })
  }

  await prisma.plotEvent.delete({ where: { id: eventId } })
  return NextResponse.json({ success: true })
}
