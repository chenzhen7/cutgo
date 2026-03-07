import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

interface AIEpisode {
  title: string
  synopsis: string
  keyConflict: string
  cliffhanger: string
  duration: string
  scenes: {
    title: string
    summary: string
    duration: string
    characters: string[]
    emotion: string
  }[]
}

async function callAIGenerateOutline(
  chapterTitle: string,
  chapterContent: string,
  synopsis: string | null,
  characters: string,
  events: string,
  platform: string,
  duration: string,
  previousEpisodeSynopsis: string | null
): Promise<AIEpisode[]> {
  const apiKey = process.env.OPENAI_API_KEY
  const baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini"

  if (!apiKey) {
    return generateLocalOutline(chapterTitle, chapterContent, duration)
  }

  const prompt = `你是一位资深短剧编剧，擅长将小说改编为高留存率的竖屏短剧。

## 任务
请基于以下章节内容，将其拆分为一个或多个短剧分集大纲。

## 当前章节
- 章节标题：${chapterTitle}
- 章节内容：
${chapterContent.slice(0, 12000)}

## 全局上下文（供参考，确保连贯性）
- 故事大纲：${synopsis || "无"}
- 角色列表：${characters || "无"}
- 剧情事件：${events || "无"}
${previousEpisodeSynopsis ? `- 前一章节已生成的最后一集摘要：${previousEpisodeSynopsis}` : ""}

## 目标参数
- 目标平台：${platform}
- 每集时长：${duration}

## 要求
1. 根据章节内容体量合理拆分集数：
   - 短章节（< 2000字）：通常 1 集
   - 中等章节（2000-5000字）：通常 1-3 集
   - 长章节（> 5000字）：通常 2-5 集
2. 每集必须有明确的核心冲突（keyConflict）
3. 每集结尾必须有钩子（cliffhanger），制造悬念
4. 每集拆分为 3-6 个场景
5. 每个场景包含：标题、摘要、预估时长、出场角色、情感标签
6. 场景时长之和应接近每集目标时长
7. 情感标签从以下选项中选择：平静、紧张、悲伤、激昂、温馨、愤怒、震惊、心动、悬疑、冲击、感慨、压抑
8. 如有前一集的摘要，确保本章第一集与之自然衔接

## 输出格式
请严格按以下 JSON 格式输出：

{
  "episodes": [
    {
      "title": "第X集 · 标题",
      "synopsis": "本集剧情摘要...",
      "keyConflict": "核心冲突描述",
      "cliffhanger": "结尾钩子描述",
      "duration": "${duration}",
      "scenes": [
        {
          "title": "场景标题",
          "summary": "场景描述...",
          "duration": "15s",
          "characters": ["角色A", "角色B"],
          "emotion": "紧张"
        }
      ]
    }
  ]
}

注意：不要在 episodes 中包含 index 字段，系统会自动计算全局编号。`

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
      return generateLocalOutline(chapterTitle, chapterContent, duration)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) return generateLocalOutline(chapterTitle, chapterContent, duration)

    const parsed = JSON.parse(content)
    return (parsed.episodes || []) as AIEpisode[]
  } catch (err) {
    console.error("AI outline generation failed, falling back to local:", err)
    return generateLocalOutline(chapterTitle, chapterContent, duration)
  }
}

function generateLocalOutline(
  chapterTitle: string,
  chapterContent: string,
  duration: string
): AIEpisode[] {
  const wordCount = chapterContent.length
  let episodeCount = 1
  if (wordCount > 5000) episodeCount = 3
  else if (wordCount > 2000) episodeCount = 2

  const episodes: AIEpisode[] = []
  for (let i = 0; i < episodeCount; i++) {
    const segStart = Math.floor((chapterContent.length / episodeCount) * i)
    const segEnd = Math.floor((chapterContent.length / episodeCount) * (i + 1))
    const segment = chapterContent.slice(segStart, segEnd)
    const preview = segment.slice(0, 100).replace(/\n/g, " ")

    episodes.push({
      title: `${chapterTitle || "未命名章节"} · 第${i + 1}部分`,
      synopsis: `${preview}...（本地生成，建议配置 AI API Key 获取更好的结果）`,
      keyConflict: "待补充核心冲突",
      cliffhanger: "待补充结尾钩子",
      duration,
      scenes: [
        {
          title: "开场",
          summary: segment.slice(0, 60).replace(/\n/g, " ") + "...",
          duration: "15s",
          characters: [],
          emotion: "平静",
        },
        {
          title: "发展",
          summary: segment.slice(60, 120).replace(/\n/g, " ") + "...",
          duration: "20s",
          characters: [],
          emotion: "紧张",
        },
        {
          title: "高潮",
          summary: segment.slice(120, 180).replace(/\n/g, " ") + "...",
          duration: "15s",
          characters: [],
          emotion: "激昂",
        },
        {
          title: "收尾",
          summary: segment.slice(180, 240).replace(/\n/g, " ") + "...",
          duration: "10s",
          characters: [],
          emotion: "悬疑",
        },
      ],
    })
  }

  return episodes
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { projectId, chapterIds, mode = "skip_existing" } = body

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 })
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) {
    return NextResponse.json({ error: "项目不存在" }, { status: 404 })
  }

  const novel = await prisma.novel.findUnique({
    where: { projectId },
    include: {
      chapters: { orderBy: { index: "asc" } },
      characters: true,
      events: { orderBy: { index: "asc" } },
    },
  })

  if (!novel || novel.status !== "confirmed") {
    return NextResponse.json({ error: "请先完成小说导入并确认" }, { status: 400 })
  }

  let targetChapters = novel.chapters.filter((ch) => ch.selected)
  if (chapterIds?.length) {
    targetChapters = targetChapters.filter((ch) => chapterIds.includes(ch.id))
  }

  if (targetChapters.length === 0) {
    return NextResponse.json({ error: "没有可生成的章节" }, { status: 400 })
  }

  const existingEpisodeChapterIds = new Set(
    (await prisma.episode.findMany({
      where: { projectId },
      select: { chapterId: true },
      distinct: ["chapterId"],
    })).map((e) => e.chapterId)
  )

  let skippedChapters = 0

  if (mode === "skip_existing") {
    const before = targetChapters.length
    targetChapters = targetChapters.filter((ch) => !existingEpisodeChapterIds.has(ch.id))
    skippedChapters = before - targetChapters.length
  } else if (mode === "overwrite") {
    const overwriteIds = targetChapters
      .filter((ch) => existingEpisodeChapterIds.has(ch.id))
      .map((ch) => ch.id)
    if (overwriteIds.length > 0) {
      await prisma.episode.deleteMany({
        where: { projectId, chapterId: { in: overwriteIds } },
      })
    }
  }

  const charactersStr = novel.characters.map((c) => `${c.name}(${c.role}): ${c.description || ""}`).join("; ")
  const eventsStr = novel.events.map((e) => `[${e.type}] ${e.summary}`).join("; ")

  let previousEpisodeSynopsis: string | null = null
  const lastExisting = await prisma.episode.findFirst({
    where: { projectId },
    orderBy: { index: "desc" },
  })
  if (lastExisting) {
    previousEpisodeSynopsis = lastExisting.synopsis
  }

  try {
    for (const chapter of targetChapters) {
      const aiEpisodes = await callAIGenerateOutline(
        chapter.title || `第${chapter.index + 1}章`,
        chapter.content,
        novel.synopsis,
        charactersStr,
        eventsStr,
        project.platform,
        project.duration,
        previousEpisodeSynopsis
      )

      for (const ep of aiEpisodes) {
        const maxIdx = await prisma.episode.aggregate({
          where: { projectId },
          _max: { index: true },
        })
        const nextIdx = (maxIdx._max.index ?? 0) + 1

        const created = await prisma.episode.create({
          data: {
            projectId,
            chapterId: chapter.id,
            index: nextIdx,
            title: ep.title,
            synopsis: ep.synopsis,
            keyConflict: ep.keyConflict || null,
            cliffhanger: ep.cliffhanger || null,
            duration: ep.duration || project.duration,
            scenes: {
              create: (ep.scenes || []).map((s, si) => ({
                index: si,
                title: s.title,
                summary: s.summary,
                duration: s.duration || "15s",
                characters: JSON.stringify(s.characters || []),
                emotion: s.emotion || null,
              })),
            },
          },
        })

        previousEpisodeSynopsis = created.synopsis
      }
    }

    const allEpisodes = await prisma.episode.findMany({
      where: { projectId },
      orderBy: [{ index: "asc" }, { createdAt: "asc" }],
      include: {
        chapter: { select: { id: true, index: true, title: true } },
        scenes: { orderBy: { index: "asc" } },
      },
    })

    const allScenes = allEpisodes.flatMap((ep) => ep.scenes)
    const allCharacters = new Set<string>()
    for (const s of allScenes) {
      try {
        const chars = JSON.parse(s.characters || "[]")
        for (const c of chars) allCharacters.add(c)
      } catch { /* ignore */ }
    }

    const totalDuration = allEpisodes.reduce((sum, ep) => sum + parseInt(ep.duration) || 0, 0)

    return NextResponse.json({
      episodes: allEpisodes,
      stats: {
        episodeCount: allEpisodes.length,
        totalScenes: allScenes.length,
        totalDuration: `${totalDuration}s`,
        characterCount: allCharacters.size,
        generatedChapters: targetChapters.length,
        skippedChapters,
      },
    })
  } catch (err) {
    console.error("Outline generation failed:", err)
    const allEpisodes = await prisma.episode.findMany({
      where: { projectId },
      orderBy: [{ index: "asc" }, { createdAt: "asc" }],
      include: {
        chapter: { select: { id: true, index: true, title: true } },
        scenes: { orderBy: { index: "asc" } },
      },
    })
    return NextResponse.json(
      {
        error: "部分章节生成失败",
        episodes: allEpisodes,
      },
      { status: 500 }
    )
  }
}
