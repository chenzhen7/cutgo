import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sceneId: string }> }
) {
  const { id: scriptId, sceneId } = await params
  const body = await request.json()
  const { title, description, duration, emotion, bgm, location } = body

  const data: Record<string, unknown> = {}
  if (title !== undefined) data.title = title
  if (description !== undefined) data.description = description
  if (duration !== undefined) data.duration = duration
  if (emotion !== undefined) data.emotion = emotion
  if (bgm !== undefined) data.bgm = bgm
  if (location !== undefined) data.location = location

  const scene = await prisma.scriptScene.update({
    where: { id: sceneId },
    data,
    include: { lines: { orderBy: { index: "asc" } } },
  })

  await prisma.script.update({
    where: { id: scriptId },
    data: { status: "edited" },
  })

  return NextResponse.json(scene)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; sceneId: string }> }
) {
  const { id: scriptId, sceneId } = await params

  await prisma.scriptScene.delete({ where: { id: sceneId } })

  const remaining = await prisma.scriptScene.findMany({
    where: { scriptId },
    orderBy: { index: "asc" },
    include: { lines: { orderBy: { index: "asc" } } },
  })

  for (let i = 0; i < remaining.length; i++) {
    if (remaining[i].index !== i) {
      await prisma.scriptScene.update({
        where: { id: remaining[i].id },
        data: { index: i },
      })
      remaining[i] = { ...remaining[i], index: i }
    }
  }

  return NextResponse.json(remaining)
}
