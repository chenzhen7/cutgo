import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { callLLM } from "@/lib/ai/llm"
import {
  buildExtractAssetsSystemPrompt,
  buildExtractAssetsUserPrompt,
} from "@/lib/prompts"
import { throwCutGoError, withError } from "@/lib/api-error"
import { countWords } from "@/lib/novel-utils"

interface AIAssetResult {
  characters: {
    name: string
    role: "protagonist" | "supporting" | "extra"
    gender?: string
    prompt?: string
  }[]
  scenes: {
    name: string
    prompt?: string
    tags?: string
  }[]
  props: {
    name: string
    prompt?: string
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

export const POST = withError(async (request: NextRequest) => {
  const body = await request.json()
  const {
    projectId,
    title: rawTitle,
    rawText,
    extractAssets,
  } = body as {
    projectId: string
    title?: string
    rawText: string
    extractAssets?: boolean
  }

  if (!projectId) throwCutGoError("MISSING_PARAMS", "projectId is required")
  if (!rawTitle?.trim()) throwCutGoError("VALIDATION", "分集标题不能为空")
  if (!rawText?.trim()) throwCutGoError("VALIDATION", "原文内容不能为空")

  const maxIndex = await prisma.episode.aggregate({
    where: { projectId },
    _max: { index: true },
  })
  const episodeIndex = (maxIndex._max.index ?? -1) + 1

  const defaultTitle = rawTitle.trim()
  const wordCount = countWords(rawText)

  const episode = await prisma.episode.create({
    data: {
      projectId,
      index: episodeIndex,
      title: defaultTitle,
      rawText: rawText.trim(),
      wordCount,
      duration: "3min",
    },
  })

  if (extractAssets) {
    const extractSystemPrompt = buildExtractAssetsSystemPrompt()
    const extractUserPrompt = buildExtractAssetsUserPrompt(rawText.trim())
    const extractResult = await callLLM({
      messages: [
        { role: "system", content: extractSystemPrompt },
        { role: "user", content: extractUserPrompt },
      ],
    })
    const assets = parseAssetsJSON(extractResult.content)
    await Promise.all([
      Promise.all(
        assets.characters.map((c) =>
          prisma.assetCharacter.upsert({
            where: { projectId_name: { projectId, name: c.name } },
            create: {
              projectId,
              name: c.name,
              role: c.role ?? "supporting",
              gender: c.gender ?? null,
              prompt: c.prompt ?? null,
            },
            update: {
              role: c.role ?? "supporting",
              gender: c.gender ?? null,
              prompt: c.prompt ?? null,
            },
          })
        )
      ),
      Promise.all(
        assets.scenes.map((s) =>
          prisma.assetScene.upsert({
            where: { projectId_name: { projectId, name: s.name } },
            create: {
              projectId,
              name: s.name,
              prompt: s.prompt ?? null,
              tags: s.tags ?? null,
            },
            update: {
              prompt: s.prompt ?? null,
              tags: s.tags ?? null,
            },
          })
        )
      ),
      Promise.all(
        assets.props.map((p) =>
          prisma.assetProp.upsert({
            where: { projectId_name: { projectId, name: p.name } },
            create: {
              projectId,
              name: p.name,
              prompt: p.prompt ?? null,
            },
            update: {
              prompt: p.prompt ?? null,
            },
          })
        )
      ),
    ])
  }

  return NextResponse.json({
    episode,
    extractAssets: extractAssets ?? false,
  }, { status: 201 })
})
