import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const novel = await prisma.novel.findUnique({ where: { id } })
  if (!novel) {
    return NextResponse.json({ error: "小说不存在" }, { status: 404 })
  }

  const updated = await prisma.novel.update({
    where: { id },
    data: { status: "confirmed" },
  })

  await prisma.project.update({
    where: { id: novel.projectId },
    data: { step: 2, stepLabel: "分集大纲" },
  })

  return NextResponse.json(updated)
}
