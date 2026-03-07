import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  const episode = await prisma.episode.update({
    where: { id },
    data: {
      ...(body.index !== undefined && { index: body.index }),
      ...(body.title !== undefined && { title: body.title }),
      ...(body.synopsis !== undefined && { synopsis: body.synopsis }),
      ...(body.keyConflict !== undefined && { keyConflict: body.keyConflict }),
      ...(body.cliffhanger !== undefined && { cliffhanger: body.cliffhanger }),
      ...(body.duration !== undefined && { duration: body.duration }),
      ...(body.chapterId !== undefined && { chapterId: body.chapterId }),
    },
    include: {
      chapter: { select: { id: true, index: true, title: true } },
      scenes: { orderBy: { index: "asc" } },
    },
  })

  return NextResponse.json(episode)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const episode = await prisma.episode.findUnique({ where: { id } })
  if (!episode) {
    return NextResponse.json({ error: "分集不存在" }, { status: 404 })
  }

  await prisma.episode.delete({ where: { id } })

  const remaining = await prisma.episode.findMany({
    where: { projectId: episode.projectId },
    orderBy: [{ index: "asc" }, { createdAt: "asc" }],
    include: {
      chapter: { select: { id: true, index: true, title: true } },
      scenes: { orderBy: { index: "asc" } },
    },
  })

  return NextResponse.json(remaining)
}
