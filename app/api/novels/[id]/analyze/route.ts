import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { detectChapters, splitParagraphs, countWords } from "@/lib/novel-utils"

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const novel = await prisma.novel.findUnique({ where: { id } })
  if (!novel) {
    return NextResponse.json({ error: "小说不存在" }, { status: 404 })
  }
  if (!novel.rawText || !novel.rawText.trim()) {
    return NextResponse.json({ error: "文本内容为空" }, { status: 400 })
  }

  try {
    await prisma.chapter.deleteMany({ where: { novelId: id } })

    const detectedChapters = detectChapters(novel.rawText)

    for (const ch of detectedChapters) {
      const paragraphs = splitParagraphs(ch.content)
      await prisma.chapter.create({
        data: {
          novelId: id,
          index: ch.index,
          title: ch.title,
          content: ch.content,
          wordCount: ch.wordCount,
          paragraphs: {
            create: paragraphs.map((p, i) => ({
              index: i,
              content: p,
              wordCount: countWords(p),
            })),
          },
        },
      })
    }

    const updated = await prisma.novel.findUnique({
      where: { id },
      include: {
        chapters: {
          orderBy: { index: "asc" },
          include: { paragraphs: { orderBy: { index: "asc" } } },
        },
      },
    })

    if (!updated) {
      return NextResponse.json({ error: "小说不存在" }, { status: 404 })
    }

    return NextResponse.json({
      ...updated,
      stats: {
        totalWords: novel.wordCount,
        chapterCount: detectedChapters.length,
      },
    })
  } catch (err) {
    console.error("Analysis failed:", err)
    return NextResponse.json(
      { error: "分析失败，请重试" },
      { status: 500 }
    )
  }
}
