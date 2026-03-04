import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const { orderedIds } = body as { orderedIds: string[] }

  if (!orderedIds || !Array.isArray(orderedIds)) {
    return NextResponse.json({ error: "orderedIds is required" }, { status: 400 })
  }

  const novel = await prisma.novel.findUnique({ where: { id } })
  if (!novel) {
    return NextResponse.json({ error: "小说不存在" }, { status: 404 })
  }

  for (let i = 0; i < orderedIds.length; i++) {
    await prisma.plotEvent.update({
      where: { id: orderedIds[i] },
      data: { index: i },
    })
  }

  const events = await prisma.plotEvent.findMany({
    where: { novelId: id },
    orderBy: { index: "asc" },
  })

  return NextResponse.json(events)
}
