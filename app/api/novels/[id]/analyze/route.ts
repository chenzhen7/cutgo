import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { detectChapters, splitParagraphs, countWords } from "@/lib/novel-utils"
import { CutGoError, cutGoError, withError } from "@/lib/api-error"

export const POST = withError(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params

  const novel = await prisma.novel.findUnique({ where: { id } })
  if (!novel) {
    throw cutGoError("NOT_FOUND", "小说不存在")
  }
  if (!novel.rawText || !novel.rawText.trim()) {
    throw cutGoError("VALIDATION", "文本内容为空")
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
      throw cutGoError("NOT_FOUND", "小说不存在")
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
    if (err instanceof CutGoError) throw err
    throw cutGoError("INTERNAL", "分析失败，请重试")
  }
})
