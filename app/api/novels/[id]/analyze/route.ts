import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { detectChapters, splitParagraphs, countWords } from "@/lib/novel-utils"

interface AICharacter {
  name: string
  role: "protagonist" | "supporting" | "extra"
  description: string
  firstAppear: string
  frequency: number
  relations: { target: string; relation: string }[]
}

interface AIEvent {
  index: number
  type: "setup" | "rising" | "climax" | "resolution"
  summary: string
  detail: string
  emotion: string
  sourceRef: string
  adaptScore: number
  isHighlight: boolean
}

async function callAIAnalysis(text: string) {
  const apiKey = process.env.OPENAI_API_KEY
  const baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini"

  if (!apiKey) {
    return generateLocalAnalysis(text)
  }

  const prompt = `你是一位专业的影视编剧顾问，擅长将小说文本转化为短剧结构。请分析以下小说文本，返回严格的 JSON 格式结果。

要求分析以下维度：
1. synopsis: 故事大纲（200-500字的精炼摘要）
2. characters: 角色列表，每个角色包含 name, role("protagonist"/"supporting"/"extra"), description, firstAppear, frequency, relations([{target, relation}])
3. events: 剧情事件列表，每个事件包含 index, type("setup"/"rising"/"climax"/"resolution"), summary, detail, emotion(情感标签), sourceRef(对应原文引用), adaptScore(1-5改编价值), isHighlight(是否高潮点)

请严格返回如下 JSON 格式（不要包含 markdown 标记）：
{
  "synopsis": "...",
  "characters": [...],
  "events": [...]
}

小说文本：
${text.slice(0, 15000)}`

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
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    })

    if (!response.ok) {
      console.error("AI API error:", response.status)
      return generateLocalAnalysis(text)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) return generateLocalAnalysis(text)

    const parsed = JSON.parse(content)
    return {
      synopsis: parsed.synopsis || "",
      characters: (parsed.characters || []) as AICharacter[],
      events: (parsed.events || []) as AIEvent[],
    }
  } catch (err) {
    console.error("AI analysis failed, falling back to local:", err)
    return generateLocalAnalysis(text)
  }
}

function generateLocalAnalysis(text: string) {
  const namePatterns = [
    /「([^」]{1,6})」/g,
    /[""]([^""]{1,6})[""]/g,
    /"([^"]{1,6})"/g,
  ]

  const names = new Set<string>()
  for (const pattern of namePatterns) {
    let match
    while ((match = pattern.exec(text)) !== null) {
      if (match[1] && match[1].length >= 2 && match[1].length <= 4) {
        names.add(match[1])
      }
    }
  }

  const frequencyMap = new Map<string, number>()
  const chineseNamePattern = /[\u4e00-\u9fa5]{2,4}/g
  let m
  while ((m = chineseNamePattern.exec(text)) !== null) {
    const word = m[0]
    frequencyMap.set(word, (frequencyMap.get(word) || 0) + 1)
  }

  const potentialCharacters = Array.from(frequencyMap.entries())
    .filter(([, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  const characters: AICharacter[] = potentialCharacters.map(([name, freq], i) => ({
    name,
    role: i < 2 ? "protagonist" : i < 5 ? "supporting" : "extra",
    description: `在文本中出现 ${freq} 次`,
    firstAppear: "第1章",
    frequency: freq,
    relations: [],
  }))

  const totalWords = countWords(text)
  const synopsis = `本文共 ${totalWords} 字。故事涉及${characters.length}个角色${characters.length > 0 ? "，包括" + characters.slice(0, 3).map((c) => c.name).join("、") : ""}。请使用AI分析获取更准确的大纲。`

  const events: AIEvent[] = [
    {
      index: 0,
      type: "setup",
      summary: "故事开篇，背景铺设",
      detail: text.slice(0, 100),
      emotion: "平静",
      sourceRef: text.slice(0, 50),
      adaptScore: 3,
      isHighlight: false,
    },
    {
      index: 1,
      type: "rising",
      summary: "冲突展开",
      detail: text.slice(Math.floor(text.length * 0.3), Math.floor(text.length * 0.3) + 100),
      emotion: "紧张",
      sourceRef: "",
      adaptScore: 4,
      isHighlight: false,
    },
    {
      index: 2,
      type: "climax",
      summary: "故事高潮",
      detail: text.slice(Math.floor(text.length * 0.6), Math.floor(text.length * 0.6) + 100),
      emotion: "激昂",
      sourceRef: "",
      adaptScore: 5,
      isHighlight: true,
    },
    {
      index: 3,
      type: "resolution",
      summary: "故事收束",
      detail: text.slice(Math.max(0, text.length - 100)),
      emotion: "温馨",
      sourceRef: "",
      adaptScore: 3,
      isHighlight: false,
    },
  ]

  return { synopsis, characters, events }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const novel = await prisma.novel.findUnique({ where: { id } })
  if (!novel) {
    return NextResponse.json({ error: "小说不存在" }, { status: 404 })
  }
  if (!novel.rawText || !novel.rawText.trim()) {
    return NextResponse.json({ error: "文本内容为空" }, { status: 400 })
  }

  try {
    await prisma.novel.update({ where: { id }, data: { status: "draft" } })

    await prisma.chapter.deleteMany({ where: { novelId: id } })
    await prisma.novelCharacter.deleteMany({ where: { novelId: id } })
    await prisma.plotEvent.deleteMany({ where: { novelId: id } })

    const detectedChapters = detectChapters(novel.rawText)
    const aiResult = await callAIAnalysis(novel.rawText)

    for (const ch of detectedChapters) {
      const paragraphs = splitParagraphs(ch.content)
      await prisma.chapter.create({
        data: {
          novelId: id,
          index: ch.index,
          title: ch.title,
          content: ch.content,
          wordCount: ch.wordCount,
          paragraphs: {
            create: paragraphs.map((p, i) => ({
              index: i,
              content: p,
              wordCount: countWords(p),
            })),
          },
        },
      })
    }

    for (const char of aiResult.characters) {
      await prisma.novelCharacter.create({
        data: {
          novelId: id,
          name: char.name,
          role: char.role,
          description: char.description,
          firstAppear: char.firstAppear,
          frequency: char.frequency,
          relations: JSON.stringify(char.relations || []),
        },
      })
    }

    for (const evt of aiResult.events) {
      await prisma.plotEvent.create({
        data: {
          novelId: id,
          index: evt.index,
          type: evt.type,
          summary: evt.summary,
          detail: evt.detail,
          emotion: evt.emotion,
          sourceRef: evt.sourceRef,
          adaptScore: evt.adaptScore,
          isHighlight: evt.isHighlight,
        },
      })
    }

    const updated = await prisma.novel.update({
      where: { id },
      data: { synopsis: aiResult.synopsis, status: "analyzed" },
      include: {
        chapters: {
          orderBy: { index: "asc" },
          include: { paragraphs: { orderBy: { index: "asc" } } },
        },
        characters: { orderBy: { frequency: "desc" } },
        events: { orderBy: { index: "asc" } },
      },
    })

    return NextResponse.json({
      ...updated,
      stats: {
        totalWords: novel.wordCount,
        chapterCount: detectedChapters.length,
        characterCount: aiResult.characters.length,
        eventCount: aiResult.events.length,
      },
    })
  } catch (err) {
    console.error("Analysis failed:", err)
    await prisma.novel.update({ where: { id }, data: { status: "draft" } })
    return NextResponse.json(
      { error: "分析失败，请重试" },
      { status: 500 }
    )
  }
}
