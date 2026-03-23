import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { callLLM } from "@/lib/ai/llm"
import { buildExtractAssetsPrompt } from "@/lib/prompts"
import * as apiError from "@/lib/api-error"

interface AIAssetResult {
  characters: {
    name: string
    role: "protagonist" | "supporting" | "extra"
    gender?: string
    description?: string
    personality?: string
  }[]
  scenes: {
    name: string
    description?: string
    tags?: string
  }[]
  props: {
    name: string
    description?: string
  }[]
}

function parseAssetsJSON(raw: string): AIAssetResult {
  let text = raw.trim()
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim()
  const parsed = JSON.parse(text)
  return {
    characters: Array.isArray(parsed.characters) ? parsed.characters : [],
    scenes: Array.isArray(parsed.scenes) ? parsed.scenes : [],
    props: Array.isArray(parsed.props) ? parsed.props : [],
  }
}

async function callLLMExtractAssetsFromChapters(
  chapters: { title: string | null; content: string }[]
): Promise<AIAssetResult> {
  const chaptersText = chapters
    .map((ch, i) => `【第${i + 1}章${ch.title ? ` ${ch.title}` : ""}】\n${ch.content.slice(0, 3000)}`)
    .join("\n\n---\n\n")

  const prompt = buildExtractAssetsPrompt(chaptersText)

  const result = await callLLM({
    messages: [{ role: "user", content: prompt }],
  })

  return parseAssetsJSON(result.content)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: novelId } = await params
  const body = await request.json()
  const { chapterIds, mode = "skip_existing" } = body as {
    chapterIds: string[]
    mode?: "skip_existing" | "overwrite"
  }

  if (!chapterIds || chapterIds.length === 0) {
    return apiError.validationError("请至少选择一个章节")
  }

  const novel = await prisma.novel.findUnique({
    where: { id: novelId },
    select: { id: true, projectId: true },
  })
  if (!novel) {
    return apiError.notFound("小说不存在")
  }

  const { projectId } = novel

  const chapters = await prisma.chapter.findMany({
    where: { id: { in: chapterIds }, novelId },
    orderBy: { index: "asc" },
    select: { id: true, title: true, content: true, index: true },
  })

  if (chapters.length === 0) {
    return apiError.validationError("未找到指定章节")
  }

  if (mode === "overwrite") {
    await Promise.all([
      prisma.assetCharacter.deleteMany({ where: { projectId } }),
      prisma.assetScene.deleteMany({ where: { projectId } }),
      prisma.assetProp.deleteMany({ where: { projectId } }),
    ])
  } else {
    const counts = await Promise.all([
      prisma.assetCharacter.count({ where: { projectId } }),
      prisma.assetScene.count({ where: { projectId } }),
      prisma.assetProp.count({ where: { projectId } }),
    ])
    if (counts.reduce((a, b) => a + b, 0) > 0) {
      const [characters, scenes, props] = await Promise.all([
        prisma.assetCharacter.findMany({ where: { projectId }, orderBy: { createdAt: "asc" } }),
        prisma.assetScene.findMany({ where: { projectId }, orderBy: { createdAt: "asc" } }),
        prisma.assetProp.findMany({ where: { projectId }, orderBy: { createdAt: "asc" } }),
      ])
      return NextResponse.json({
        characters,
        scenes,
        props,
        stats: {
          characterCount: characters.length,
          sceneCount: scenes.length,
          propCount: props.length,
        },
        skipped: true,
      })
    }
  }

  try {
    const aiResult = await callLLMExtractAssetsFromChapters(
      chapters.map((ch) => ({ title: ch.title, content: ch.content }))
    )

    const createdCharacters = await Promise.all(
      aiResult.characters.map((c) =>
        prisma.assetCharacter.upsert({
          where: { projectId_name: { projectId, name: c.name } },
          create: {
            projectId,
            name: c.name,
            role: c.role || "supporting",
            gender: c.gender || null,
            description: c.description || null,
            personality: c.personality || null,
          },
          update: {
            role: c.role || "supporting",
            gender: c.gender || null,
            description: c.description || null,
            personality: c.personality || null,
          },
        })
      )
    )

    const createdScenes = await Promise.all(
      aiResult.scenes.map((s) =>
        prisma.assetScene.create({
          data: {
            projectId,
            name: s.name,
            description: s.description || null,
            tags: s.tags || null,
          },
        })
      )
    )

    const createdProps = await Promise.all(
      aiResult.props.map((p) =>
        prisma.assetProp.create({
          data: {
            projectId,
            name: p.name,
            description: p.description || null,
          },
        })
      )
    )

    return NextResponse.json({
      characters: createdCharacters,
      scenes: createdScenes,
      props: createdProps,
      stats: {
        characterCount: createdCharacters.length,
        sceneCount: createdScenes.length,
        propCount: createdProps.length,
      },
    })
  } catch (err) {
    console.error("Asset extraction from chapters failed:", err)
    const message = (err as Error).message
    if (message === apiError.ERR_LLM_NOT_CONFIGURED) {
      return apiError.llmNotConfigured()
    }
    return apiError.internalError("资产提取失败", message)
  }
}
