import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { normalizeChapterIdsFromBody } from "@/lib/episode-source-chapters"
import { throwCutGoError, withError } from "@/lib/api-error"

export const PATCH = withError(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const body = await request.json()

  const episode = await prisma.episode.update({
    where: { id },
    data: {
      ...(body.index !== undefined && { index: body.index }),
      ...(body.title !== undefined && { title: body.title }),
      ...(body.outline !== undefined && { outline: body.outline }),
      ...(body.goldenHook !== undefined && { goldenHook: body.goldenHook }),
      ...(body.keyConflict !== undefined && { keyConflict: body.keyConflict }),
      ...(body.cliffhanger !== undefined && { cliffhanger: body.cliffhanger }),
      ...(body.duration !== undefined && { duration: body.duration }),
      ...(body.chapterIds !== undefined && {
        chapterIds: normalizeChapterIdsFromBody(body.chapterIds),
      }),
      ...(body.characters !== undefined && {
        characters: Array.isArray(body.characters)
          ? JSON.stringify(body.characters)
          : body.characters,
      }),
      ...(body.scenes !== undefined && {
        scenes: Array.isArray(body.scenes)
          ? JSON.stringify(body.scenes)
          : body.scenes,
      }),
      ...(body.props !== undefined && {
        props: Array.isArray(body.props)
          ? JSON.stringify(body.props)
          : body.props,
      }),
    },
  })

  return NextResponse.json(episode)
})

export const DELETE = withError(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params

  const episode = await prisma.episode.findUnique({ where: { id } })
  if (!episode) {
    throwCutGoError("NOT_FOUND", "分集不存在")
  }

  await prisma.episode.delete({ where: { id } })

  const remaining = await prisma.episode.findMany({
    where: { projectId: episode.projectId },
    orderBy: [{ index: "asc" }, { createdAt: "asc" }],
  })

  // 维护 index 连续性
  for (let i = 0; i < remaining.length; i++) {
    if (remaining[i].index !== i) {
      await prisma.episode.update({
        where: { id: remaining[i].id },
        data: { index: i },
      })
      remaining[i].index = i
    }
  }

  return NextResponse.json(remaining)
})
