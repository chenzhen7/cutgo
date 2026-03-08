import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(request: NextRequest) {
  const { shotId, sourceStoryboardId, targetStoryboardId, targetIndex } = await request.json()

  if (!shotId || !sourceStoryboardId || !targetStoryboardId || targetIndex === undefined) {
    return NextResponse.json(
      { error: "shotId, sourceStoryboardId, targetStoryboardId, targetIndex are required" },
      { status: 400 }
    )
  }

  if (sourceStoryboardId === targetStoryboardId) {
    return NextResponse.json({ error: "源和目标分镜板相同，请使用 reorder 接口" }, { status: 400 })
  }

  await prisma.shot.update({
    where: { id: shotId },
    data: { storyboardId: targetStoryboardId, index: -1 },
  })

  const sourceShots = await prisma.shot.findMany({
    where: { storyboardId: sourceStoryboardId },
    orderBy: { index: "asc" },
  })
  for (let i = 0; i < sourceShots.length; i++) {
    if (sourceShots[i].index !== i) {
      await prisma.shot.update({
        where: { id: sourceShots[i].id },
        data: { index: i },
      })
    }
  }

  const targetShots = await prisma.shot.findMany({
    where: { storyboardId: targetStoryboardId, id: { not: shotId } },
    orderBy: { index: "asc" },
  })
  const shotsToShift = targetShots.filter((s) => s.index >= targetIndex)
  for (const shot of shotsToShift) {
    await prisma.shot.update({
      where: { id: shot.id },
      data: { index: shot.index + 1 },
    })
  }

  await prisma.shot.update({
    where: { id: shotId },
    data: { index: targetIndex },
  })

  const finalSource = await prisma.shot.findMany({
    where: { storyboardId: sourceStoryboardId },
    orderBy: { index: "asc" },
  })
  const finalTarget = await prisma.shot.findMany({
    where: { storyboardId: targetStoryboardId },
    orderBy: { index: "asc" },
  })

  return NextResponse.json({
    source: { id: sourceStoryboardId, shots: finalSource },
    target: { id: targetStoryboardId, shots: finalTarget },
  })
}
