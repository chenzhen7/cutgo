import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { API_ERRORS, throwCutGoError, withError } from "@/lib/api-error"
import { getLLMProvider } from "@/lib/ai/llm"
import { buildScriptShotsPrompt } from "@/lib/prompts"

interface AIScriptShotResult {
  prompts: string[]
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
    const parsed = JSON.parse(text) as unknown
    if (!Array.isArray(parsed)) {
      throw new Error("invalid script shots structure")
    }
    return {
      prompts: parsed.filter((item): item is string => typeof item === "string").map((item) => item.trim()),
    }
  } catch {
    throwCutGoError("LLM_INVALID_RESPONSE", "LLM 返回的分镜结果不是有效 JSON")
  }
}

export const POST = withError(async (request: NextRequest) => {
  const body = await request.json()
  const { projectId, episodeIds } = body

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

  const assetCharacters = await prisma.assetCharacter.findMany({ where: { projectId } })
  const assetScenes = await prisma.assetScene.findMany({ where: { projectId } })
  const assetProps = await prisma.assetProp.findMany({ where: { projectId } })

  let previousShotStr: string | null = null

  try {
    for (const episode of targetEpisodes) {
      // 新规则：每次生成前先清空当前分集已有分镜
      await prisma.shot.deleteMany({ where: { episodeId: episode.id } })

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

      const shotData = (aiResult.prompts || [])
        .map((prompt) => prompt.trim())
        .filter((prompt) => prompt.length > 0)
        .map((prompt, si) => ({
          episodeId: episode.id,
          index: si,
          prompt,
          negativePrompt: null,
          duration: "3s",
          dialogueText: null,
          actionNote: null,
          characterIds: matchedCharacterIds.length > 0 ? JSON.stringify(matchedCharacterIds) : null,
          sceneId: matchedScene?.id || null,
          propIds: matchedPropIds.length > 0 ? JSON.stringify(matchedPropIds) : null,
        }))

      if (shotData.length > 0) {
        await prisma.shot.createMany({ data: shotData })
      }

      if (aiResult.prompts?.length) {
        const lastPrompt = aiResult.prompts[aiResult.prompts.length - 1]
        previousShotStr = `分镜提示词: ${lastPrompt}`
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
