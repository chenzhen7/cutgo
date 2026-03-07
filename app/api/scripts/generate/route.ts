import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

interface AIScriptScene {
  title: string
  description: string
  duration: string
  emotion: string
  bgm: string
  location: string
  characters?: string[]
  props?: string[]
  lines: {
    type: "dialogue" | "narration" | "action" | "transition"
    character?: string
    emotion?: string
    content: string
    duration?: string
    parenthetical?: string
  }[]
}

interface AIScriptResult {
  scenes: AIScriptScene[]
}

async function callAIGenerateScript(
  episodeTitle: string,
  episodeSynopsis: string,
  keyConflict: string | null,
  cliffhanger: string | null,
  episodeDuration: string,
  scenesJson: string,
  chapterContent: string,
  novelSynopsis: string | null,
  characters: string,
  previousSceneContent: string | null,
  platform: string,
  duration: string,
  scenesInfo: string,
  propsInfo: string
): Promise<AIScriptResult> {
  const apiKey = process.env.OPENAI_API_KEY
  const baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini"

  if (!apiKey) {
    return generateLocalScript(episodeTitle, episodeSynopsis, scenesJson)
  }

  const prompt = `你是一位资深短剧编剧，擅长将分集大纲转化为高质量的竖屏短剧剧本。

## 任务
请基于以下分集大纲，生成该集的完整剧本。

## 当前分集信息
- 集标题：${episodeTitle}
- 剧情摘要：${episodeSynopsis}
- 核心冲突：${keyConflict || "无"}
- 结尾钩子：${cliffhanger || "无"}
- 目标时长：${episodeDuration}

## 大纲场景列表
${scenesJson}

## 来源章节原文（供参考，提取对白和描写素材）
${chapterContent.slice(0, 8000)}

## 全局上下文
- 故事大纲：${novelSynopsis || "无"}
- 角色列表（含性格描述）：${characters || "无"}
- 场景库（可选地点）：${scenesInfo || "无"}
- 道具库：${propsInfo || "无"}
${previousSceneContent ? `- 前一集最后一个场景的剧本内容：${previousSceneContent}` : ""}

## 目标参数
- 目标平台：${platform}
- 每集时长：${duration}

## 要求
1. 基于大纲中的每个场景，生成详细的剧本内容
2. 每个场景包含多条剧本行，类型包括：
   - dialogue（对白）：角色台词，需指定说话角色和情绪
   - narration（旁白）：画外音，推动剧情或渲染氛围
   - action（动作）：动作描述、场景描写，要有画面感
   - transition（转场）：场景转换指示
3. 对白要求：
   - 符合角色性格和身份
   - 口语化、自然，避免书面语
   - 有情感张力，推动冲突
   - 每句台词控制在 15 字以内（适合字幕展示）
4. 旁白要求：
   - 简洁有力，每句不超过 20 字
   - 用于补充画面无法传达的信息
5. 动作描述要求：
   - 有画面感，便于后续分镜设计
   - 描述角色的表情、动作、位置变化
6. 每个场景附带 BGM 建议和场景地点（location 请使用场景库中的名称）
7. 每个场景附带出场角色列表 characters（使用角色库中的名称）和涉及道具列表 props（使用道具库中的名称）
8. 每行附带预估时长（对白约 2-4s，旁白约 3-5s，动作约 2-6s）
9. 所有场景的时长之和应接近目标时长
10. 情绪标签从以下选项中选择：平静、紧张、悲伤、激昂、温馨、愤怒、震惊、心动、悬疑、冲击、感慨、压抑
11. 如有前一集的内容，确保本集开头与之自然衔接
12. 结尾场景必须体现 cliffhanger，制造悬念

## 输出格式
请严格按以下 JSON 格式输出：

{
  "scenes": [
    {
      "title": "场景标题",
      "description": "场景整体描述",
      "duration": "15s",
      "emotion": "感慨",
      "bgm": "轻柔钢琴曲",
      "location": "机场出口",
      "characters": ["林晚秋"],
      "props": ["行李箱"],
      "lines": [
        {
          "type": "narration",
          "content": "五年后的机场，一切都变了。",
          "duration": "3s"
        },
        {
          "type": "action",
          "content": "林晚秋拖着行李箱走出机场，阳光刺眼。",
          "duration": "4s"
        },
        {
          "type": "dialogue",
          "character": "林晚秋",
          "emotion": "感慨",
          "content": "回来了...",
          "duration": "2s",
          "parenthetical": "轻声"
        },
        {
          "type": "transition",
          "content": "画面渐黑，切换至下一场景",
          "duration": "1s"
        }
      ]
    }
  ]
}

注意：不要在 scenes 或 lines 中包含 index 字段，系统会自动计算编号。`

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
      return generateLocalScript(episodeTitle, episodeSynopsis, scenesJson)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) return generateLocalScript(episodeTitle, episodeSynopsis, scenesJson)

    const parsed = JSON.parse(content)
    return { scenes: parsed.scenes || [] }
  } catch (err) {
    console.error("AI script generation failed, falling back to local:", err)
    return generateLocalScript(episodeTitle, episodeSynopsis, scenesJson)
  }
}

function generateLocalScript(
  episodeTitle: string,
  episodeSynopsis: string,
  scenesJson: string
): AIScriptResult {
  let outlineScenes: { title: string; summary: string; duration: string; emotion?: string; characters?: string }[] = []
  try {
    outlineScenes = JSON.parse(scenesJson)
  } catch {
    outlineScenes = [
      { title: "开场", summary: episodeSynopsis.slice(0, 60), duration: "15s", emotion: "平静" },
      { title: "发展", summary: episodeSynopsis.slice(60, 120) || "剧情发展", duration: "20s", emotion: "紧张" },
      { title: "高潮", summary: episodeSynopsis.slice(120, 180) || "冲突爆发", duration: "15s", emotion: "激昂" },
      { title: "收尾", summary: "悬念结尾", duration: "10s", emotion: "悬疑" },
    ]
  }

  const scenes: AIScriptScene[] = outlineScenes.map((os) => ({
    title: os.title,
    description: os.summary || "场景描述",
    duration: os.duration || "15s",
    emotion: os.emotion || "平静",
    bgm: "背景音乐（本地生成，建议配置 AI API Key）",
    location: "场景地点",
    lines: [
      {
        type: "narration" as const,
        content: `${os.summary || os.title}（本地生成，建议配置 AI API Key 获取更好的结果）`,
        duration: "3s",
      },
      {
        type: "action" as const,
        content: `场景：${os.title}。角色进入画面。`,
        duration: "4s",
      },
      {
        type: "dialogue" as const,
        character: "角色A",
        emotion: os.emotion || "平静",
        content: "台词内容待补充",
        duration: "3s",
        parenthetical: "正常语气",
      },
    ],
  }))

  return { scenes }
}

const scriptInclude = {
  episode: {
    select: {
      id: true,
      index: true,
      title: true,
      chapterId: true,
      chapter: { select: { id: true, index: true, title: true } },
    },
  },
  scenes: {
    orderBy: { index: "asc" as const },
    include: {
      lines: { orderBy: { index: "asc" as const } },
    },
  },
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { projectId, episodeIds, mode = "skip_existing" } = body

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 })
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) {
    return NextResponse.json({ error: "项目不存在" }, { status: 404 })
  }

  if (project.step < 3) {
    return NextResponse.json({ error: "请先完成分集大纲" }, { status: 400 })
  }

  const novel = await prisma.novel.findUnique({
    where: { projectId },
    include: {
      chapters: { orderBy: { index: "asc" } },
      characters: true,
    },
  })

  if (!novel || novel.status !== "confirmed") {
    return NextResponse.json({ error: "请先完成小说导入并确认" }, { status: 400 })
  }

  let targetEpisodes = await prisma.episode.findMany({
    where: { projectId },
    orderBy: { index: "asc" },
    include: {
      scenes: { orderBy: { index: "asc" } },
      chapter: true,
    },
  })

  if (episodeIds?.length) {
    targetEpisodes = targetEpisodes.filter((ep) => episodeIds.includes(ep.id))
  }

  if (targetEpisodes.length === 0) {
    return NextResponse.json({ error: "没有可生成的分集" }, { status: 400 })
  }

  const existingScriptEpisodeIds = new Set(
    (await prisma.script.findMany({
      where: { projectId },
      select: { episodeId: true },
    })).map((s) => s.episodeId)
  )

  let skippedEpisodes = 0

  if (mode === "skip_existing") {
    const before = targetEpisodes.length
    targetEpisodes = targetEpisodes.filter((ep) => !existingScriptEpisodeIds.has(ep.id))
    skippedEpisodes = before - targetEpisodes.length
  } else if (mode === "overwrite") {
    const overwriteIds = targetEpisodes
      .filter((ep) => existingScriptEpisodeIds.has(ep.id))
      .map((ep) => ep.id)
    if (overwriteIds.length > 0) {
      await prisma.script.deleteMany({
        where: { projectId, episodeId: { in: overwriteIds } },
      })
    }
  }

  const assetCharacters = await prisma.assetCharacter.findMany({ where: { projectId } })
  const assetScenes = await prisma.assetScene.findMany({ where: { projectId } })
  const assetProps = await prisma.assetProp.findMany({ where: { projectId } })

  const charactersStr = assetCharacters.length > 0
    ? assetCharacters
        .map((c) => {
          const parts = [`${c.name}(${c.role})`]
          if (c.description) parts.push(c.description)
          if (c.appearance) parts.push(`外貌: ${c.appearance}`)
          if (c.personality) parts.push(`性格: ${c.personality}`)
          return parts.join(", ")
        })
        .join("; ")
    : novel.characters
        .map((c) => `${c.name}(${c.role}): ${c.description || ""}`)
        .join("; ")

  const scenesStr = assetScenes.length > 0
    ? assetScenes.map((s) => `${s.name}: ${s.description || ""}${s.timeOfDay ? ` (${s.timeOfDay})` : ""}`).join("; ")
    : ""

  const propsStr = assetProps.length > 0
    ? assetProps.map((p) => `${p.name}: ${p.description || ""}`).join("; ")
    : ""

  const chapterMap = new Map<string, string>()
  for (const ch of novel.chapters) {
    chapterMap.set(ch.id, ch.content)
  }

  let previousSceneContent: string | null = null
  const lastScript = await prisma.script.findFirst({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    include: {
      scenes: {
        orderBy: { index: "desc" },
        take: 1,
        include: { lines: { orderBy: { index: "asc" } } },
      },
    },
  })
  if (lastScript?.scenes?.[0]) {
    const lastScene = lastScript.scenes[0]
    previousSceneContent = lastScene.lines
      .map((l) => {
        if (l.type === "dialogue") return `[对白] ${l.character}：${l.content}`
        if (l.type === "narration") return `[旁白] ${l.content}`
        if (l.type === "action") return `[动作] ${l.content}`
        return `[转场] ${l.content}`
      })
      .join("\n")
  }

  try {
    for (const episode of targetEpisodes) {
      const scenesJson = JSON.stringify(
        episode.scenes.map((s) => ({
          title: s.title,
          summary: s.summary,
          duration: s.duration,
          characters: s.characters,
          emotion: s.emotion,
        }))
      )

      const chapterContent = chapterMap.get(episode.chapterId) || ""

      const aiResult = await callAIGenerateScript(
        episode.title,
        episode.synopsis,
        episode.keyConflict,
        episode.cliffhanger,
        episode.duration,
        scenesJson,
        chapterContent,
        novel.synopsis,
        charactersStr,
        previousSceneContent,
        project.platform,
        project.duration,
        scenesStr,
        propsStr
      )

      await prisma.script.create({
        data: {
          projectId,
          episodeId: episode.id,
          title: episode.title,
          status: "generated",
          scenes: {
            create: (aiResult.scenes || []).map((scene, si) => ({
              index: si,
              title: scene.title,
              description: scene.description || null,
              duration: scene.duration || "15s",
              emotion: scene.emotion || null,
              bgm: scene.bgm || null,
              location: scene.location || null,
              characters: scene.characters?.length ? JSON.stringify(scene.characters) : null,
              props: scene.props?.length ? JSON.stringify(scene.props) : null,
              lines: {
                create: (scene.lines || []).map((line, li) => ({
                  index: li,
                  type: line.type,
                  character: line.character || null,
                  emotion: line.emotion || null,
                  content: line.content,
                  duration: line.duration || null,
                  parenthetical: line.parenthetical || null,
                })),
              },
            })),
          },
        },
      })

      if (aiResult.scenes?.length) {
        const lastAiScene = aiResult.scenes[aiResult.scenes.length - 1]
        previousSceneContent = (lastAiScene.lines || [])
          .map((l) => {
            if (l.type === "dialogue") return `[对白] ${l.character}：${l.content}`
            if (l.type === "narration") return `[旁白] ${l.content}`
            if (l.type === "action") return `[动作] ${l.content}`
            return `[转场] ${l.content}`
          })
          .join("\n")
      }
    }

    const allScripts = await prisma.script.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
      include: scriptInclude,
    })

    const totalScenes = allScripts.reduce((sum, s) => sum + s.scenes.length, 0)
    const totalLines = allScripts.reduce(
      (sum, s) => sum + s.scenes.reduce((ss, sc) => ss + sc.lines.length, 0),
      0
    )
    const totalDuration = allScripts.reduce(
      (sum, s) => sum + s.scenes.reduce((ss, sc) => ss + (parseInt(sc.duration) || 0), 0),
      0
    )
    const characters = new Set<string>()
    for (const s of allScripts) {
      for (const sc of s.scenes) {
        for (const l of sc.lines) {
          if (l.type === "dialogue" && l.character) characters.add(l.character)
        }
      }
    }

    return NextResponse.json({
      scripts: allScripts,
      stats: {
        scriptCount: allScripts.length,
        totalScenes,
        totalLines,
        totalDuration: `${totalDuration}s`,
        characterCount: characters.size,
        generatedEpisodes: targetEpisodes.length,
        skippedEpisodes,
      },
    })
  } catch (err) {
    console.error("Script generation failed:", err)
    const allScripts = await prisma.script.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
      include: scriptInclude,
    })
    return NextResponse.json(
      {
        error: "部分分集生成失败",
        scripts: allScripts,
      },
      { status: 500 }
    )
  }
}
