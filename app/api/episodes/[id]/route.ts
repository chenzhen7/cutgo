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
      ...(body.episodeCharacters !== undefined && {
        episodeCharacters: Array.isArray(body.episodeCharacters)
          ? JSON.stringify(body.episodeCharacters)
          : body.episodeCharacters,
      }),
      ...(body.episodeScenes !== undefined && {
        episodeScenes: Array.isArray(body.episodeScenes)
          ? JSON.stringify(body.episodeScenes)
          : body.episodeScenes,
      }),
      ...(body.episodeProps !== undefined && {
        episodeProps: Array.isArray(body.episodeProps)
          ? JSON.stringify(body.episodeProps)
          : body.episodeProps,
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

  return NextResponse.json(remaining)
})
