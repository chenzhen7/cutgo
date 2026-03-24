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
  const { chapterIds } = body as { chapterIds: string[] }

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

  // 查询已存在的名称，用于前端标注冲突
  const [existingCharacters, existingScenes, existingProps] = await Promise.all([
    prisma.assetCharacter.findMany({ where: { projectId }, select: { name: true } }),
    prisma.assetScene.findMany({ where: { projectId }, select: { name: true } }),
    prisma.assetProp.findMany({ where: { projectId }, select: { name: true } }),
  ])

  const existingNames = {
    characters: existingCharacters.map((c) => c.name),
    scenes: existingScenes.map((s) => s.name),
    props: existingProps.map((p) => p.name),
  }

  try {
    const aiResult = await callLLMExtractAssetsFromChapters(
      chapters.map((ch) => ({ title: ch.title, content: ch.content }))
    )

    return NextResponse.json({
      characters: aiResult.characters,
      scenes: aiResult.scenes,
      props: aiResult.props,
      existingNames,
    })
  } catch (err) {
    console.error("Asset extraction from chapters failed:", err)
    const message = err instanceof Error ? err.message : String(err)
    if (message === apiError.API_ERRORS.LLM_NOT_CONFIGURED.code) {
      return apiError.llmNotConfigured()
    }
    return apiError.internalError(`资产提取失败：${message}`)
  }
}
