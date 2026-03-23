import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { countWords } from "@/lib/novel-utils"
import * as apiError from "@/lib/api-error"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get("projectId")

  if (!projectId) {
    return apiError.badRequest("projectId is required")
  }

  const novel = await prisma.novel.findUnique({
    where: { projectId },
    include: {
      chapters: {
        orderBy: { index: "asc" },
        include: { paragraphs: { orderBy: { index: "asc" } } },
      },
    },
  })

  if (!novel) {
    return NextResponse.json(null)
  }

  return NextResponse.json(novel)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { projectId, title, rawText } = body

  if (!projectId) {
    return apiError.badRequest("projectId is required")
  }
  if (!rawText || !rawText.trim()) {
    return apiError.validationError("文本内容不能为空")
  }

  const existing = await prisma.novel.findUnique({ where: { projectId } })
  if (existing) {
    const updated = await prisma.novel.update({
      where: { id: existing.id },
      data: {
        title: title || null,
        rawText,
        wordCount: countWords(rawText),
      },
    })

    await prisma.chapter.deleteMany({ where: { novelId: existing.id } })

    return NextResponse.json(updated)
  }

  const novel = await prisma.novel.create({
    data: {
      projectId,
      title: title || null,
      rawText,
      wordCount: countWords(rawText),
    },
  })

  return NextResponse.json(novel, { status: 201 })
}
