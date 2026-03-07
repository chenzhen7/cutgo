import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  const novel = await prisma.novel.findUnique({ where: { id } })
  if (!novel) {
    return NextResponse.json({ error: "小说不存在" }, { status: 404 })
  }

  const maxIndex = await prisma.chapter.aggregate({
    where: { novelId: id },
    _max: { index: true },
  })

  const chapter = await prisma.chapter.create({
    data: {
      novelId: id,
      index: (maxIndex._max.index ?? -1) + 1,
      title: body.title || null,
      content: body.content || "",
      wordCount: (body.content || "").length,
      selected: true,
    },
    include: { paragraphs: true },
  })

  return NextResponse.json(chapter, { status: 201 })
}
