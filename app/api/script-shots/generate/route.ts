import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

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

const scriptWithShotsInclude = {
  episode: { select: { id: true, index: true, title: true } },
  shots: { orderBy: { index: "asc" as const } },
}

function toScriptShotPlan(script: {
  id: string
  projectId: string
  title: string
  content: string
  episodeId: string
  status: string
  createdAt: Date
  updatedAt: Date
  episode: { id: string; index: number; title: string }
  shots: unknown[]
}) {
  return {
    id: script.id,
    projectId: script.projectId,
    scriptId: script.id,
    script: {
      id: script.id,
      title: script.title,
      content: script.content,
      episodeId: script.episodeId,
      episode: script.episode,
    },
    status: script.status,
    shots: script.shots,
    createdAt: script.createdAt,
    updatedAt: script.updatedAt,
  }
}

async function callAIGenerateScriptShots(
  scriptTitle: string,
  scriptContent: string,
  scriptCharacters: string | null,
  scriptProps: string | null,
  scriptLocation: string | null,
  assetCharactersStr: string,
  assetScenesStr: string,
  platform: string,
  aspectRatio: string,
  stylePreset: string | null,
  globalNegPrompt: string | null,
  previousShotStr: string | null
): Promise<AIScriptShotResult> {
  const apiKey = process.env.OPENAI_API_KEY
  const baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini"

  if (!apiKey) {
    return generateLocalScriptShots(scriptTitle, scriptContent)
  }

  const prompt = `你是一位资深分镜师和 AI 图像生成 Prompt 专家，擅长将剧本转化为高质量的画面描述提示词。

## 任务
请基于以下剧本内容，为每个关键画面生成高质量的图像生成提示词（Prompt）。

## 剧本信息
- 标题：${scriptTitle}
- 关联地点：${scriptLocation || "未指定"}
- 出场角色：${scriptCharacters || "无"}
- 涉及道具：${scriptProps || "无"}

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

${previousShotStr ? `## 前一个剧本最后一个镜头信息\n${previousShotStr}（确保衔接）` : ""}

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
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
        response_format: { type: "json_object" },
      }),
    })

    if (!response.ok) {
      console.error("AI API error:", response.status)
      return generateLocalScriptShots(scriptTitle, scriptContent)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) return generateLocalScriptShots(scriptTitle, scriptContent)

    const parsed = JSON.parse(content)
    return { shots: parsed.shots || [] }
  } catch (err) {
    console.error("AI script-shot generation failed, falling back to local:", err)
    return generateLocalScriptShots(scriptTitle, scriptContent)
  }
}

function generateLocalScriptShots(
  scriptTitle: string,
  scriptContent: string
): AIScriptShotResult {
  const contentLength = scriptContent.length
  const shotCount = Math.max(2, Math.min(Math.ceil(contentLength / 200), 6))

  const shots: AIShotResult[] = []
  for (let i = 0; i < shotCount; i++) {
    shots.push({
      composition: `${scriptTitle} - 画面 ${i + 1}（本地生成，建议配置 AI API Key 获得更好效果）`,
      prompt: `Scene from "${scriptTitle}", shot ${i + 1}, cinematic lighting, 9:16 vertical frame, photorealistic, detailed environment, dramatic atmosphere. (Local fallback - configure AI API Key for better results)`,
      negativePrompt: "blurry, low quality, distorted face, extra limbs, watermark, text",
    })
  }

  return { shots }
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { projectId, episodeIds, scriptIds, mode = "skip_existing" } = body

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 })
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) {
    return NextResponse.json({ error: "项目不存在" }, { status: 404 })
  }

  let targetScripts = await prisma.script.findMany({
    where: { projectId },
    include: { episode: true },
  })

  if (scriptIds?.length) {
    targetScripts = targetScripts.filter((s) => scriptIds.includes(s.id))
  } else if (episodeIds?.length) {
    targetScripts = targetScripts.filter((s) => episodeIds.includes(s.episodeId))
  }

  if (targetScripts.length === 0) {
    return NextResponse.json({ error: "没有可生成的剧本" }, { status: 400 })
  }

  const existingShotScriptIds = new Set(
    (await prisma.shot.findMany({
      where: { script: { projectId } },
      select: { scriptId: true },
      distinct: ["scriptId"],
    })).map((item) => item.scriptId)
  )

  let skippedScripts = 0

  if (mode === "skip_existing") {
    const before = targetScripts.length
    targetScripts = targetScripts.filter((s) => !existingShotScriptIds.has(s.id))
    skippedScripts = before - targetScripts.length
  } else if (mode === "overwrite") {
    const overwriteIds = targetScripts
      .filter((s) => existingShotScriptIds.has(s.id))
      .map((s) => s.id)
    if (overwriteIds.length > 0) {
      await prisma.shot.deleteMany({
        where: { scriptId: { in: overwriteIds } },
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
    for (const script of targetScripts) {
      const aiResult = await callAIGenerateScriptShots(
        script.title,
        script.content,
        script.characters,
        script.props,
        script.location,
        assetCharactersStr,
        assetScenesStr,
        project.platform,
        project.aspectRatio,
        project.stylePreset,
        project.globalNegPrompt,
        previousShotStr
      )

      const scriptCharacterNames: string[] = script.characters ? (() => { try { return JSON.parse(script.characters!) } catch { return [] } })() : []
      const scriptPropNames: string[] = script.props ? (() => { try { return JSON.parse(script.props!) } catch { return [] } })() : []
      const matchedCharacterIds = assetCharacters
        .filter((c) => scriptCharacterNames.includes(c.name))
        .map((c) => c.id)
      const matchedScene = script.location
        ? assetScenes.find((s) => s.name === script.location)
        : null
      const matchedPropIds = assetProps
        .filter((p) => scriptPropNames.includes(p.name))
        .map((p) => p.id)

      await prisma.shot.createMany({
        data: (aiResult.shots || []).map((shot, si) => ({
          scriptId: script.id,
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
      await prisma.script.update({
        where: { id: script.id },
        data: { status: "generated" },
      })

      if (aiResult.shots?.length) {
        const lastShot = aiResult.shots[aiResult.shots.length - 1]
        previousShotStr = `画面描述: ${lastShot.composition}`
      }
    }

    const scriptsWithShots = await prisma.script.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
      include: scriptWithShotsInclude,
    })
    const allScriptShotPlans = scriptsWithShots.map(toScriptShotPlan)

    const totalShots = allScriptShotPlans.reduce((sum, sb) => sum + sb.shots.length, 0)
    const generatedPlans = allScriptShotPlans.filter((sb) => sb.shots.length > 0)

    return NextResponse.json({
      scriptShotPlans: allScriptShotPlans,
      stats: {
        scriptCount: generatedPlans.length,
        totalShots,
        avgShotsPerScript: generatedPlans.length > 0 ? Math.round(totalShots / generatedPlans.length * 10) / 10 : 0,
        generatedScripts: targetScripts.length,
        skippedScripts,
      },
    })
  } catch (err) {
    console.error("Script-shot generation failed:", err)
    const scriptsWithShots = await prisma.script.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
      include: scriptWithShotsInclude,
    })
    const allScriptShotPlans = scriptsWithShots.map(toScriptShotPlan)
    return NextResponse.json(
      { error: "部分剧本生成失败", scriptShotPlans: allScriptShotPlans },
      { status: 500 }
    )
  }
}
