import { NextRequest, NextResponse } from "next/server"
import type { Prisma } from "@/lib/generated/prisma/client"
import { prisma } from "@/lib/db"
import { API_ERRORS, throwCutGoError, withError } from "@/lib/api-error"
import { callLLM } from "@/lib/ai/llm"
import {
  createRunningAiTask,
  markAiTaskFailed,
  markAiTaskSucceeded,
  toErrorInfo,
} from "@/lib/ai-task-service"
import { buildScriptShotsSystemPrompt, buildScriptShotsUserPrompt } from "@/lib/prompts"
import { parseJsonArray } from "@/lib/utils"
import { episodeWithShotsInclude, toScriptShotPlan } from "../utils"

interface AIScriptShotResult {
  shots: Array<{
    prompt: string
    promptEnd?: string
    gridPrompts?: string[]
    videoPrompt?: string
    characters: string[]
    scene: string
    props: string[]
  }>
}

async function callAIGenerateScriptShots(
  episodeTitle: string,
  scriptContent: string,
  episodeCharacters: string,
  episodeProps: string,
  episodeScenes: string,
  previousShotStr: string | null,
  imageType: string = "keyframe",
  gridLayout: string | null = null
): Promise<AIScriptShotResult> {
  const systemPrompt = buildScriptShotsSystemPrompt(
    undefined,
    imageType as import("@/lib/types").ImageType,
    gridLayout as import("@/lib/types").GridLayout | null
  )
  const userPrompt = buildScriptShotsUserPrompt({
    episodeTitle,
    episodeScenes,
    episodeCharacters,
    episodeProps,
    scriptContent: scriptContent.slice(0, 6000),
    previousShot: previousShotStr,
  })

  const result = await callLLM({
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
            promptEnd: undefined,
            gridPrompts: undefined,
            characters: [],
            scene: "",
            props: [],
          }
        }
        if (!item || typeof item !== "object") return null
        const raw = item as {
          prompt?: unknown
          shot?: unknown
          promptEnd?: unknown
          gridPrompts?: unknown
          videoPrompt?: unknown
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
        const promptEnd =
          typeof raw.promptEnd === "string" && raw.promptEnd.trim()
            ? raw.promptEnd.trim()
            : undefined
        const gridPrompts = Array.isArray(raw.gridPrompts)
          ? raw.gridPrompts
            .filter((v): v is string => typeof v === "string")
            .map((v) => v.trim())
            .filter(Boolean)
          : undefined
        const videoPrompt =
          typeof raw.videoPrompt === "string" && raw.videoPrompt.trim()
            ? raw.videoPrompt.trim()
            : undefined
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
          promptEnd,
          gridPrompts,
          videoPrompt,
          characters,
          scene,
          props,
        }
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
    return {
      shots,
    }
  } catch {
    throwCutGoError("LLM_INVALID_RESPONSE", "LLM 返回的分镜结果不是有效 JSON")
  }
}

export const POST = withError(async (request: NextRequest) => {
  const body = await request.json()
  const { projectId, episodeIds, imageType = "keyframe", gridLayout = null } = body

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
      const task = await createRunningAiTask({
        projectId,
        episodeId: episode.id,
        targetInfo: `第${episode.index + 1}集 ${episode.title}`,
        taskType: "llm_shot",
      })

      const episodeCharacterIds = parseJsonArray(episode.characters)
      const episodeSceneIds = parseJsonArray(episode.scenes)
      const episodePropIds = parseJsonArray(episode.props)

      const matchedCharacters = assetCharacters.filter((c) => episodeCharacterIds.includes(c.id))
      const matchedScene = episodeSceneIds.length > 0
        ? assetScenes.find((s) => s.id === episodeSceneIds[0]) ?? null
        : null
      const matchedProps = assetProps.filter((p) => episodePropIds.includes(p.id))

      try {
        const aiResult = await callAIGenerateScriptShots(
          episode.title,
          episode.script,
          matchedCharacters.map((c) => c.name).join("; "),
          matchedProps.map((p) => p.name).join("; "),
          matchedScene?.name || "",
          previousShotStr,
          imageType,
          gridLayout
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
              promptEnd: item.promptEnd ?? null,
              negativePrompt: null,
              duration: "3s",
              imageType: imageType as string,
              gridLayout: imageType === "multi_grid" ? (gridLayout as string | null) : null,
              gridPrompts: item.gridPrompts?.length ? JSON.stringify(item.gridPrompts) : null,
              videoPrompt: item.videoPrompt ?? null,
              dialogueText: null,
              actionNote: null,
              characterIds: characterIds.length > 0 ? JSON.stringify(characterIds) : null,
              sceneId,
              propIds: propIds.length > 0 ? JSON.stringify(propIds) : null,
            }
          })
          .filter((item): item is NonNullable<typeof item> => Boolean(item))

        const txOperations: Prisma.PrismaPromise<unknown>[] = [
          prisma.shot.deleteMany({ where: { episodeId: episode.id } }),
          prisma.episode.update({
            where: { id: episode.id },
            data: { shotType: imageType as string },
          }),
        ]
        if (shotData.length > 0) {
          txOperations.push(prisma.shot.createMany({ data: shotData }))
        }
        await prisma.$transaction(txOperations)

        if (aiResult.shots?.length) {
          const lastPrompt = aiResult.shots[aiResult.shots.length - 1]?.prompt?.trim() || ""
          if (lastPrompt) {
            previousShotStr = `分镜提示词: ${lastPrompt}`
          }
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
