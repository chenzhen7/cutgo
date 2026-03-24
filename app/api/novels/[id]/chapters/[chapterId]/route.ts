import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { cutGoError, withError } from "@/lib/api-error"

export const PUT = withError(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string; chapterId: string }> }
) => {
  const { chapterId } = await params
  const body = await request.json()

  const existing = await prisma.chapter.findUnique({ where: { id: chapterId } })
  if (!existing) {
    throw cutGoError("NOT_FOUND", "章节不存在")
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
})

export const DELETE = withError(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; chapterId: string }> }
) => {
  const { chapterId } = await params

  const existing = await prisma.chapter.findUnique({ where: { id: chapterId } })
  if (!existing) {
    throw cutGoError("NOT_FOUND", "章节不存在")
  }

  await prisma.chapter.delete({ where: { id: chapterId } })

  // 删除后对同一小说的剩余章节按 index 顺序重新编号
  const remaining = await prisma.chapter.findMany({
    where: { novelId: existing.novelId },
    orderBy: { index: "asc" },
    select: { id: true },
  })
  await Promise.all(
    remaining.map((ch, i) =>
      prisma.chapter.update({ where: { id: ch.id }, data: { index: i } })
    )
  )

  return NextResponse.json({ success: true })
})
