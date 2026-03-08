import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

interface AIShotResult {
  shotSize: string
  cameraMovement: string
  cameraAngle: string
  composition: string
  prompt: string
  negativePrompt: string
  duration: string
  dialogueText?: string
  actionNote?: string
}

interface AIStoryboardResult {
  shots: AIShotResult[]
}

const storyboardInclude = {
  script: {
    select: {
      id: true,
      title: true,
      content: true,
      episodeId: true,
      episode: { select: { id: true, index: true, title: true } },
    },
  },
  shots: { orderBy: { index: "asc" as const } },
}

async function callAIGenerateStoryboard(
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
): Promise<AIStoryboardResult> {
  const apiKey = process.env.OPENAI_API_KEY
  const baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini"

  if (!apiKey) {
    return generateLocalStoryboard(scriptTitle, scriptContent)
  }

  const prompt = `你是一位资深分镜师/电影摄影师，擅长将剧本转化为精确的分镜设计。

## 任务
请基于以下剧本内容，为其设计详细的分镜镜头序列。

## 剧本信息
- 标题：${scriptTitle}
- 关联地点：${scriptLocation || "未指定"}
- 出场角色：${scriptCharacters || "无"}
- 涉及道具：${scriptProps || "无"}

## 剧本内容
${scriptContent.slice(0, 6000)}

## 角色资产（用于画面 Prompt 中的外貌描述）
${assetCharactersStr || "无"}

## 场景资产（用于画面 Prompt 中的环境描述）
${assetScenesStr || "无"}

## 全局参数
- 目标平台：${platform}
- 画幅比例：${aspectRatio}（竖屏构图）
- 视觉风格：${stylePreset || "电影感"}
- 全局负面提示词：${globalNegPrompt || "blurry, low quality, distorted"}

${previousShotStr ? `## 前一个剧本最后一个镜头信息\n${previousShotStr}（确保衔接）` : ""}

## 要求
1. 将剧本内容转化为具体的镜头序列，通常一个剧本拆分为 4-12 个镜头
2. 合理搭配景别：
   - 开头用远景/全景建立环境
   - 对话用中景/中近景
   - 情绪高潮用近景/特写
   - 关键道具/表情用特写
3. 每个镜头需包含：
   - shotSize：景别（extreme_wide/wide/medium/medium_close/close/extreme_close）
   - cameraMovement：镜头运动（static/push_in/pull_out/pan/tilt/tracking/orbit/crane/handheld）
   - cameraAngle：镜头角度（eye_level/high/low/birds_eye/dutch）
   - composition：画面构图描述（中文）
   - prompt：画面描述（英文，用于 AI 图像生成）
   - negativePrompt：负面提示词（英文）
   - duration：预估时长
   - dialogueText：该镜头期间的台词/旁白文本（如有）
   - actionNote：动作备注（如有）
4. prompt 要求英文，详细且具体，包含场景环境、角色外貌、表情动作、光影效果等
5. 所有镜头时长之和应合理覆盖剧本内容

## 输出格式
请严格按以下 JSON 格式输出：

{
  "shots": [
    {
      "shotSize": "wide",
      "cameraMovement": "push_in",
      "cameraAngle": "eye_level",
      "composition": "画面构图描述",
      "prompt": "English prompt...",
      "negativePrompt": "blurry, low quality...",
      "duration": "4s",
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
      return generateLocalStoryboard(scriptTitle, scriptContent)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) return generateLocalStoryboard(scriptTitle, scriptContent)

    const parsed = JSON.parse(content)
    return { shots: parsed.shots || [] }
  } catch (err) {
    console.error("AI storyboard generation failed, falling back to local:", err)
    return generateLocalStoryboard(scriptTitle, scriptContent)
  }
}

function generateLocalStoryboard(
  scriptTitle: string,
  scriptContent: string
): AIStoryboardResult {
  const contentLength = scriptContent.length
  const shotCount = Math.max(2, Math.min(Math.ceil(contentLength / 200), 6))

  const sizes = ["wide", "medium", "medium_close", "close", "medium", "wide"]
  const movements = ["push_in", "static", "static", "push_in", "pan", "pull_out"]

  const shots: AIShotResult[] = []
  for (let i = 0; i < shotCount; i++) {
    shots.push({
      shotSize: sizes[i % sizes.length],
      cameraMovement: movements[i % movements.length],
      cameraAngle: "eye_level",
      composition: `${scriptTitle} - 镜头 ${i + 1} 构图描述（本地生成，建议配置 AI API Key）`,
      prompt: `Scene: ${scriptTitle}, shot ${i + 1}, ${sizes[i % sizes.length]} shot, cinematic lighting, 9:16 vertical frame, photorealistic. (Local fallback - configure AI API Key for better results)`,
      negativePrompt: "blurry, low quality, distorted face, extra limbs, watermark, text",
      duration: `${Math.round(3 + Math.random() * 3)}s`,
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

  if (project.step < 5) {
    return NextResponse.json({ error: "请先完成剧本生成并确认" }, { status: 400 })
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

  const existingStoryboardScriptIds = new Set(
    (await prisma.storyboard.findMany({
      where: { projectId },
      select: { scriptId: true },
    })).map((sb) => sb.scriptId)
  )

  let skippedScripts = 0

  if (mode === "skip_existing") {
    const before = targetScripts.length
    targetScripts = targetScripts.filter((s) => !existingStoryboardScriptIds.has(s.id))
    skippedScripts = before - targetScripts.length
  } else if (mode === "overwrite") {
    const overwriteIds = targetScripts
      .filter((s) => existingStoryboardScriptIds.has(s.id))
      .map((s) => s.id)
    if (overwriteIds.length > 0) {
      await prisma.storyboard.deleteMany({
        where: { projectId, scriptId: { in: overwriteIds } },
      })
    }
  }

  const assetCharacters = await prisma.assetCharacter.findMany({ where: { projectId } })
  const assetScenes = await prisma.assetScene.findMany({ where: { projectId } })

  const assetCharactersStr = assetCharacters.length > 0
    ? assetCharacters
        .map((c) => {
          const parts = [`${c.name}(${c.role})`]
          if (c.appearance) parts.push(`外貌: ${c.appearance}`)
          if (c.description) parts.push(c.description)
          return parts.join(", ")
        })
        .join("; ")
    : ""

  const assetScenesStr = assetScenes.length > 0
    ? assetScenes.map((s) => `${s.name}: ${s.description || ""}${s.timeOfDay ? ` (${s.timeOfDay})` : ""}`).join("; ")
    : ""

  let previousShotStr: string | null = null

  try {
    for (const script of targetScripts) {
      const aiResult = await callAIGenerateStoryboard(
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

      await prisma.storyboard.create({
        data: {
          projectId,
          scriptId: script.id,
          status: "generated",
          shots: {
            create: (aiResult.shots || []).map((shot, si) => ({
              index: si,
              shotSize: shot.shotSize || "medium",
              cameraMovement: shot.cameraMovement || "static",
              cameraAngle: shot.cameraAngle || "eye_level",
              composition: shot.composition || "",
              prompt: shot.prompt || "",
              negativePrompt: shot.negativePrompt || null,
              duration: shot.duration || "3s",
              dialogueText: shot.dialogueText || null,
              actionNote: shot.actionNote || null,
            })),
          },
        },
      })

      if (aiResult.shots?.length) {
        const lastShot = aiResult.shots[aiResult.shots.length - 1]
        previousShotStr = `景别: ${lastShot.shotSize}, 运镜: ${lastShot.cameraMovement}, 构图: ${lastShot.composition}`
      }
    }

    const allStoryboards = await prisma.storyboard.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
      include: storyboardInclude,
    })

    const totalShots = allStoryboards.reduce((sum, sb) => sum + sb.shots.length, 0)
    const totalDuration = allStoryboards.reduce(
      (sum, sb) => sum + sb.shots.reduce((ss, s) => ss + (parseFloat(s.duration) || 0), 0),
      0
    )
    const generatedSbs = allStoryboards.filter((sb) => sb.shots.length > 0)

    return NextResponse.json({
      storyboards: allStoryboards,
      stats: {
        storyboardCount: generatedSbs.length,
        totalShots,
        totalDuration: `${Math.round(totalDuration)}s`,
        avgShotsPerScene: generatedSbs.length > 0 ? Math.round(totalShots / generatedSbs.length * 10) / 10 : 0,
        generatedScripts: targetScripts.length,
        skippedScripts,
      },
    })
  } catch (err) {
    console.error("Storyboard generation failed:", err)
    const allStoryboards = await prisma.storyboard.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
      include: storyboardInclude,
    })
    return NextResponse.json(
      { error: "部分剧本生成失败", storyboards: allStoryboards },
      { status: 500 }
    )
  }
}
