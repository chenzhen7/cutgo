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
import { buildShotListSystemPrompt, buildShotListUserPrompt } from "@/lib/prompts"
import type { ShotListItem } from "@/lib/prompts"
import { buildShotAssetData, extractEpisodeAssetIds } from "@/lib/utils"
import { episodeWithShotsInclude, toScriptShotPlan } from "../utils"

function parseLLMJsonArray<T>(raw: string, label: string): T[] {
  let text = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim()
  try {
    const parsed = JSON.parse(text) as unknown
    if (!Array.isArray(parsed)) throw new Error("response is not an array")
    return parsed as T[]
  } catch (err) {
    console.error(`[LLM Response Parse Error] ${label}`, { error: err, rawText: text })
    const msg = err instanceof Error ? err.message : String(err)
    throwCutGoError("LLM_INVALID_RESPONSE", `${label} 解析失败: ${msg}`)
  }
}

// 提取分镜列表
async function callAIExtractShotList(
  episodeTitle: string,
  scriptContent: string,
  episodeCharacters: string,
  episodeProps: string,
  episodeScenes: string,
  previousShotContent: string | null
): Promise<ShotListItem[]> {
  const systemPrompt = buildShotListSystemPrompt()
  const userPrompt = buildShotListUserPrompt({
    episodeTitle,
    episodeScenes,
    episodeCharacters,
    episodeProps,
    scriptContent: scriptContent.slice(0, 6000),
    previousShotContent,
  })

  const result = await callLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  })

  const rawItems = parseLLMJsonArray<Record<string, unknown>>(result.content?.trim() || "", "分镜生成")

  return rawItems
    .map((item) => {
      if (!item || typeof item !== "object") return {}
      const content = typeof item.content === "string" && item.content.trim() ? item.content.trim() : undefined
      const characters = Array.isArray(item.characters)
        ? (item.characters as unknown[]).filter((v): v is string => typeof v === "string").map((v) => v.trim()).filter(Boolean)
        : undefined
      const scene = typeof item.scene === "string" && item.scene.trim() ? item.scene.trim() : undefined
      const props = Array.isArray(item.props)
        ? (item.props as unknown[]).filter((v): v is string => typeof v === "string").map((v) => v.trim()).filter(Boolean)
        : undefined
      const duration =
        typeof item.duration === "number"
          ? item.duration
          : typeof item.duration === "string"
            ? parseInt(item.duration, 10)
            : undefined
      return { content, characters, scene, props, duration }
    })
    .filter((item): item is ShotListItem => Boolean(item.content))
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
    include: { shots: true, episodeAssets: true },
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

  // 上一集最后一个镜头的 content，用于叙事衔接
  let previousShotContent: string | null = null

  try {
    for (const episode of targetEpisodes) {
      const task = await createRunningAiTask({
        projectId,
        episodeId: episode.id,
        targetInfo: `第${episode.index + 1}集 ${episode.title}`,
        taskType: "llm_shot",
      })

      const episodeAssetIds = extractEpisodeAssetIds(episode.episodeAssets)

      const matchedCharacters = assetCharacters.filter((c) => episodeAssetIds.characterIds.includes(c.id))
      const matchedScene = episodeAssetIds.sceneIds.length > 0
        ? assetScenes.find((s) => s.id === episodeAssetIds.sceneIds[0]) ?? null
        : null
      const matchedProps = assetProps.filter((p) => episodeAssetIds.propIds.includes(p.id))

      const episodeCharactersStr = matchedCharacters.map((c) => c.name).join("; ")
      const episodePropsStr = matchedProps.map((p) => p.name).join("; ")
      const episodeScenesStr = matchedScene?.name || ""

      try {
        const shotList = await callAIExtractShotList(
          episode.title,
          episode.script,
          episodeCharactersStr,
          episodePropsStr,
          episodeScenesStr,
          previousShotContent
        )

        // 资产名称 → ID 映射
        const episodeCharacterMap = new Map(matchedCharacters.map((c) => [c.name.trim(), c.id]))
        const projectCharacterMap = new Map(assetCharacters.map((c) => [c.name.trim(), c.id]))
        const episodePropMap = new Map(matchedProps.map((p) => [p.name.trim(), p.id]))
        const projectPropMap = new Map(assetProps.map((p) => [p.name.trim(), p.id]))
        const episodeSceneMap = new Map(
          (matchedScene ? [matchedScene] : []).map((s) => [s.name.trim(), s.id] as const)
        )
        const projectSceneMap = new Map(assetScenes.map((s) => [s.name.trim(), s.id]))

        const shotItems = shotList
          .map((shot, si) => {
            if (!shot.content) return null

            const characterIds = shot.characters
              .map((name) => episodeCharacterMap.get(name) ?? projectCharacterMap.get(name))
              .filter((id): id is string => Boolean(id))
            const propIds = shot.props
              .map((name) => episodePropMap.get(name) ?? projectPropMap.get(name))
              .filter((id): id is string => Boolean(id))
            const sceneId =
              (shot.scene ? (episodeSceneMap.get(shot.scene) ?? projectSceneMap.get(shot.scene)) : null)
              ?? matchedScene?.id
              ?? null

            return {
              shotData: {
                episodeId: episode.id,
                index: si,
                content: shot.content,
                lastContent: null,
                negativePrompt: null,
                duration: shot.duration ?? 3,
                imageType: "keyframe",
                gridLayout: null,
                videoPrompt: null,
                dialogueText: null,
                actionNote: null,
              },
              characterIds,
              sceneId,
              propIds,
            }
          })
          .filter((item): item is NonNullable<typeof item> => Boolean(item))

        await prisma.$transaction(async (tx) => {
          await tx.shot.deleteMany({ where: { episodeId: episode.id } })
          for (const { shotData, characterIds, sceneId, propIds } of shotItems) {
            const shot = await tx.shot.create({ data: shotData })
            const assets = buildShotAssetData(shot.id, characterIds, sceneId, propIds)
            if (assets.length > 0) {
              await tx.shotAsset.createMany({ data: assets })
            }
          }
        })

        // 更新 previousShotContent 供下一集使用
        const tail = shotList[shotList.length - 1]?.content?.trim() || ""
        if (tail) {
          previousShotContent = tail
        }

        await markAiTaskSucceeded(task.id)
      } catch (err) {
        await markAiTaskFailed(task.id, err)
        throw err
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
        avgShotsPerEpisode:
          generatedPlans.length > 0 ? Math.round((totalShots / generatedPlans.length) * 10) / 10 : 0,
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
    const errorInfo = toErrorInfo(err)
    const errorStatus = (err as { status?: number }).status || API_ERRORS.INTERNAL.status
    return NextResponse.json(
      {
        error: errorInfo.code,
        message: errorInfo.message,
        scriptShotPlans: allScriptShotPlans,
      },
      { status: errorStatus }
    )
  }
})
