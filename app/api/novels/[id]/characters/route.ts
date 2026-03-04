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

  const character = await prisma.novelCharacter.create({
    data: {
      novelId: id,
      name: body.name,
      role: body.role || "supporting",
      description: body.description || null,
      firstAppear: body.firstAppear || null,
      frequency: body.frequency || 1,
      relations: body.relations ? JSON.stringify(body.relations) : null,
    },
  })

  return NextResponse.json(character, { status: 201 })
}
