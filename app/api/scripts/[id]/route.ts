import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { throwCutGoError, withError } from "@/lib/api-error"
import { extractEpisodeAssetIds } from "@/lib/utils"

export const GET = withError(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const episode = await prisma.episode.findUnique({
    where: { id },
    include: { episodeAssets: true },
  })
  if (!episode) {
    throwCutGoError("NOT_FOUND", "分集不存在")
  }
  return NextResponse.json({
    ...episode,
    ...extractEpisodeAssetIds(episode.episodeAssets),
    episodeAssets: undefined,
  })
})

export const PATCH = withError(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const body = await request.json()
  const { content } = body

  const data: Record<string, unknown> = {}
  if (content !== undefined) data.script = content

  const episode = await prisma.episode.update({
    where: { id },
    data,
    include: { episodeAssets: true },
  })

  return NextResponse.json({
    ...episode,
    ...extractEpisodeAssetIds(episode.episodeAssets),
    episodeAssets: undefined,
  })
})

export const DELETE = withError(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const episode = await prisma.episode.update({
    where: { id },
    data: { script: "" },
    include: { episodeAssets: true },
  })
  return NextResponse.json({
    ...episode,
    ...extractEpisodeAssetIds(episode.episodeAssets),
    episodeAssets: undefined,
  })
})
