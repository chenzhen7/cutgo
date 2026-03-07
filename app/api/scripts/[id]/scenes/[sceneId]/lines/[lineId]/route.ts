import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sceneId: string; lineId: string }> }
) {
  const { id: scriptId, lineId } = await params
  const body = await request.json()
  const { type, character, emotion, content, duration, parenthetical } = body

  const data: Record<string, unknown> = {}
  if (type !== undefined) data.type = type
  if (character !== undefined) data.character = character || null
  if (emotion !== undefined) data.emotion = emotion || null
  if (content !== undefined) data.content = content
  if (duration !== undefined) data.duration = duration || null
  if (parenthetical !== undefined) data.parenthetical = parenthetical || null

  const line = await prisma.scriptLine.update({
    where: { id: lineId },
    data,
  })

  await prisma.script.update({
    where: { id: scriptId },
    data: { status: "edited" },
  })

  return NextResponse.json(line)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; sceneId: string; lineId: string }> }
) {
  const { sceneId, lineId } = await params

  await prisma.scriptLine.delete({ where: { id: lineId } })

  const remaining = await prisma.scriptLine.findMany({
    where: { sceneId },
    orderBy: { index: "asc" },
  })

  for (let i = 0; i < remaining.length; i++) {
    if (remaining[i].index !== i) {
      await prisma.scriptLine.update({
        where: { id: remaining[i].id },
        data: { index: i },
      })
      remaining[i] = { ...remaining[i], index: i }
    }
  }

  return NextResponse.json(remaining)
}
