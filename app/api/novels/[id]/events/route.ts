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

  const event = await prisma.plotEvent.create({
    data: {
      novelId: id,
      index: body.index,
      type: body.type,
      summary: body.summary,
      detail: body.detail || null,
      emotion: body.emotion || null,
      sourceRef: body.sourceRef || null,
      adaptScore: body.adaptScore || null,
      isHighlight: body.isHighlight || false,
    },
  })

  return NextResponse.json(event, { status: 201 })
}
