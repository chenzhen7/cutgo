import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

async function callAIGenerateOutline(
  chapterTitle: string | null,
  chapterIndex: number,
  chapterContent: string,
  episodeIndex: number,
  episodeTitle: string,
  totalEpisodesInChapter: number,
  novelSynopsis: string | null,
  characters: string
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  const baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini"

  if (!apiKey) {
    return generateLocalOutline(episodeTitle, chapterContent)
  }

  const chapterLabel = chapterTitle?.trim()
    ? `第${chapterIndex}章 ${chapterTitle}`
    : `第${chapterIndex}章`

  const prompt = `你是一位资深短剧编剧，擅长将小说章节拆分成结构紧凑的分集大纲。

## 任务
请为「${chapterLabel}」拆分出的第${episodeIndex}集（共${totalEpisodesInChapter}集）撰写分集大纲。

## 分集信息
- 分集标题：${episodeTitle}
- 本集为该章节第 ${episodeIndex}/${totalEpisodesInChapter} 集

## 章节原文（节选）
${chapterContent.slice(0, 6000)}

## 全局信息
- 故事梗概：${novelSynopsis || "无"}
- 角色列表：${characters || "无"}

## 要求
1. 大纲需清晰描述本集的主要剧情走向、核心冲突与情绪弧线
2. 语言简洁有力，200~400字以内
3. 说明本集开头承接、结尾钩子（cliffhanger）
4. 直接输出大纲文本，不要包含标题或额外格式`

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
        temperature: 0.5,
      }),
    })

    if (!response.ok) {
      console.error("AI API error:", response.status)
      return generateLocalOutline(episodeTitle, chapterContent)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) return generateLocalOutline(episodeTitle, chapterContent)

    return content.trim()
  } catch (err) {
    console.error("AI outline generation failed, falling back to local:", err)
    return generateLocalOutline(episodeTitle, chapterContent)
  }
}

function generateLocalOutline(episodeTitle: string, chapterContent: string): string {
  const preview = chapterContent.slice(0, 120).replace(/\n/g, " ")
  return `本集以"${episodeTitle}"为核心展开。${preview}…\n（本地占位大纲，建议配置 AI API Key 获取正式内容。）`
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { projectId, episodeIds } = body

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 })
  }

  const novel = await prisma.novel.findUnique({
    where: { projectId },
    include: {
      characters: true,
      chapters: { orderBy: { index: "asc" } },
    },
  })

  if (!novel) {
    return NextResponse.json({ error: "请先导入小说并解析章节" }, { status: 400 })
  }

  const chapterMap = new Map(novel.chapters.map((c) => [c.id, c]))

  let targetEpisodes = await prisma.episode.findMany({
    where: {
      projectId,
      ...(episodeIds?.length ? { id: { in: episodeIds } } : {}),
    },
    orderBy: [{ index: "asc" }],
    include: {
      chapter: { select: { id: true, index: true, title: true } },
    },
  })

  if (targetEpisodes.length === 0) {
    return NextResponse.json({ error: "没有可生成大纲的分集" }, { status: 400 })
  }

  const charactersStr = novel.characters.length > 0
    ? novel.characters
      .map((c) => `${c.name}(${c.role}): ${c.description || ""}`)
      .join("; ")
    : ""

  // Group episodes by chapter to know episode position within chapter
  const byChapter = new Map<string, typeof targetEpisodes>()
  for (const ep of targetEpisodes) {
    if (!byChapter.has(ep.chapterId)) byChapter.set(ep.chapterId, [])
    byChapter.get(ep.chapterId)!.push(ep)
  }

  const updatedEpisodes = []

  for (const [chapterId, eps] of byChapter) {
    const chapter = chapterMap.get(chapterId)
    if (!chapter) continue

    const sorted = [...eps].sort((a, b) => a.index - b.index)

    for (let i = 0; i < sorted.length; i++) {
      const ep = sorted[i]
      const outline = await callAIGenerateOutline(
        ep.chapter.title,
        ep.chapter.index,
        chapter.content,
        i + 1,
        ep.title,
        sorted.length,
        novel.synopsis,
        charactersStr
      )

      const updated = await prisma.episode.update({
        where: { id: ep.id },
        data: { outline },
        include: {
          chapter: { select: { id: true, index: true, title: true } },
          scenes: { orderBy: { index: "asc" } },
        },
      })

      updatedEpisodes.push(updated)
    }
  }

  return NextResponse.json({
    episodes: updatedEpisodes,
    stats: { generatedCount: updatedEpisodes.length },
  })
}
