import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { Prisma } from "@/lib/generated/prisma/client"
import { countWords } from "@/lib/novel-utils"
import { cutGoError, withError } from "@/lib/api-error"

export const GET = withError(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params

  const novel = await prisma.novel.findUnique({
    where: { id },
    include: {
      chapters: {
        orderBy: { index: "asc" },
        include: { paragraphs: { orderBy: { index: "asc" } } },
      },
    },
  })

  if (!novel) {
    throw cutGoError("NOT_FOUND", "小说不存在")
  }

  return NextResponse.json(novel)
})

export const PATCH = withError(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const body = await request.json() as Record<string, unknown>

  const existing = await prisma.novel.findUnique({ where: { id } })
  if (!existing) {
    throw cutGoError("NOT_FOUND", "小说不存在")
  }

  const data: Prisma.NovelUpdateInput = {}
  if ("title" in body) data.title = body.title === null ? null : String(body.title)
  if (typeof body.rawText === "string") {
    data.rawText = body.rawText
    data.wordCount = countWords(body.rawText)
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(existing)
  }

  const novel = await prisma.novel.update({
    where: { id },
    data,
  })

  return NextResponse.json(novel)
})
