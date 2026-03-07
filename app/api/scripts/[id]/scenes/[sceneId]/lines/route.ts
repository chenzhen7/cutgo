import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sceneId: string }> }
) {
  const { id: scriptId, sceneId } = await params
  const body = await request.json()
  const { type, character, emotion, content, duration, parenthetical, insertAfter } = body

  if (!type || !content) {
    return NextResponse.json({ error: "type and content are required" }, { status: 400 })
  }

  let insertIndex: number

  if (insertAfter) {
    const afterLine = await prisma.scriptLine.findUnique({ where: { id: insertAfter } })
    if (!afterLine) {
      return NextResponse.json({ error: "insertAfter line not found" }, { status: 400 })
    }
    insertIndex = afterLine.index + 1

    await prisma.scriptLine.updateMany({
      where: { sceneId, index: { gte: insertIndex } },
      data: { index: { increment: 1 } },
    })
  } else {
    const maxIdx = await prisma.scriptLine.aggregate({
      where: { sceneId },
      _max: { index: true },
    })
    insertIndex = (maxIdx._max.index ?? -1) + 1
  }

  const line = await prisma.scriptLine.create({
    data: {
      sceneId,
      index: insertIndex,
      type,
      character: character || null,
      emotion: emotion || null,
      content,
      duration: duration || null,
      parenthetical: parenthetical || null,
    },
  })

  await prisma.script.update({
    where: { id: scriptId },
    data: { status: "edited" },
  })

  return NextResponse.json(line, { status: 201 })
}
