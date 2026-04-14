import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { callLLM } from "@/lib/ai/llm"
import {
  buildExtractAssetsSystemPrompt,
  buildExtractAssetsUserPrompt,
} from "@/lib/prompts"
import { throwCutGoError, withError, CutGoError } from "@/lib/api-error"

interface ExtractedCharacter {
  name: string
  role: "protagonist" | "supporting" | "extra"
  gender?: string
  prompt?: string
}

interface ExtractedScene {
  name: string
  prompt?: string
  tags?: string
}

interface ExtractedProp {
  name: string
  prompt?: string
}

interface AIAssetResult {
  characters: ExtractedCharacter[]
  scenes: ExtractedScene[]
  props: ExtractedProp[]
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

export const POST = withError(async (request: NextRequest) => {
  const body = await request.json()
  const { episodeIds } = body as { episodeIds?: string[] }

  if (!episodeIds || episodeIds.length === 0) {
    throwCutGoError("MISSING_PARAMS", "缺少 episodeIds 参数")
  }

  const episodes = await prisma.episode.findMany({
    where: { id: { in: episodeIds } },
    select: { id: true, rawText: true, projectId: true },
    orderBy: { index: "asc" },
  })

  if (episodes.length === 0) {
    throwCutGoError("NOT_FOUND", "分集不存在")
  }

  const projectId = episodes[0].projectId

  const combinedText = episodes
    .map((ep) => ep.rawText?.trim() ?? "")
    .filter(Boolean)
    .join("\n\n")

  if (!combinedText) {
    throwCutGoError("VALIDATION", "所选分集暂无原文内容")
  }

  try {
    const extractResult = await callLLM({
      messages: [
        { role: "system", content: buildExtractAssetsSystemPrompt() },
        { role: "user", content: buildExtractAssetsUserPrompt(combinedText) },
      ],
    })

    const assets = parseAssetsJSON(extractResult.content)

    const [characters, scenes, props] = await Promise.all([
      prisma.assetCharacter.findMany({
        where: { projectId },
        select: { name: true },
      }),
      prisma.assetScene.findMany({
        where: { projectId },
        select: { name: true },
      }),
      prisma.assetProp.findMany({
        where: { projectId },
        select: { name: true },
      }),
    ])

    return NextResponse.json({
      characters: assets.characters,
      scenes: assets.scenes,
      props: assets.props,
      existingNames: {
        characters: characters.map((c) => c.name),
        scenes: scenes.map((s) => s.name),
        props: props.map((p) => p.name),
      },
    })
  } catch (err) {
    if (err instanceof CutGoError) throw err
    throwCutGoError("LLM_INVALID_RESPONSE", (err as Error).message)
  }
})
