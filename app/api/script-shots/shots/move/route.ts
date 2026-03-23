import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(request: NextRequest) {
  const { shotId, sourceScriptId, targetScriptId, targetIndex } = await request.json()

  if (!shotId || !sourceScriptId || !targetScriptId || targetIndex === undefined) {
    return NextResponse.json(
      { error: "shotId, sourceScriptId, targetScriptId, targetIndex are required" },
      { status: 400 }
    )
  }

  if (sourceScriptId === targetScriptId) {
    return NextResponse.json({ error: "源和目标剧本相同，请使用 reorder 接口" }, { status: 400 })
  }

  await prisma.shot.update({
    where: { id: shotId },
    data: { scriptId: targetScriptId, index: -1 },
  })

  const sourceShots = await prisma.shot.findMany({
    where: { scriptId: sourceScriptId },
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
    where: { scriptId: targetScriptId, id: { not: shotId } },
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
    where: { scriptId: sourceScriptId },
    orderBy: { index: "asc" },
  })
  const finalTarget = await prisma.shot.findMany({
    where: { scriptId: targetScriptId },
    orderBy: { index: "asc" },
  })

  return NextResponse.json({
    source: { id: sourceScriptId, shots: finalSource },
    target: { id: targetScriptId, shots: finalTarget },
  })
}
