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
  scriptLineIndexes?: number[]
}

interface AIStoryboardResult {
  shots: AIShotResult[]
}

const storyboardInclude = {
  scriptScene: {
    include: {
      lines: { orderBy: { index: "asc" as const } },
      script: {
        select: {
          id: true,
          episodeId: true,
          episode: { select: { id: true, index: true, title: true } },
        },
      },
    },
  },
  shots: { orderBy: { index: "asc" as const } },
}

async function callAIGenerateStoryboard(
  sceneTitle: string,
  sceneDescription: string | null,
  sceneLocation: string | null,
  sceneEmotion: string | null,
  sceneBgm: string | null,
  sceneDuration: string,
  sceneCharacters: string | null,
  sceneProps: string | null,
  scriptLinesStr: string,
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
    return generateLocalStoryboard(sceneTitle, scriptLinesStr)
  }

  const prompt = `你是一位资深分镜师/电影摄影师，擅长将剧本转化为精确的分镜设计。

## 任务
请基于以下剧本场景，为其设计详细的分镜镜头序列。

## 当前场景信息
- 场景标题：${sceneTitle}
- 场景描述：${sceneDescription || "无"}
- 场景地点：${sceneLocation || "未指定"}
- 情绪基调：${sceneEmotion || "平静"}
- BGM 建议：${sceneBgm || "无"}
- 目标时长：${sceneDuration}
- 出场角色：${sceneCharacters || "无"}
- 涉及道具：${sceneProps || "无"}

## 场景剧本行
${scriptLinesStr}

## 角色资产（用于画面 Prompt 中的外貌描述）
${assetCharactersStr || "无"}

## 场景资产（用于画面 Prompt 中的环境描述）
${assetScenesStr || "无"}

## 全局参数
- 目标平台：${platform}
- 画幅比例：${aspectRatio}（竖屏构图）
- 视觉风格：${stylePreset || "电影感"}
- 全局负面提示词：${globalNegPrompt || "blurry, low quality, distorted"}

${previousShotStr ? `## 前一场景最后一个镜头信息\n${previousShotStr}（确保衔接）` : ""}

## 要求
1. 将剧本行转化为具体的镜头序列，通常一个场景拆分为 2-6 个镜头
2. 合理搭配景别：
   - 场景开头用远景/全景建立环境
   - 对话用中景/中近景
   - 情绪高潮用近景/特写
   - 关键道具/表情用特写
3. 一条台词行可以对应一个镜头，也可以多条合并为一个镜头
4. 每个镜头需包含：
   - shotSize：景别（extreme_wide/wide/medium/medium_close/close/extreme_close）
   - cameraMovement：镜头运动（static/push_in/pull_out/pan/tilt/tracking/orbit/crane/handheld）
   - cameraAngle：镜头角度（eye_level/high/low/birds_eye/dutch）
   - composition：画面构图描述（中文，描述画面中的元素布局）
   - prompt：画面描述（英文，用于 AI 图像生成，包含场景、角色外貌、表情、动作、光影、氛围）
   - negativePrompt：负面提示词（英文，排除不需要的元素）
   - duration：预估时长
   - dialogueText：该镜头期间的台词/旁白文本（如有）
   - actionNote：动作备注（如有）
   - scriptLineIndexes：关联的剧本行索引列表
5. 画面 Prompt 要求：
   - 英文描述，详细且具体
   - 包含：场景环境（时间、天气、光线）、角色外貌（使用角色资产中的描述）、角色表情和动作、道具位置、构图方式、光影效果、整体氛围
   - 末尾标注画幅比例（如 "9:16 vertical frame"）
   - 包含风格关键词（如 "cinematic", "dramatic lighting"）
6. 镜头运动选择要考虑情绪：
   - 紧张/悬疑：推进、手持
   - 温馨/平静：静止、缓慢横摇
   - 震惊/冲击：快速推进、特写
   - 感慨/悲伤：缓慢拉远
7. 所有镜头时长之和应接近场景目标时长

## 输出格式
请严格按以下 JSON 格式输出：

{
  "shots": [
    {
      "shotSize": "wide",
      "cameraMovement": "push_in",
      "cameraAngle": "eye_level",
      "composition": "画面构图描述（中文）",
      "prompt": "English prompt for AI image generation...",
      "negativePrompt": "blurry, low quality, distorted face, extra limbs, watermark",
      "duration": "4s",
      "dialogueText": "台词/旁白文本（如有）",
      "actionNote": "动作备注（如有）",
      "scriptLineIndexes": [0, 1]
    }
  ]
}

注意：
- 不要在 shots 中包含 index 字段，系统会自动计算编号
- scriptLineIndexes 使用剧本行的 index（从 0 开始）
- prompt 必须用英文书写
- negativePrompt 必须用英文书写`

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
      return generateLocalStoryboard(sceneTitle, scriptLinesStr)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) return generateLocalStoryboard(sceneTitle, scriptLinesStr)

    const parsed = JSON.parse(content)
    return { shots: parsed.shots || [] }
  } catch (err) {
    console.error("AI storyboard generation failed, falling back to local:", err)
    return generateLocalStoryboard(sceneTitle, scriptLinesStr)
  }
}

function generateLocalStoryboard(
  sceneTitle: string,
  scriptLinesStr: string
): AIStoryboardResult {
  const lineCount = (scriptLinesStr.match(/\[/g) || []).length
  const shotCount = Math.max(2, Math.min(lineCount, 4))

  const sizes = ["wide", "medium", "medium_close", "close"]
  const movements = ["push_in", "static", "static", "push_in"]

  const shots: AIShotResult[] = []
  for (let i = 0; i < shotCount; i++) {
    shots.push({
      shotSize: sizes[i % sizes.length],
      cameraMovement: movements[i % movements.length],
      cameraAngle: "eye_level",
      composition: `${sceneTitle} - 镜头 ${i + 1} 构图描述（本地生成，建议配置 AI API Key）`,
      prompt: `Scene: ${sceneTitle}, shot ${i + 1}, ${sizes[i % sizes.length]} shot, cinematic lighting, 9:16 vertical frame, photorealistic. (Local fallback - configure AI API Key for better results)`,
      negativePrompt: "blurry, low quality, distorted face, extra limbs, watermark, text",
      duration: `${Math.round(3 + Math.random() * 3)}s`,
      dialogueText: undefined,
      actionNote: undefined,
      scriptLineIndexes: [i],
    })
  }

  return { shots }
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { projectId, episodeIds, scriptSceneIds, mode = "skip_existing" } = body

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

  const scripts = await prisma.script.findMany({
    where: { projectId },
    include: {
      episode: true,
      scenes: {
        orderBy: { index: "asc" },
        include: { lines: { orderBy: { index: "asc" } } },
      },
    },
  })

  if (scripts.length === 0) {
    return NextResponse.json({ error: "项目无已确认的剧本数据" }, { status: 400 })
  }

  let targetScenes: Array<{
    scene: typeof scripts[0]["scenes"][0]
    script: typeof scripts[0]
    episodeTitle: string
  }> = []

  if (scriptSceneIds?.length) {
    for (const script of scripts) {
      for (const scene of script.scenes) {
        if (scriptSceneIds.includes(scene.id)) {
          targetScenes.push({ scene, script, episodeTitle: script.episode.title })
        }
      }
    }
  } else if (episodeIds?.length) {
    for (const script of scripts) {
      if (episodeIds.includes(script.episodeId)) {
        for (const scene of script.scenes) {
          targetScenes.push({ scene, script, episodeTitle: script.episode.title })
        }
      }
    }
  } else {
    for (const script of scripts) {
      for (const scene of script.scenes) {
        targetScenes.push({ scene, script, episodeTitle: script.episode.title })
      }
    }
  }

  if (targetScenes.length === 0) {
    return NextResponse.json({ error: "没有可生成的场景" }, { status: 400 })
  }

  const existingStoryboardSceneIds = new Set(
    (await prisma.storyboard.findMany({
      where: { projectId },
      select: { scriptSceneId: true },
    })).map((sb) => sb.scriptSceneId)
  )

  let skippedScenes = 0

  if (mode === "skip_existing") {
    const before = targetScenes.length
    targetScenes = targetScenes.filter((t) => !existingStoryboardSceneIds.has(t.scene.id))
    skippedScenes = before - targetScenes.length
  } else if (mode === "overwrite") {
    const overwriteIds = targetScenes
      .filter((t) => existingStoryboardSceneIds.has(t.scene.id))
      .map((t) => t.scene.id)
    if (overwriteIds.length > 0) {
      await prisma.storyboard.deleteMany({
        where: { projectId, scriptSceneId: { in: overwriteIds } },
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
    for (const { scene, episodeTitle } of targetScenes) {
      const scriptLinesStr = scene.lines
        .map((l, i) => {
          if (l.type === "dialogue") return `[${i}][对白] ${l.character}${l.emotion ? `(${l.emotion})` : ""}：${l.content}${l.parenthetical ? ` (${l.parenthetical})` : ""}`
          if (l.type === "narration") return `[${i}][旁白] ${l.content}`
          if (l.type === "action") return `[${i}][动作] ${l.content}`
          return `[${i}][转场] ${l.content}`
        })
        .join("\n")

      const aiResult = await callAIGenerateStoryboard(
        scene.title,
        scene.description,
        scene.location,
        scene.emotion,
        scene.bgm,
        scene.duration,
        scene.characters,
        scene.props,
        scriptLinesStr,
        assetCharactersStr,
        assetScenesStr,
        project.platform,
        project.aspectRatio,
        project.stylePreset,
        project.globalNegPrompt,
        previousShotStr
      )

      const lineIds = scene.lines.map((l) => l.id)

      await prisma.storyboard.create({
        data: {
          projectId,
          scriptSceneId: scene.id,
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
              scriptLineIds: shot.scriptLineIndexes?.length
                ? JSON.stringify(shot.scriptLineIndexes.map((idx) => lineIds[idx] || `line_${idx}`))
                : null,
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
        generatedScenes: targetScenes.length,
        skippedScenes,
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
      { error: "部分场景生成失败", storyboards: allStoryboards },
      { status: 500 }
    )
  }
}
