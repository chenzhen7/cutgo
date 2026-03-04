import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; chapterId: string }> }
) {
  const { chapterId } = await params
  const body = await request.json()

  const existing = await prisma.chapter.findUnique({ where: { id: chapterId } })
  if (!existing) {
    return NextResponse.json({ error: "章节不存在" }, { status: 404 })
  }

  const chapter = await prisma.chapter.update({
    where: { id: chapterId },
    data: body,
  })

  return NextResponse.json(chapter)
}
