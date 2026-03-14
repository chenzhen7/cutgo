import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

const compositionInclude = {
  episode: {
    select: { id: true, index: true, title: true },
  },
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const composition = await prisma.videoComposition.findUnique({
    where: { id },
    include: compositionInclude,
  })
  if (!composition) {
    return NextResponse.json({ error: "合成任务不存在" }, { status: 404 })
  }
  return NextResponse.json(composition)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const composition = await prisma.videoComposition.findUnique({ where: { id } })
    if (!composition) {
      return NextResponse.json({ error: "合成任务不存在" }, { status: 404 })
    }
    await prisma.videoComposition.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("DELETE /api/videos/[id] error:", e)
    return NextResponse.json({ error: "删除合成任务失败" }, { status: 500 })
  }
}
