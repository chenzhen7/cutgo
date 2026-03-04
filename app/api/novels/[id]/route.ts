import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const novel = await prisma.novel.findUnique({
    where: { id },
    include: {
      chapters: {
        orderBy: { index: "asc" },
        include: { paragraphs: { orderBy: { index: "asc" } } },
      },
      characters: { orderBy: { frequency: "desc" } },
      events: { orderBy: { index: "asc" } },
    },
  })

  if (!novel) {
    return NextResponse.json({ error: "小说不存在" }, { status: 404 })
  }

  return NextResponse.json(novel)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  const existing = await prisma.novel.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: "小说不存在" }, { status: 404 })
  }

  const novel = await prisma.novel.update({
    where: { id },
    data: body,
  })

  return NextResponse.json(novel)
}
