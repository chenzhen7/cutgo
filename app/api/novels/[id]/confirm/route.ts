import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { notFound, validationError } from "@/lib/api-error"

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const novel = await prisma.novel.findUnique({ where: { id } })
  if (!novel) {
    return notFound("小说不存在")
  }

  const selectedChapters = await prisma.chapter.findMany({
    where: { novelId: id, selected: true },
    orderBy: { index: "asc" },
  })

  if (selectedChapters.length === 0) {
    return validationError("请至少保留一章并勾选参与制作")
  }

  await prisma.$transaction(async (tx) => {
    await tx.episode.deleteMany({ where: { projectId: novel.projectId } })

    let episodeIndex = 0
    for (const ch of selectedChapters) {
      episodeIndex++
      await tx.episode.create({
        data: {
          projectId: novel.projectId,
          chapterIds: JSON.stringify([ch.id]),
          index: episodeIndex,
          title: ch.title?.trim() || `第${episodeIndex}集`,
          outline: ch.content.slice(0, 1200),
        },
      })
    }

    await tx.project.update({
      where: { id: novel.projectId },
      data: { step: 2, stepLabel: "剧本生成" },
    })
  })

  const updated = await prisma.novel.findUnique({ where: { id } })
  return NextResponse.json(updated)
}
