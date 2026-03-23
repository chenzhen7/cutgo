import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getLLMProvider } from "@/lib/ai/llm"
import { buildEpisodeOutlinePrompt } from "@/lib/prompts"
import { formatChapterOrdinalLabel } from "@/lib/novel-utils"

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
  // 去掉可能的 markdown 代码块包裹
  let text = raw.trim()
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim()
  // 找到第一个 [ 和最后一个 ]
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

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { projectId, chapterIds } = body as { projectId: string; chapterIds?: string[] }

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 })
  }

  // 读取小说及章节
  const novel = await prisma.novel.findUnique({
    where: { projectId },
    include: {
      chapters: { orderBy: { index: "asc" } },
    },
  })

  if (!novel) {
    return NextResponse.json({ error: "请先导入小说并解析章节" }, { status: 400 })
  }

  const allSorted = [...novel.chapters].sort((a, b) => a.index - b.index)
  let selectedChapters: typeof novel.chapters

  if (chapterIds && chapterIds.length > 0) {
    const idSet = new Set(chapterIds)
    selectedChapters = allSorted.filter((c) => idSet.has(c.id))
    if (selectedChapters.length === 0) {
      return NextResponse.json({ error: "未找到所选章节" }, { status: 400 })
    }
  } else {
    const hasAnySelected = allSorted.some((c) => c.selected)
    selectedChapters = hasAnySelected ? allSorted.filter((c) => c.selected) : allSorted
    if (selectedChapters.length === 0) {
      return NextResponse.json({ error: "暂无可用章节" }, { status: 400 })
    }
  }

  // 拼接小说原文
  const novelText = selectedChapters
    .map((c) => {
      const label = `${formatChapterOrdinalLabel(c.index)}${c.title?.trim() ? ` ${c.title.trim()}` : ""}`
      return `### ${label}\n\n${c.content}`
    })
    .join("\n\n---\n\n")

  // 构建显示章节号（1-based）→ chapterId 映射
  // LLM 看到的是「第N章」，N = c.index + 1，因此用 c.index + 1 作为 key
  const indexToChapterId = new Map(selectedChapters.map((c) => [c.index + 1, c.id]))

  // 调用 LLM
  const llmProvider = await getLLMProvider()

  if (!llmProvider) {
    return NextResponse.json(
      { error: "LLM_NOT_CONFIGURED", message: "尚未配置语言模型，请先前往设置页面配置 LLM API" },
      { status: 422 }
    )
  }

  const prompt = buildEpisodeOutlinePrompt(novelText)
  const result = await llmProvider.chat({
    messages: [{ role: "user", content: prompt }]
  })
  const outlines = parseOutlineJSON(result.content)

  if (outlines.length === 0) {
    return NextResponse.json({ error: "LLM 未返回有效的分集大纲" }, { status: 500 })
  }

  // 获取当前项目最大分集 index
  const maxIndexResult = await prisma.episode.aggregate({
    where: { projectId },
    _max: { index: true },
  })
  let nextIndex = (maxIndexResult._max.index ?? 0) + 1

  // 创建分集记录
  const createdEpisodes = []

  for (const item of outlines) {
    // 收集该分集关联的所有章节 ID（按 LLM 返回的显示章节号顺序）
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
      include: {
        scenes: { orderBy: { index: "asc" } },
      },
    })

    createdEpisodes.push(episode)
  }

  return NextResponse.json({
    episodes: createdEpisodes,
    stats: { generatedCount: createdEpisodes.length },
  })
}
