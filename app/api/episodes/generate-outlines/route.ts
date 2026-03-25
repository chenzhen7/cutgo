import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { callLLM } from "@/lib/ai/llm"
import { buildEpisodeOutlinePrompt } from "@/lib/prompts"
import { formatChapterOrdinalLabel } from "@/lib/novel-utils"
import { API_ERRORS, throwCutGoError, withError } from "@/lib/api-error"

interface OutlineItem {
  episode: number
  /** 分集标题（吸引力/悬念）；缺省时由服务端回退为「第N集」 */
  title?: string
  summary: string
  core_conflict?: string
  goldenHook?: string
  cliffhanger?: string
  chapters: number[]
}

function parseOutlineJSON(raw: string): OutlineItem[] {
  let text = raw.trim()
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim()
  const start = text.indexOf("[")
  const end = text.lastIndexOf("]")
  if (start === -1 || end === -1) {
    throw new Error("LLM 返回内容中未找到 JSON 数组")
  }
  const jsonStr = text.slice(start, end + 1)
  const parsed = JSON.parse(jsonStr)
  if (!Array.isArray(parsed)) {
    throw new Error("LLM 返回的不是 JSON 数组")
  }
  return parsed as OutlineItem[]
}

export const POST = withError(async (request: NextRequest) => {
  const body = await request.json()
  const { projectId, chapterIds } = body as { projectId: string; chapterIds?: string[] }

  if (!projectId) {
    throwCutGoError("MISSING_PARAMS", "projectId is required")
  }

  const novel = await prisma.novel.findUnique({
    where: { projectId },
    include: {
      chapters: { orderBy: { index: "asc" } },
    },
  })

  if (!novel) {
    throwCutGoError("VALIDATION", "请先导入小说并解析章节")
  }

  const allSorted = [...novel.chapters].sort((a, b) => a.index - b.index)
  let selectedChapters: typeof novel.chapters

  if (chapterIds && chapterIds.length > 0) {
    const idSet = new Set(chapterIds)
    selectedChapters = allSorted.filter((c) => idSet.has(c.id))
    if (selectedChapters.length === 0) {
      throwCutGoError("VALIDATION", "未找到所选章节")
    }
  } else {
    const hasAnySelected = allSorted.some((c) => c.selected)
    selectedChapters = hasAnySelected ? allSorted.filter((c) => c.selected) : allSorted
    if (selectedChapters.length === 0) {
      throwCutGoError("VALIDATION", "暂无可用章节")
    }
  }

  const novelText = selectedChapters
    .map((c) => {
      const label = `${formatChapterOrdinalLabel(c.index)}${c.title?.trim() ? ` ${c.title.trim()}` : ""}`
      return `### ${label}\n\n${c.content}`
    })
    .join("\n\n---\n\n")

  // LLM 看到的是「第N章」，N = c.index + 1，因此用 c.index + 1 作为 key
  const indexToChapterId = new Map(selectedChapters.map((c) => [c.index + 1, c.id]))

  const prompt = buildEpisodeOutlinePrompt(novelText)
  let outlines: OutlineItem[]
  try {
    const result = await callLLM({
      messages: [{ role: "user", content: prompt }],
    })
    outlines = parseOutlineJSON(result.content)
  } catch (err) {
    if ((err as Error).message === API_ERRORS.LLM_NOT_CONFIGURED.code) {
      throwCutGoError("LLM_NOT_CONFIGURED")
    }
    throwCutGoError("LLM_INVALID_RESPONSE", (err as Error).message)
  }

  if (outlines.length === 0) {
    throwCutGoError("LLM_INVALID_RESPONSE", "LLM 未返回有效的分集大纲")
  }

  const maxIndexResult = await prisma.episode.aggregate({
    where: { projectId },
    _max: { index: true },
  })
  let nextIndex = (maxIndexResult._max.index ?? 0) + 1

  const createdEpisodes = []

  for (const item of outlines) {
    const chapterIndexList: number[] = Array.isArray(item.chapters) ? item.chapters : []
    const allChapterIds: string[] = []
    for (const idx of chapterIndexList) {
      const cid = indexToChapterId.get(idx)
      if (cid) allChapterIds.push(cid)
    }

    const episodeIndex = nextIndex++
    const title = item.title?.trim() || `第${episodeIndex}集`

    const episode = await prisma.episode.create({
      data: {
        projectId,
        chapterIds: allChapterIds.length > 0 ? JSON.stringify(allChapterIds) : null,
        index: episodeIndex,
        title,
        outline: item.summary || null,
        goldenHook: item.goldenHook || null,
        keyConflict: item.core_conflict || null,
        cliffhanger: item.cliffhanger || null,
        duration: "3min",
      },
    })

    createdEpisodes.push(episode)
  }

  return NextResponse.json({
    episodes: createdEpisodes,
    stats: { generatedCount: createdEpisodes.length },
  })
})
