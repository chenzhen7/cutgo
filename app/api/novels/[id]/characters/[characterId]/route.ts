import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; characterId: string }> }
) {
  const { characterId } = await params
  const body = await request.json()

  const existing = await prisma.novelCharacter.findUnique({ where: { id: characterId } })
  if (!existing) {
    return NextResponse.json({ error: "角色不存在" }, { status: 404 })
  }

  const data: Record<string, unknown> = { ...body }
  if (body.relations && typeof body.relations !== "string") {
    data.relations = JSON.stringify(body.relations)
  }

  const character = await prisma.novelCharacter.update({
    where: { id: characterId },
    data,
  })

  return NextResponse.json(character)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; characterId: string }> }
) {
  const { characterId } = await params

  const existing = await prisma.novelCharacter.findUnique({ where: { id: characterId } })
  if (!existing) {
    return NextResponse.json({ error: "角色不存在" }, { status: 404 })
  }

  await prisma.novelCharacter.delete({ where: { id: characterId } })
  return NextResponse.json({ success: true })
}
