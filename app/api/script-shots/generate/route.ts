import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { API_ERRORS, throwCutGoError, withError } from "@/lib/api-error"
import { getLLMProvider } from "@/lib/ai/llm"
import { buildScriptShotsSystemPrompt, buildScriptShotsUserPrompt } from "@/lib/prompts"

interface AIScriptShotResult {
  shots: Array<{
    prompt: string
    characters: string[]
    scene: string
    props: string[]
  }>
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

  const systemPrompt = buildScriptShotsSystemPrompt()
  const userPrompt = buildScriptShotsUserPrompt({
    episodeTitle,
    episodeScenes,
    episodeCharacters,
    episodeProps,
    scriptContent: scriptContent.slice(0, 6000),
    previousShot: previousShotStr,
  })

  const result = await llmProvider.chat({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  })
  let text = result.content?.trim() || ""
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim()

  try {
    const parsed = JSON.parse(text) as unknown
    if (!Array.isArray(parsed)) {
      throw new Error("invalid script shots structure")
    }
    const shots = parsed
      .map((item) => {
        if (typeof item === "string") {
          // 兼容历史输出结构：["镜头1", "镜头2"]
          return {
            prompt: item.trim(),
            characters: [],
            scene: "",
            props: [],
          }
        }
        if (!item || typeof item !== "object") return null
        const raw = item as {
          prompt?: unknown
          shot?: unknown
          characters?: unknown
          scene?: unknown
          props?: unknown
        }
        const prompt =
          typeof raw.prompt === "string"
            ? raw.prompt.trim()
            : typeof raw.shot === "string"
            ? raw.shot.trim()
            : ""
        if (!prompt) return null
        const characters = Array.isArray(raw.characters)
          ? raw.characters
            .filter((v): v is string => typeof v === "string")
            .map((v) => v.trim())
            .filter(Boolean)
          : []
        const scene = typeof raw.scene === "string" ? raw.scene.trim() : ""
        const props = Array.isArray(raw.props)
          ? raw.props
            .filter((v): v is string => typeof v === "string")
            .map((v) => v.trim())
            .filter(Boolean)
          : []
        return {
          prompt,
          characters,
          scene,
          props,
        }
      })
      .filter(
        (item): item is { prompt: string; characters: string[]; scene: string; props: string[] } =>
          Boolean(item)
      )
    return {
      shots,
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
      const matchedScene = episodeSceneIds.length > 0
        ? assetScenes.find((s) => s.id === episodeSceneIds[0]) ?? null
        : null
      const matchedProps = assetProps.filter((p) => episodePropIds.includes(p.id))

      const aiResult = await callAIGenerateScriptShots(
        episode.title,
        episode.script,
        matchedCharacters.map((c) => c.name).join("; "),
        matchedProps.map((p) => p.name).join("; "),
        matchedScene?.name || "",
        previousShotStr
      )

      const episodeCharacterMap = new Map(matchedCharacters.map((c) => [c.name.trim(), c.id]))
      const projectCharacterMap = new Map(assetCharacters.map((c) => [c.name.trim(), c.id]))
      const episodePropMap = new Map(matchedProps.map((p) => [p.name.trim(), p.id]))
      const projectPropMap = new Map(assetProps.map((p) => [p.name.trim(), p.id]))
      const episodeSceneMap = new Map(
        (matchedScene ? [matchedScene] : [])
          .map((s) => [s.name.trim(), s.id] as const)
      )
      const projectSceneMap = new Map(assetScenes.map((s) => [s.name.trim(), s.id]))

      const shotData = (aiResult.shots || [])
        .map((item, si) => {
          const prompt = item.prompt.trim()
          if (!prompt) return null
          const characterIds = item.characters
            .map((name) => episodeCharacterMap.get(name) ?? projectCharacterMap.get(name))
            .filter((id): id is string => Boolean(id))
          const propIds = item.props
            .map((name) => episodePropMap.get(name) ?? projectPropMap.get(name))
            .filter((id): id is string => Boolean(id))
          const sceneId =
            (item.scene ? (episodeSceneMap.get(item.scene) ?? projectSceneMap.get(item.scene)) : null)
            ?? matchedScene?.id
            ?? null
          return {
            episodeId: episode.id,
            index: si,
            prompt,
            negativePrompt: null,
            duration: "3s",
            dialogueText: null,
            actionNote: null,
            characterIds: characterIds.length > 0 ? JSON.stringify(characterIds) : null,
            sceneId,
            propIds: propIds.length > 0 ? JSON.stringify(propIds) : null,
          }
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item))

      if (shotData.length > 0) {
        await prisma.shot.createMany({ data: shotData })
      }

      if (aiResult.shots?.length) {
        const lastPrompt = aiResult.shots[aiResult.shots.length - 1]?.prompt?.trim() || ""
        if (lastPrompt) {
          previousShotStr = `分镜提示词: ${lastPrompt}`
        }
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
