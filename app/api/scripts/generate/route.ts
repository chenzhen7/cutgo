import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { parseSourceChapterIds } from "@/lib/episode-source-chapters"
import { API_ERRORS, throwCutGoError, withError } from "@/lib/api-error"
import { getLLMProvider } from "@/lib/ai/llm"
import {
  buildEpisodeScriptSystemPrompt,
  buildEpisodeScriptUserPrompt,
} from "@/lib/prompts"

async function callAIGenerateScript(
  episodeTitle: string,
  episodeSynopsis: string,
  keyConflict: string | null,
  cliffhanger: string | null,
  chapterContent: string,
  previousContent: string | null,
  duration: string
): Promise<string> {
  const llmProvider = await getLLMProvider()

  if (!llmProvider) {
    throwCutGoError("LLM_NOT_CONFIGURED")
  }

  const systemPrompt = buildEpisodeScriptSystemPrompt()
  const userPrompt = buildEpisodeScriptUserPrompt({
    episodeTitle,
    episodeSynopsis,
    keyConflict,
    cliffhanger,
    chapterContent,
    previousContent: previousContent?.slice(-1000) ?? null,
    duration,
  })

  const result = await llmProvider.chat({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  })

  if (!result.content) {
    throwCutGoError("LLM_INVALID_RESPONSE", "LLM 未返回有效剧本内容")
  }

  return result.content?.trim()

}


export const POST = withError(async (request: NextRequest) => {
  const body = await request.json()
  const { projectId, episodeIds, mode = "skip_existing" } = body

  if (!projectId) {
    throwCutGoError("MISSING_PARAMS", "projectId is required")
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) {
    throwCutGoError("NOT_FOUND", "项目不存在")
  }

  const novel = await prisma.novel.findUnique({
    where: { projectId },
    include: {
      chapters: { orderBy: { index: "asc" } },
    },
  })

  if (!novel) {
    throwCutGoError("VALIDATION", "请先导入小说并解析出章节")
  }

  const novelData = novel!

  let targetEpisodes = await prisma.episode.findMany({
    where: { projectId },
    orderBy: { index: "asc" },
  })

  if (episodeIds?.length) {
    targetEpisodes = targetEpisodes.filter((ep) => episodeIds.includes(ep.id))
  }

  if (targetEpisodes.length === 0) {
    throwCutGoError("VALIDATION", "没有可生成的分集")
  }

  let skippedEpisodes = 0

  if (mode === "skip_existing") {
    const before = targetEpisodes.length
    targetEpisodes = targetEpisodes.filter((ep) => !ep.script)
    skippedEpisodes = before - targetEpisodes.length
  } else if (mode === "overwrite") {
    // overwrite 模式：直接覆盖写入，避免生成失败时丢失原有内容
  }

  const chapterMap = new Map<string, string>()
  for (const ch of novelData.chapters) {
    chapterMap.set(ch.id, ch.content)
  }

  // 取上一集的剧本作为上下文
  const sortedAll = await prisma.episode.findMany({
    where: { projectId },
    orderBy: { index: "asc" },
  })
  let previousContent: string | null = null
  const firstTargetIndex = targetEpisodes[0]?.index ?? 0
  const prevEpisode = sortedAll.filter((ep) => ep.index < firstTargetIndex && ep.script).pop()
  if (prevEpisode?.script) {
    previousContent = prevEpisode.script
  }

  try {
    for (const episode of targetEpisodes) {
      const sourceIds = parseSourceChapterIds(episode)
      const chapterContent = sourceIds
        .map((id) => chapterMap.get(id) || "")
        .filter(Boolean)
        .join("\n\n---\n\n")

      const scriptContent = await callAIGenerateScript(
        episode.title,
        episode.outline ?? "",
        episode.keyConflict,
        episode.cliffhanger,
        chapterContent,
        previousContent,
        project.duration
      )

      await prisma.episode.update({
        where: { id: episode.id },
        data: { script: scriptContent },
      })

      previousContent = scriptContent
    }

    const allEpisodes = await prisma.episode.findMany({
      where: { projectId },
      orderBy: { index: "asc" },
    })

    return NextResponse.json({
      episodes: allEpisodes,
      stats: {
        scriptCount: allEpisodes.filter((ep) => ep.script).length,
        generatedEpisodes: targetEpisodes.length,
        skippedEpisodes,
      },
    })
  } catch (err) {
    console.error("Script generation failed:", err)
    const allEpisodes = await prisma.episode.findMany({
      where: { projectId },
      orderBy: { index: "asc" },
    })
    const error = err as { code?: string; status?: number; message?: string }
    const errorCode = typeof error.code === "string" ? error.code : API_ERRORS.INTERNAL.code
    const errorStatus = typeof error.status === "number" ? error.status : API_ERRORS.INTERNAL.status
    const errorMessage =
      typeof error.message === "string" && error.message.trim().length > 0
        ? error.message
        : API_ERRORS.INTERNAL.defaultMessage
    return NextResponse.json(
      { error: errorCode, message: errorMessage, episodes: allEpisodes },
      { status: errorStatus }
    )
  }
})
