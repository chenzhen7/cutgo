import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { API_ERRORS, throwCutGoError, withError } from "@/lib/api-error"
import { callLLM } from "@/lib/ai/llm"
import {
  createRunningAiTask,
  markAiTaskFailed,
  markAiTaskSucceeded,
  toErrorInfo,
} from "@/lib/ai-task-service"
import {
  buildEpisodeScriptSystemPrompt,
  buildEpisodeScriptUserPrompt,
} from "@/lib/prompts"
import { extractEpisodeAssetIds } from "@/lib/utils"

async function getSerializedEpisodes(projectId: string) {
  const episodes = await prisma.episode.findMany({
    where: { projectId },
    orderBy: { index: "asc" },
    include: { episodeAssets: true },
  })

  return episodes.map((episode) => ({
    ...episode,
    ...extractEpisodeAssetIds(episode.episodeAssets),
    episodeAssets: undefined,
  }))
}

async function callAIGenerateScript(
  episodeTitle: string,
  chapterContent: string,
  previousContent: string | null,
  duration: string
): Promise<string> {
  const systemPrompt = buildEpisodeScriptSystemPrompt()
  const userPrompt = buildEpisodeScriptUserPrompt({
    episodeTitle,
    chapterContent,
    previousContent: previousContent?.slice(-500) ?? null,
    duration,
  })

  const result = await callLLM({
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

  const hasNoContent = targetEpisodes.some((ep) => {
    const hasRawText = !!ep.rawText?.trim()
    return !hasRawText
  })
  if (hasNoContent) {
    throwCutGoError("VALIDATION", "部分分集缺少原文内容，请先填写原文")
  }

  let skippedEpisodes = 0

  if (mode === "skip_existing") {
    const before = targetEpisodes.length
    targetEpisodes = targetEpisodes.filter((ep) => !ep.script)
    skippedEpisodes = before - targetEpisodes.length
  } else if (mode === "overwrite") {
    // overwrite 模式：直接覆盖写入
  }

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
      const task = await createRunningAiTask({
        projectId,
        episodeId: episode.id,
        targetInfo: `第${episode.index + 1}集 ${episode.title}`,
        taskType: "llm_script",
      })

      const chapterContent = episode.rawText?.trim() ?? ""

      try {
        const scriptContent = await callAIGenerateScript(
          episode.title,
          chapterContent,
          previousContent,
          episode.duration
        )

        await prisma.episode.update({
          where: { id: episode.id },
          data: { script: scriptContent },
        })

        await markAiTaskSucceeded(task.id)
        previousContent = scriptContent
      } catch (err) {
        await markAiTaskFailed(task.id, err)
        throw err
      }
    }

    const episodes = await getSerializedEpisodes(projectId)

    return NextResponse.json({
      episodes,
      stats: {
        scriptCount: episodes.filter((episode) => episode.script).length,
        generatedEpisodes: targetEpisodes.length,
        skippedEpisodes,
      },
    })
  } catch (err) {
    console.error("Script generation failed:", err)
    const episodes = await getSerializedEpisodes(projectId)
    const errorInfo = toErrorInfo(err)
    const errorStatus = (err as { status?: number }).status || API_ERRORS.INTERNAL.status
    return NextResponse.json(
      {
        error: errorInfo.code,
        message: errorInfo.message,
        episodes,
      },
      { status: errorStatus }
    )
  }
})
