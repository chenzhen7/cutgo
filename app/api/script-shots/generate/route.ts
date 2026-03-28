import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { API_ERRORS, throwCutGoError, withError } from "@/lib/api-error"
import { getLLMProvider } from "@/lib/ai/llm"
import { buildScriptShotsPrompt } from "@/lib/prompts"

interface AIShotResult {
  prompt: string
  negativePrompt: string
  dialogueText?: string
  actionNote?: string
}

interface AIScriptShotResult {
  shots: AIShotResult[]
}

const episodeWithShotsInclude = {
  shots: { orderBy: { index: "asc" as const } },
}

function parseJsonArray(val: string | null | undefined): string[] {
  if (!val) return []
  try {
    const parsed = JSON.parse(val)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function toScriptShotPlan(episode: {
  id: string
  projectId: string
  index: number
  title: string
  script: string
  createdAt: Date
  updatedAt: Date
  shots: unknown[]
}) {
  return {
    id: episode.id,
    projectId: episode.projectId,
    episodeId: episode.id,
    episode: {
      id: episode.id,
      index: episode.index,
      title: episode.title,
      script: episode.script,
    },
    status: episode.script ? "generated" : "draft",
    shots: episode.shots,
    createdAt: episode.createdAt,
    updatedAt: episode.updatedAt,
  }
}

async function callAIGenerateScriptShots(
  episodeTitle: string,
  scriptContent: string,
  episodeCharacters: string,
  episodeProps: string,
  episodeScenes: string,
  previousShotStr: string | null
): Promise<AIScriptShotResult> {
  const llmProvider = await getLLMProvider()
  if (!llmProvider) {
    throwCutGoError("LLM_NOT_CONFIGURED")
  }

  const prompt = buildScriptShotsPrompt({
    episodeTitle,
    episodeScenes,
    episodeCharacters,
    episodeProps,
    scriptContent: scriptContent.slice(0, 6000),
    previousShot: previousShotStr,
  })

  const result = await llmProvider.chat({
    messages: [{ role: "user", content: prompt }],
  })
  let text = result.content?.trim() || ""
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim()

  try {
    const parsed = JSON.parse(text) as { shots?: AIShotResult[] }
    return { shots: parsed.shots || [] }
  } catch {
    throwCutGoError("LLM_INVALID_RESPONSE", "LLM 返回的分镜结果不是有效 JSON")
  }
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
    where: { projectId, script: { not: "" } },
    include: { shots: true },
    orderBy: { index: "asc" },
  })

  if (episodeIds?.length) {
    targetEpisodes = targetEpisodes.filter((ep) => episodeIds.includes(ep.id))
  }

  if (targetEpisodes.length === 0) {
    throwCutGoError("VALIDATION", "没有可生成分镜的剧本（请先生成剧本）")
  }

  const existingShotEpisodeIds = new Set(
    (await prisma.shot.findMany({
      where: { episode: { projectId } },
      select: { episodeId: true },
      distinct: ["episodeId"],
    })).map((item) => item.episodeId)
  )

  let skippedEpisodes = 0

  if (mode === "skip_existing") {
    const before = targetEpisodes.length
    targetEpisodes = targetEpisodes.filter((ep) => !existingShotEpisodeIds.has(ep.id))
    skippedEpisodes = before - targetEpisodes.length
  } else if (mode === "overwrite") {
    // overwrite 模式：在每集生成完成后再删除旧分镜并写入新数据，避免生成失败时丢失原有内容
  }

  const assetCharacters = await prisma.assetCharacter.findMany({ where: { projectId } })
  const assetScenes = await prisma.assetScene.findMany({ where: { projectId } })
  const assetProps = await prisma.assetProp.findMany({ where: { projectId } })

  let previousShotStr: string | null = null

  try {
    for (const episode of targetEpisodes) {
      const episodeCharacterIds = parseJsonArray(episode.characters)
      const episodeSceneIds = parseJsonArray(episode.scenes)
      const episodePropIds = parseJsonArray(episode.props)

      const matchedCharacters = assetCharacters.filter((c) => episodeCharacterIds.includes(c.id))
      const matchedCharacterIds = matchedCharacters.map((c) => c.id)
      const matchedScene = episodeSceneIds.length > 0
        ? assetScenes.find((s) => s.id === episodeSceneIds[0]) ?? null
        : null
      const matchedProps = assetProps.filter((p) => episodePropIds.includes(p.id))
      const matchedPropIds = matchedProps.map((p) => p.id)

      const aiResult = await callAIGenerateScriptShots(
        episode.title,
        episode.script,
        matchedCharacters.map((c) => c.name).join(", "),
        matchedProps.map((p) => p.name).join(", "),
        matchedScene?.name || "",
        previousShotStr
      )

      // 生成成功后再删除旧分镜，避免生成失败时丢失原有内容
      if (mode === "overwrite" && existingShotEpisodeIds.has(episode.id)) {
        await prisma.shot.deleteMany({ where: { episodeId: episode.id } })
      }

      await prisma.shot.createMany({
        data: (aiResult.shots || []).map((shot, si) => ({
          episodeId: episode.id,
          index: si,
          prompt: shot.prompt || "",
          negativePrompt: shot.negativePrompt || null,
          duration: "3s",
          dialogueText: shot.dialogueText || null,
          actionNote: shot.actionNote || null,
          characterIds: matchedCharacterIds.length > 0 ? JSON.stringify(matchedCharacterIds) : null,
          sceneId: matchedScene?.id || null,
          propIds: matchedPropIds.length > 0 ? JSON.stringify(matchedPropIds) : null,
        })),
      })

      if (aiResult.shots?.length) {
        const lastShot = aiResult.shots[aiResult.shots.length - 1]
        previousShotStr = `分镜提示词: ${lastShot.prompt}`
      }
    }

    const episodesWithShots = await prisma.episode.findMany({
      where: { projectId },
      orderBy: { index: "asc" },
      include: episodeWithShotsInclude,
    })
    const allScriptShotPlans = episodesWithShots.map(toScriptShotPlan)

    const totalShots = allScriptShotPlans.reduce((sum, sb) => sum + sb.shots.length, 0)
    const generatedPlans = allScriptShotPlans.filter((sb) => sb.shots.length > 0)

    return NextResponse.json({
      scriptShotPlans: allScriptShotPlans,
      stats: {
        episodeCount: generatedPlans.length,
        totalShots,
        avgShotsPerEpisode: generatedPlans.length > 0 ? Math.round(totalShots / generatedPlans.length * 10) / 10 : 0,
        generatedEpisodes: targetEpisodes.length,
        skippedEpisodes,
      },
    })
  } catch (err) {
    console.error("Script-shot generation failed:", err)
    const episodesWithShots = await prisma.episode.findMany({
      where: { projectId },
      orderBy: { index: "asc" },
      include: episodeWithShotsInclude,
    })
    const allScriptShotPlans = episodesWithShots.map(toScriptShotPlan)
    const error = err as { code?: string; status?: number; message?: string }
    const errorCode = typeof error.code === "string" ? error.code : API_ERRORS.INTERNAL.code
    const errorStatus = typeof error.status === "number" ? error.status : API_ERRORS.INTERNAL.status
    const errorMessage =
      typeof error.message === "string" && error.message.trim().length > 0
        ? error.message
        : API_ERRORS.INTERNAL.defaultMessage
    return NextResponse.json(
      {
        error: errorCode,
        message: errorMessage,
        scriptShotPlans: allScriptShotPlans,
      },
      { status: errorStatus }
    )
  }
})
