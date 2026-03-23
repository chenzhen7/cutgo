import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { parseSourceChapterIds } from "@/lib/episode-source-chapters"
import * as apiError from "@/lib/api-error"

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
  previousContent: string | null,
  platform: string,
  duration: string,
  scenesInfo: string,
  propsInfo: string
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  const baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini"

  if (!apiKey) {
    return generateLocalScript(episodeTitle, episodeSynopsis)
  }

  const prompt = `你是一位资深短剧编剧，擅长将分集梗概转化为高质量的竖屏短剧剧本。

## 任务
请基于以下分集信息，生成该集的完整剧本文本。

## 当前分集信息
- 集标题：${episodeTitle}
- 剧情摘要：${episodeSynopsis}
- 核心冲突：${keyConflict || "无"}
- 结尾钩子：${cliffhanger || "无"}
- 目标时长：${episodeDuration}

## 大纲要点（结构参考）
${scenesJson}

## 来源章节原文（供参考，提取对白和描写素材）
${chapterContent.slice(0, 8000)}

## 全局上下文
- 故事大纲：${novelSynopsis || "无"}
- 角色列表（含性格描述）：${characters || "无"}
- 场景库（可选地点）：${scenesInfo || "无"}
- 道具库：${propsInfo || "无"}
${previousContent ? `- 前一集剧本末尾：\n${previousContent.slice(-1000)}` : ""}

## 目标参数
- 目标平台：${platform}
- 每集时长：${duration}

## 要求
1. 生成完整的剧本文本，包含对白、旁白、动作描写和转场指示
2. 使用标准剧本格式：
   - 场景标题用【场景N：标题】标记
   - 对白格式：角色名（情绪/动作指示）："台词内容"
   - 旁白格式：（旁白）内容
   - 动作描写格式：[动作描写内容]
   - 转场格式：——转场描述——
3. 对白要求：
   - 符合角色性格和身份
   - 口语化、自然，避免书面语
   - 有情感张力，推动冲突
   - 每句台词控制在 15 字以内（适合字幕展示）
4. 旁白要求：简洁有力，每句不超过 20 字
5. 动作描写要有画面感，便于后续分镜设计
6. 结尾场景必须体现 cliffhanger，制造悬念
7. 所有场景的内容之和应覆盖目标时长

## 输出格式
直接输出剧本纯文本，不要包含 JSON 或 markdown 代码块。`

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
      }),
    })

    if (!response.ok) {
      console.error("AI API error:", response.status)
      return generateLocalScript(episodeTitle, episodeSynopsis)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) return generateLocalScript(episodeTitle, episodeSynopsis)

    return content.trim()
  } catch (err) {
    console.error("AI script generation failed, falling back to local:", err)
    return generateLocalScript(episodeTitle, episodeSynopsis)
  }
}

function generateLocalScript(
  episodeTitle: string,
  episodeSynopsis: string
): string {
  return `【场景1：开场】

（旁白）${episodeSynopsis.slice(0, 60) || "故事开始了。"}

[角色走入画面，环境光线柔和]

角色A（平静）："一切都变了。"

——画面渐暗——

【场景2：发展】

[紧张的氛围，角色面对面对峙]

角色A（紧张）："你到底想怎样？"
角色B（冷笑）："你很快就会知道。"

（旁白）${episodeSynopsis.slice(60, 120) || "剧情持续发展。"}

——转场——

【场景3：高潮】

[冲突爆发，情绪激烈]

角色A（愤怒）："够了！"

（旁白）${episodeSynopsis.slice(120, 180) || "冲突达到顶峰。"}

——画面定格——

【场景4：结尾】

[悬念留白]

（旁白）一切才刚刚开始...

（本地生成的示例剧本，建议配置 AI API Key 获取更好的结果）`
}

const scriptInclude = {
  episode: {
    select: {
      id: true,
      index: true,
      title: true,
      chapterIds: true,
    },
  },
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { projectId, episodeIds, mode = "skip_existing" } = body

  if (!projectId) {
    return apiError.badRequest("projectId is required")
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) {
    return apiError.notFound("项目不存在")
  }

  const novel = await prisma.novel.findUnique({
    where: { projectId },
    include: {
      chapters: { orderBy: { index: "asc" } },
    },
  })

  if (!novel) {
    return apiError.validationError("请先导入小说并解析出章节")
  }

  let targetEpisodes = await prisma.episode.findMany({
    where: { projectId },
    orderBy: { index: "asc" },
  })

  if (episodeIds?.length) {
    targetEpisodes = targetEpisodes.filter((ep) => episodeIds.includes(ep.id))
  }

  if (targetEpisodes.length === 0) {
    return apiError.validationError("没有可生成的分集")
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

  const charactersStr = assetCharacters
    .map((c) => {
      const parts = [`${c.name}(${c.role})`]
      if (c.description) parts.push(c.description)
      if (c.personality) parts.push(`性格: ${c.personality}`)
      return parts.join(", ")
    })
    .join("; ")

  const scenesStr = assetScenes.length > 0
    ? assetScenes.map((s) => `${s.name}: ${s.description || ""}`).join("; ")
    : ""

  const propsStr = assetProps.length > 0
    ? assetProps.map((p) => `${p.name}: ${p.description || ""}`).join("; ")
    : ""

  const chapterMap = new Map<string, string>()
  for (const ch of novel.chapters) {
    chapterMap.set(ch.id, ch.content)
  }

  let previousContent: string | null = null
  const lastScript = await prisma.script.findFirst({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    select: { content: true },
  })
  if (lastScript?.content) {
    previousContent = lastScript.content
  }

  try {
    for (const episode of targetEpisodes) {
      const scenesJson = JSON.stringify([
        {
          title: episode.title,
          summary: episode.outline ?? "",
          duration: episode.duration,
          characters: null,
          emotion: null,
        },
      ])

      const sourceIds = parseSourceChapterIds(episode)
      const chapterContent = sourceIds
        .map((id) => {
          const text = chapterMap.get(id) || ""
          return text
        })
        .filter(Boolean)
        .join("\n\n---\n\n")

      const scriptContent = await callAIGenerateScript(
        episode.title,
        episode.outline ?? "",
        episode.keyConflict,
        episode.cliffhanger,
        episode.duration,
        scenesJson,
        chapterContent,
        null,
        charactersStr,
        previousContent,
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
          content: scriptContent,
          status: "generated",
        },
      })

      previousContent = scriptContent
    }

    const allScripts = await prisma.script.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
      include: scriptInclude,
    })

    return NextResponse.json({
      scripts: allScripts,
      stats: {
        scriptCount: allScripts.length,
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
      { error: apiError.API_ERRORS.INTERNAL.code, message: "部分分集生成失败", scripts: allScripts },
      { status: apiError.API_ERRORS.INTERNAL.status }
    )
  }
}
