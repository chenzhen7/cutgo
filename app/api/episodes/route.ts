import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { normalizeChapterIdsFromBody } from "@/lib/episode-source-chapters"
import { throwCutGoError, withError } from "@/lib/api-error"

export const GET = withError(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get("projectId")

  if (!projectId) {
    throwCutGoError("MISSING_PARAMS", "projectId is required")
  }

  const episodes = await prisma.episode.findMany({
    where: { projectId },
    orderBy: [{ index: "asc" }, { createdAt: "asc" }],
  })

  return NextResponse.json(episodes)
})

export const POST = withError(async (request: NextRequest) => {
  const body = await request.json()
  const {
    projectId,
    chapterIds,
    index,
    title,
    outline,
    goldenHook,
    keyConflict,
    cliffhanger,
    duration,
  } = body

  if (!projectId) {
    throwCutGoError("MISSING_PARAMS", "projectId is required")
  }

  const chapterIdsJson = normalizeChapterIdsFromBody(chapterIds)

  let episodeIndex = index
  if (episodeIndex === undefined || episodeIndex === null) {
    const maxIndex = await prisma.episode.aggregate({
      where: { projectId },
      _max: { index: true },
    })
    episodeIndex = (maxIndex._max.index ?? -1) + 1
  }

  const episode = await prisma.episode.create({
    data: {
      projectId,
      chapterIds: chapterIdsJson,
      index: episodeIndex,
      title: title || `第${episodeIndex + 1}集`,
      outline: outline || null,
      goldenHook: goldenHook || null,
      keyConflict: keyConflict || null,
      cliffhanger: cliffhanger || null,
      duration: duration || "60s",
    },
  })

  return NextResponse.json(episode, { status: 201 })
})
