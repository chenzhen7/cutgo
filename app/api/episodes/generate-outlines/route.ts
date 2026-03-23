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
  if (!chapterIds || chapterIds.length === 0) {
    return NextResponse.json({ error: "chapterIds is required" }, { status: 400 })
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

  const idSet = new Set(chapterIds)
  const selectedChapters = novel.chapters
    .filter((c) => idSet.has(c.id))
    .sort((a, b) => a.index - b.index)

  if (selectedChapters.length === 0) {
    return NextResponse.json({ error: "未找到所选章节" }, { status: 400 })
  }

  // 拼接小说原文
  const novelText = selectedChapters
    .map((c) => {
      const label = `${formatChapterOrdinalLabel(c.index)}${c.title?.trim() ? ` ${c.title.trim()}` : ""}`
      return `### ${label}\n\n${c.content}`
    })
    .join("\n\n---\n\n")

  // 构建章节序号 → chapterId 映射
  const indexToChapterId = new Map(selectedChapters.map((c) => [c.index, c.id]))

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
    // 找到该分集关联的章节（用 chapter.index 匹配）
    const chapterIndexList: number[] = Array.isArray(item.chapters) ? item.chapters : []

    // 找到第一个有效的 chapterId 作为锚点
    let anchorChapterId: string | null = null
    const sourceIds: string[] = []

    for (const idx of chapterIndexList) {
      const cid = indexToChapterId.get(idx)
      if (cid) {
        sourceIds.push(cid)
        if (!anchorChapterId) anchorChapterId = cid
      }
    }

    // 如果没有匹配到，使用第一个选中章节作为锚点
    if (!anchorChapterId) {
      anchorChapterId = selectedChapters[0].id
    }

    const episodeIndex = nextIndex++
    const generatedTitle = item.title?.trim()
    const title = generatedTitle || `第${episodeIndex}集`

    const sourceIdsJson =
      sourceIds.length > 1
        ? JSON.stringify(sourceIds)
        : null

    const episode = await prisma.episode.create({
      data: {
        projectId,
        chapterId: anchorChapterId,
        ...(sourceIdsJson ? { sourceChapterIds: sourceIdsJson } : {}),
        index: episodeIndex,
        title,
        synopsis: item.summary || "",
        outline: item.summary || null,
        goldenHook: item.goldenHook || null,
        keyConflict: item.core_conflict || null,
        cliffhanger: item.cliffhanger || null,
        duration: "3min",
      },
      include: {
        chapter: { select: { id: true, index: true, title: true } },
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
