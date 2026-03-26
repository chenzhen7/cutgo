import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { API_ERRORS, throwCutGoError, withError } from "@/lib/api-error"
import { getLLMProvider } from "@/lib/ai/llm"

interface AIShotResult {
  composition: string
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
  assetCharactersStr: string,
  assetScenesStr: string,
  platform: string,
  aspectRatio: string,
  stylePreset: string | null,
  globalNegPrompt: string | null,
  previousShotStr: string | null
): Promise<AIScriptShotResult> {
  const llmProvider = await getLLMProvider()
  if (!llmProvider) {
    return generateLocalScriptShots(episodeTitle, scriptContent)
  }

  const prompt = `你是一位资深分镜师和 AI 图像生成 Prompt 专家，擅长将剧本转化为高质量的画面描述提示词。

## 任务
请基于以下剧本内容，为每个关键画面生成高质量的图像生成提示词（Prompt）。

## 剧本信息
- 标题：${episodeTitle}
- 关联场景：${episodeScenes || "未指定"}
- 出场角色：${episodeCharacters || "无"}
- 涉及道具：${episodeProps || "无"}

## 剧本内容
${scriptContent.slice(0, 6000)}

## 角色资产（用于画面 Prompt 中的角色设定描述）
${assetCharactersStr || "无"}

## 场景资产（用于画面 Prompt 中的环境描述）
${assetScenesStr || "无"}

## 全局参数
- 目标平台：${platform}
- 画幅比例：${aspectRatio}
- 视觉风格：${stylePreset || "电影感"}
- 全局负面提示词：${globalNegPrompt || "blurry, low quality, distorted"}

${previousShotStr ? `## 前一个分集最后一个镜头信息\n${previousShotStr}（确保衔接）` : ""}

## 要求
1. 将剧本内容转化为具体的画面序列，通常一个剧本拆分为 4-12 个画面
2. 每个画面需包含：
   - composition：画面描述（中文，简洁描述这个画面表现的内容和氛围）
   - prompt：英文图像生成提示词（用于 AI 图像生成模型）
   - negativePrompt：英文负面提示词
   - dialogueText：该画面期间的台词/旁白文本（如有）
   - actionNote：动作/情节备注（如有）
3. prompt 编写指南：
   - 使用英文，详细且具体
   - 包含：主体描述、场景环境、光影氛围、色调风格、画面构图
   - 角色描述要具体：外貌特征、服装、表情、动作姿态
   - 环境描述要丰富：时间、天气、光线方向、材质细节
   - 可以加入风格关键词：cinematic, photorealistic, dramatic lighting 等
   - 画幅比例 ${aspectRatio} 的构图特点要体现在 prompt 中
4. 画面之间应有叙事连贯性，覆盖剧本的关键情节

## 输出格式
请严格按以下 JSON 格式输出：

{
  "shots": [
    {
      "composition": "画面中文描述",
      "prompt": "English image generation prompt...",
      "negativePrompt": "blurry, low quality...",
      "dialogueText": "台词文本",
      "actionNote": "动作备注"
    }
  ]
}

注意：不要在 shots 中包含 index 字段，系统会自动计算编号。`

  try {
    const result = await llmProvider.chat({
      messages: [{ role: "user", content: prompt }],
    })
    let text = result.content?.trim() || ""
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim()
    const parsed = JSON.parse(text)
    return { shots: parsed.shots || [] }
  } catch (err) {
    console.error("AI script-shot generation failed, falling back to local:", err)
    return generateLocalScriptShots(episodeTitle, scriptContent)
  }
}

function generateLocalScriptShots(
  episodeTitle: string,
  scriptContent: string
): AIScriptShotResult {
  const contentLength = scriptContent.length
  const shotCount = Math.max(2, Math.min(Math.ceil(contentLength / 200), 6))

  const shots: AIShotResult[] = []
  for (let i = 0; i < shotCount; i++) {
    shots.push({
      composition: `${episodeTitle} - 画面 ${i + 1}（本地生成，建议配置 AI 模型获得更好效果）`,
      prompt: `Scene from "${episodeTitle}", shot ${i + 1}, cinematic lighting, 9:16 vertical frame, photorealistic, detailed environment, dramatic atmosphere. (Local fallback - configure AI for better results)`,
      negativePrompt: "blurry, low quality, distorted face, extra limbs, watermark, text",
    })
  }

  return { shots }
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
    const overwriteIds = targetEpisodes
      .filter((ep) => existingShotEpisodeIds.has(ep.id))
      .map((ep) => ep.id)
    if (overwriteIds.length > 0) {
      await prisma.shot.deleteMany({
        where: { episodeId: { in: overwriteIds } },
      })
    }
  }

  const assetCharacters = await prisma.assetCharacter.findMany({ where: { projectId } })
  const assetScenes = await prisma.assetScene.findMany({ where: { projectId } })
  const assetProps = await prisma.assetProp.findMany({ where: { projectId } })

  const assetCharactersStr = assetCharacters.length > 0
    ? assetCharacters
        .map((c) => {
          const parts = [`${c.name}(${c.role})`]
          if (c.description) parts.push(c.description)
          return parts.join(", ")
        })
        .join("; ")
    : ""

  const assetScenesStr = assetScenes.length > 0
    ? assetScenes.map((s) => `${s.name}: ${s.description || ""}`).join("; ")
    : ""

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
        assetCharactersStr,
        assetScenesStr,
        project!.platform,
        project!.aspectRatio,
        project!.stylePreset,
        project!.globalNegPrompt,
        previousShotStr
      )

      await prisma.shot.createMany({
        data: (aiResult.shots || []).map((shot, si) => ({
          episodeId: episode.id,
          index: si,
          shotSize: "medium",
          cameraMovement: "static",
          cameraAngle: "eye_level",
          composition: shot.composition || "",
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
        previousShotStr = `画面描述: ${lastShot.composition}`
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
    return NextResponse.json(
      {
        error: API_ERRORS.INTERNAL.code,
        message: "部分分镜生成失败",
        scriptShotPlans: allScriptShotPlans,
      },
      { status: API_ERRORS.INTERNAL.status }
    )
  }
})
