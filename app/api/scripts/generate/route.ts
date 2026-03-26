import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { parseSourceChapterIds } from "@/lib/episode-source-chapters"
import { API_ERRORS, throwCutGoError, withError } from "@/lib/api-error"
import { getLLMProvider } from "@/lib/ai/llm"
import { buildEpisodeScriptPrompt } from "@/lib/prompts"

async function callAIGenerateScript(
  episodeTitle: string,
  episodeSynopsis: string,
  keyConflict: string | null,
  cliffhanger: string | null,
  episodeDuration: string,
  scenesJson: string,
  chapterContent: string,
  novelSynopsis: string | null,
  characters: string,
  previousContent: string | null,
  platform: string,
  duration: string,
  scenesInfo: string,
  propsInfo: string
): Promise<string> {
  const llmProvider = await getLLMProvider()

  if (!llmProvider) {
    throwCutGoError("LLM_NOT_CONFIGURED")
  }

  const prompt = buildEpisodeScriptPrompt({
    episodeTitle,
    episodeSynopsis,
    keyConflict,
    cliffhanger,
    episodeDuration,
    scenesJson,
    chapterContent: chapterContent.slice(0, 8000),
    novelSynopsis,
    characters,
    previousContent: previousContent?.slice(-1000) ?? null,
    platform,
    duration,
    scenesInfo,
    propsInfo,
  })

  const result = await llmProvider.chat({
    messages: [{ role: "user", content: prompt }],
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
    // overwrite 模式：清空已有剧本内容
    const overwriteIds = targetEpisodes
      .filter((ep) => ep.script)
      .map((ep) => ep.id)
    if (overwriteIds.length > 0) {
      await prisma.episode.updateMany({
        where: { id: { in: overwriteIds } },
        data: { script: "" },
      })
    }
  }

  const assetCharacters = await prisma.assetCharacter.findMany({ where: { projectId } })
  const assetScenes = await prisma.assetScene.findMany({ where: { projectId } })
  const assetProps = await prisma.assetProp.findMany({ where: { projectId } })

  const charactersStr = assetCharacters
    .map((c) => {
      const parts = [`${c.name}(${c.role})`]
      if (c.description) parts.push(c.description)
      if (c.personality) parts.push(`性格: ${c.personality}`)
      return parts.join(", ")
    })
    .join("; ")

  const scenesStr = assetScenes.length > 0
    ? assetScenes.map((s) => `${s.name}: ${s.description || ""}`).join("; ")
    : ""

  const propsStr = assetProps.length > 0
    ? assetProps.map((p) => `${p.name}: ${p.description || ""}`).join("; ")
    : ""

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
      const scenesJson = JSON.stringify([
        {
          title: episode.title,
          summary: episode.outline ?? "",
          duration: episode.duration,
          characters: null,
          emotion: null,
        },
      ])

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
        episode.duration,
        scenesJson,
        chapterContent,
        null,
        charactersStr,
        previousContent,
        project!.platform,
        project!.duration,
        scenesStr,
        propsStr
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
