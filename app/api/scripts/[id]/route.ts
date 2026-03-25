import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { throwCutGoError, withError } from "@/lib/api-error"

const scriptInclude = {
  episode: {
    select: {
      id: true,
      index: true,
      title: true,
      chapterIds: true,
    },
  },
}

export const GET = withError(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const script = await prisma.script.findUnique({
    where: { id },
    include: scriptInclude,
  })
  if (!script) {
    throwCutGoError("NOT_FOUND", "剧本不存在")
  }
  return NextResponse.json(script)
})

export const PATCH = withError(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const body = await request.json()
  const { title, content, status } = body

  const data: Record<string, unknown> = {}
  if (title !== undefined) data.title = title
  if (content !== undefined) data.content = content
  if (status !== undefined) data.status = status
  const script = await prisma.script.update({
    where: { id },
    data,
    include: scriptInclude,
  })

  return NextResponse.json(script)
})

export const DELETE = withError(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  await prisma.script.delete({ where: { id } })
  return NextResponse.json({ success: true })
})
