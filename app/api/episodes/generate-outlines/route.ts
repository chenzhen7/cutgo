import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { callLLM } from "@/lib/ai/llm"
import { buildEpisodeOutlinePrompt } from "@/lib/prompts"
import { formatChapterOrdinalLabel } from "@/lib/novel-utils"
import { API_ERRORS, throwCutGoError, withError } from "@/lib/api-error"
import type { AssetsSummary } from "@/lib/prompts/episode-outline"

interface OutlineItem {
  episode: number
  /** 分集标题（吸引力/悬念）；缺省时由服务端回退为「第N集」 */
  title?: string
  summary: string
  core_conflict?: string
  goldenHook?: string
  cliffhanger?: string
  chapters: number[]
  /** AI 返回的角色名称列表（从 prompt 中的资产名称中选取） */
  characters?: string[]
  /** AI 返回的场景名称列表（从 prompt 中的资产名称中选取） */
  scenes?: string[]
  /** AI 返回的道具名称列表（从 prompt 中的资产名称中选取） */
  props?: string[]
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

/**
 * 将 AI 返回的名称列表映射为 ID 列表（过滤掉 AI 编造的不存在名称），
 * 序列化为 JSON 字符串存入数据库；无有效 ID 时返回 null。
 */
function resolveNamesToIds(
  names: string[] | undefined,
  nameToId: Map<string, string>
): string | null {
  if (!names || names.length === 0) return null
  const ids = names.flatMap((n) => {
    const id = nameToId.get(n)
    return id ? [id] : []
  })
  return ids.length > 0 ? JSON.stringify(ids) : null
}

export const POST = withError(async (request: NextRequest) => {
  const body = await request.json()
  const { projectId, chapterIds } = body as { projectId: string; chapterIds?: string[] }

  if (!projectId) {
    throwCutGoError("MISSING_PARAMS", "projectId is required")
  }

  const [novel, characters, scenes, props] = await Promise.all([
    prisma.novel.findUnique({
      where: { projectId },
      include: {
        chapters: { orderBy: { index: "asc" } },
      },
    }),
    prisma.assetCharacter.findMany({
      where: { projectId },
      select: { id: true, name: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.assetScene.findMany({
      where: { projectId },
      select: { id: true, name: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.assetProp.findMany({
      where: { projectId },
      select: { id: true, name: true },
      orderBy: { createdAt: "asc" },
    }),
  ])

  if (!novel) {
    throwCutGoError("VALIDATION", "请先导入小说并解析章节")
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const novelData = novel!
  const allSorted = [...novelData.chapters].sort((a, b) => a.index - b.index)
  let selectedChapters: typeof allSorted

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

  // 构建资产摘要：prompt 中给 AI 看名称，服务端用 nameToId 映射回 ID
  const assetsSummary: AssetsSummary = { characters, scenes, props }
  const characterNameToId = new Map(characters.map((c) => [c.name, c.id]))
  const sceneNameToId = new Map(scenes.map((s) => [s.name, s.id]))
  const propNameToId = new Map(props.map((p) => [p.name, p.id]))

  const prompt = buildEpisodeOutlinePrompt(novelText, { assets: assetsSummary })
  let outlines: OutlineItem[] = []
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
        characters: resolveNamesToIds(item.characters, characterNameToId),
        scenes: resolveNamesToIds(item.scenes, sceneNameToId),
        props: resolveNamesToIds(item.props, propNameToId),
      },
    })

    createdEpisodes.push(episode)
  }

  return NextResponse.json({
    episodes: createdEpisodes,
    stats: { generatedCount: createdEpisodes.length },
  })
})
