import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { throwCutGoError, withError } from "@/lib/api-error"

export const GET = withError(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const episode = await prisma.episode.findUnique({ where: { id } })
  if (!episode) {
    throwCutGoError("NOT_FOUND", "分集不存在")
  }
  return NextResponse.json(episode)
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
  })

  return NextResponse.json(episode)
})

export const DELETE = withError(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  await prisma.episode.update({
    where: { id },
    data: { script: "" },
  })
  return NextResponse.json({ success: true })
})
