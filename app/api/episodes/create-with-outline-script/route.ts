import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { callLLM } from "@/lib/ai/llm"
import {
  buildEpisodeOutlineSystemPrompt,
  buildEpisodeOutlineUserPrompt,
  buildEpisodeScriptSystemPrompt,
  buildEpisodeScriptUserPrompt,
  buildExtractAssetsSystemPrompt,
  buildExtractAssetsUserPrompt,
} from "@/lib/prompts"
import { CutGoError, throwCutGoError, withError } from "@/lib/api-error"
import { createRunningAiTask, markAiTaskFailed, markAiTaskSucceeded } from "@/lib/ai-task-service"
import type { AssetsSummary } from "@/lib/prompts/episode-outline"
import { countWords } from "@/lib/novel-utils"

interface OutlineResult {
  title?: string
  summary?: string
  core_conflict?: string
  goldenHook?: string
  cliffhanger?: string
}

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

function parseOutlineJSON(raw: string): OutlineResult {
  let text = raw.trim()
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim()
  // 如果是数组，取第一个元素
  if (text.startsWith("[")) {
    const arr = JSON.parse(text)
    return Array.isArray(arr) && arr.length > 0 ? arr[0] : {}
  }
  return JSON.parse(text)
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

  // 计算分集序号
  const maxIndex = await prisma.episode.aggregate({
    where: { projectId },
    _max: { index: true },
  })
  const episodeIndex = (maxIndex._max.index ?? -1) + 1

  const defaultTitle = rawTitle.trim()
  const wordCount = countWords(rawText)

  // 加载资产用于大纲 prompt
  const [characters, scenes, props] = await Promise.all([
    prisma.assetCharacter.findMany({
      where: { projectId },
      select: { id: true, name: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.assetScene.findMany({
      where: { projectId },
      select: { id: true, name: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.assetProp.findMany({
      where: { projectId },
      select: { id: true, name: true },
      orderBy: { createdAt: "asc" },
    }),
  ])

  // ── 步骤1：先创建分集（带原文） ──
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

  // ── 步骤2：生成大纲 ──
  const outlineTask = await createRunningAiTask({
    projectId,
    episodeId: episode.id,
    targetInfo: `第${episodeIndex + 1}集 ${defaultTitle}`,
    taskType: "llm_outline",
  })

  let outlineResult: OutlineResult = {}
  try {
    const assetsSummary: AssetsSummary = { characters, scenes, props }
    const systemPrompt = buildEpisodeOutlineSystemPrompt({ assets: assetsSummary })
    const userPrompt = buildEpisodeOutlineUserPrompt(rawText.trim())

    const result = await callLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    })
    outlineResult = parseOutlineJSON(result.content)
    await markAiTaskSucceeded(outlineTask.id)
  } catch (err) {
    await markAiTaskFailed(outlineTask.id, err)
    if (err instanceof CutGoError) throw err
    throwCutGoError("LLM_INVALID_RESPONSE", (err as Error).message)
  }

  // 将大纲写入分集
  const episodeTitle = outlineResult.title?.trim() || defaultTitle
  await prisma.episode.update({
    where: { id: episode.id },
    data: {
      title: episodeTitle,
      outline: outlineResult.summary || null,
      goldenHook: outlineResult.goldenHook || null,
      keyConflict: outlineResult.core_conflict || null,
      cliffhanger: outlineResult.cliffhanger || null,
    },
  })

  // ── 步骤3：生成剧本 ──
  const scriptTask = await createRunningAiTask({
    projectId,
    episodeId: episode.id,
    targetInfo: `第${episodeIndex + 1}集 ${episodeTitle}`,
    taskType: "llm_script",
  })

  let scriptContent = ""
  try {
    const systemPrompt = buildEpisodeScriptSystemPrompt()
    const userPrompt = buildEpisodeScriptUserPrompt({
      episodeTitle,
      episodeSynopsis: outlineResult.summary ?? "",
      keyConflict: outlineResult.core_conflict ?? null,
      cliffhanger: outlineResult.cliffhanger ?? null,
      chapterContent: rawText.trim(),
      previousContent: null,
      duration: "3min",
    })

    const result = await callLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    })

    if (!result.content?.trim()) {
      throwCutGoError("LLM_INVALID_RESPONSE", "LLM 未返回有效剧本内容")
    }
    scriptContent = result.content.trim()
    await markAiTaskSucceeded(scriptTask.id)
  } catch (err) {
    await markAiTaskFailed(scriptTask.id, err)
    if (err instanceof CutGoError) throw err
    throwCutGoError("LLM_INVALID_RESPONSE", (err as Error).message)
  }

  // 将剧本写入分集
  const finalEpisode = await prisma.episode.update({
    where: { id: episode.id },
    data: { script: scriptContent },
  })

  // ── 步骤4：按需提取并保存资产（自动覆盖同名） ──
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
    episode: finalEpisode,
    extractAssets: extractAssets ?? false,
  }, { status: 201 })
})
