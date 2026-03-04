import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { countWords } from "@/lib/novel-utils"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get("projectId")

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 })
  }

  const novel = await prisma.novel.findUnique({
    where: { projectId },
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
    return NextResponse.json(null)
  }

  return NextResponse.json(novel)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { projectId, title, rawText, source, fileName } = body

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 })
  }
  if (!rawText || !rawText.trim()) {
    return NextResponse.json({ error: "文本内容不能为空" }, { status: 400 })
  }

  const existing = await prisma.novel.findUnique({ where: { projectId } })
  if (existing) {
    const updated = await prisma.novel.update({
      where: { id: existing.id },
      data: {
        title: title || null,
        rawText,
        wordCount: countWords(rawText),
        source: source || "paste",
        fileName: fileName || null,
        status: "draft",
        synopsis: null,
      },
    })

    await prisma.chapter.deleteMany({ where: { novelId: existing.id } })
    await prisma.novelCharacter.deleteMany({ where: { novelId: existing.id } })
    await prisma.plotEvent.deleteMany({ where: { novelId: existing.id } })

    return NextResponse.json(updated)
  }

  const novel = await prisma.novel.create({
    data: {
      projectId,
      title: title || null,
      rawText,
      wordCount: countWords(rawText),
      source: source || "paste",
      fileName: fileName || null,
    },
  })

  return NextResponse.json(novel, { status: 201 })
}
