import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: scriptId } = await params
  const body = await request.json()
  const { title, description, duration, emotion, bgm, location } = body

  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 })
  }

  const maxIdx = await prisma.scriptScene.aggregate({
    where: { scriptId },
    _max: { index: true },
  })
  const nextIdx = (maxIdx._max.index ?? -1) + 1

  const scene = await prisma.scriptScene.create({
    data: {
      scriptId,
      index: nextIdx,
      title,
      description: description || null,
      duration: duration || "15s",
      emotion: emotion || null,
      bgm: bgm || null,
      location: location || null,
    },
    include: { lines: { orderBy: { index: "asc" } } },
  })

  await prisma.script.update({
    where: { id: scriptId },
    data: { status: "edited" },
  })

  return NextResponse.json(scene, { status: 201 })
}
