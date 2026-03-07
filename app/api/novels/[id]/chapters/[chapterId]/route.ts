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

  const data: Record<string, unknown> = {}
  if (body.title !== undefined) data.title = body.title
  if (body.content !== undefined) {
    data.content = body.content
    data.wordCount = body.content.length
  }
  if (body.selected !== undefined) data.selected = body.selected

  const chapter = await prisma.chapter.update({
    where: { id: chapterId },
    data,
    include: { paragraphs: true },
  })

  return NextResponse.json(chapter)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; chapterId: string }> }
) {
  const { chapterId } = await params

  const existing = await prisma.chapter.findUnique({ where: { id: chapterId } })
  if (!existing) {
    return NextResponse.json({ error: "章节不存在" }, { status: 404 })
  }

  await prisma.chapter.delete({ where: { id: chapterId } })

  return NextResponse.json({ success: true })
}
