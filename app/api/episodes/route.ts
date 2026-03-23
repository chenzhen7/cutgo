import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { normalizeChapterIdsFromBody } from "@/lib/episode-source-chapters"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get("projectId")

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 })
  }

  const episodes = await prisma.episode.findMany({
    where: { projectId },
    orderBy: [{ index: "asc" }, { createdAt: "asc" }],
    include: {
      scenes: { orderBy: { index: "asc" } },
    },
  })

  return NextResponse.json(episodes)
}

export async function POST(request: NextRequest) {
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
    return NextResponse.json({ error: "projectId is required" }, { status: 400 })
  }

  const chapterIdsJson = normalizeChapterIdsFromBody(chapterIds)

  let episodeIndex = index
  if (episodeIndex === undefined || episodeIndex === null) {
    const maxIndex = await prisma.episode.aggregate({
      where: { projectId },
      _max: { index: true },
    })
    episodeIndex = (maxIndex._max.index ?? 0) + 1
  }

  const episode = await prisma.episode.create({
    data: {
      projectId,
      chapterIds: chapterIdsJson,
      index: episodeIndex,
      title: title || `第${episodeIndex}集`,
      outline: outline || null,
      goldenHook: goldenHook || null,
      keyConflict: keyConflict || null,
      cliffhanger: cliffhanger || null,
      duration: duration || "60s",
    },
    include: {
      scenes: { orderBy: { index: "asc" } },
    },
  })

  return NextResponse.json(episode, { status: 201 })
}
