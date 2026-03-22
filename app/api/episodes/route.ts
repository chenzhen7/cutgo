import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get("projectId")
  const chapterId = searchParams.get("chapterId")

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 })
  }

  const where: Record<string, string> = { projectId }
  if (chapterId) where.chapterId = chapterId

  const episodes = await prisma.episode.findMany({
    where,
    orderBy: [{ index: "asc" }, { createdAt: "asc" }],
    include: {
      chapter: { select: { id: true, index: true, title: true } },
      scenes: { orderBy: { index: "asc" } },
    },
  })

  return NextResponse.json(episodes)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const {
    projectId,
    chapterId,
    sourceChapterIds,
    index,
    title,
    synopsis,
    outline,
    keyConflict,
    cliffhanger,
    duration,
  } = body

  if (!projectId || !chapterId) {
    return NextResponse.json({ error: "projectId and chapterId are required" }, { status: 400 })
  }

  let sourceIdsJson: string | undefined
  if (Array.isArray(sourceChapterIds) && sourceChapterIds.length > 0) {
    const ids = sourceChapterIds.filter((x: unknown): x is string => typeof x === "string" && x.length > 0)
    if (ids.length > 0) {
      if (!ids.includes(chapterId)) {
        return NextResponse.json(
          { error: "sourceChapterIds 须包含 chapterId（锚点章节）" },
          { status: 400 }
        )
      }
      sourceIdsJson = JSON.stringify(ids)
    }
  }

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
      chapterId,
      ...(sourceIdsJson !== undefined ? { sourceChapterIds: sourceIdsJson } : {}),
      index: episodeIndex,
      title: title || `第${episodeIndex}集`,
      synopsis: synopsis || "",
      outline: outline || null,
      keyConflict: keyConflict || null,
      cliffhanger: cliffhanger || null,
      duration: duration || "60s",
    },
    include: {
      chapter: { select: { id: true, index: true, title: true } },
      scenes: { orderBy: { index: "asc" } },
    },
  })

  return NextResponse.json(episode, { status: 201 })
}
