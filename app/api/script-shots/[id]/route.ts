import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: episodeId } = await params
  const data = await request.json()

  const episode = await prisma.episode.update({
    where: { id: episodeId },
    data: { ...(data.status !== undefined && { script: data.status === "draft" ? "" : undefined }) },
  })

  return NextResponse.json({ id: episode.id, script: episode.script })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: episodeId } = await params

  await prisma.shot.deleteMany({ where: { episodeId } })

  return NextResponse.json({ success: true })
}
