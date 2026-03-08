import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

const scriptInclude = {
  episode: {
    select: {
      id: true,
      index: true,
      title: true,
      chapterId: true,
      chapter: { select: { id: true, index: true, title: true } },
    },
  },
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const script = await prisma.script.findUnique({
    where: { id },
    include: scriptInclude,
  })
  if (!script) {
    return NextResponse.json({ error: "剧本不存在" }, { status: 404 })
  }
  return NextResponse.json(script)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const { title, content, status, characters, props, location } = body

  const data: Record<string, unknown> = {}
  if (title !== undefined) data.title = title
  if (content !== undefined) data.content = content
  if (status !== undefined) data.status = status
  if (characters !== undefined) data.characters = characters
  if (props !== undefined) data.props = props
  if (location !== undefined) data.location = location

  const script = await prisma.script.update({
    where: { id },
    data,
    include: scriptInclude,
  })

  return NextResponse.json(script)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.script.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
