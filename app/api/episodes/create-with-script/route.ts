import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { throwCutGoError, withError, CutGoError } from "@/lib/api-error"
import { countWords } from "@/lib/novel-utils"
import { buildEpisodeAssetData, extractEpisodeAssetIds } from "@/lib/utils"
import { callLLM } from "@/lib/ai/llm"
import {
  buildEpisodeScriptSystemPrompt,
  buildEpisodeScriptUserPrompt,
  buildExtractAssetsSystemPrompt,
  buildExtractAssetsUserPrompt,
} from "@/lib/prompts"
import {
  createRunningAiTask,
  markAiTaskFailed,
  markAiTaskSucceeded,
} from "@/lib/ai-task-service"

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
  const text = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim()

  const parsed = JSON.parse(text)
  return {
    characters: Array.isArray(parsed.characters) ? parsed.characters : [],
    scenes: Array.isArray(parsed.scenes) ? parsed.scenes : [],
    props: Array.isArray(parsed.props) ? parsed.props : [],
  }
}

async function extractAssetsFromRawText(rawText: string) {
  const result = await callLLM({
    messages: [
      { role: "system", content: buildExtractAssetsSystemPrompt() },
      { role: "user", content: buildExtractAssetsUserPrompt(rawText) },
    ],
  })

  return parseAssetsJSON(result.content)
}

async function saveAssetsToEpisode(params: {
  projectId: string
  episodeId: string
  assets: AIAssetResult
}) {
  const { projectId, episodeId, assets } = params

  const [savedCharacters, savedScenes, savedProps] = await Promise.all([
    Promise.all(
      assets.characters.map((character) =>
        prisma.assetCharacter.upsert({
          where: { projectId_name: { projectId, name: character.name } },
          create: {
            projectId,
            name: character.name,
            role: character.role ?? "supporting",
            gender: character.gender ?? null,
            prompt: character.prompt ?? null,
          },
          update: {
            role: character.role ?? "supporting",
            gender: character.gender ?? null,
            prompt: character.prompt ?? null,
          },
        })
      )
    ),
    Promise.all(
      assets.scenes.map((scene) =>
        prisma.assetScene.upsert({
          where: { projectId_name: { projectId, name: scene.name } },
          create: {
            projectId,
            name: scene.name,
            prompt: scene.prompt ?? null,
            tags: scene.tags ?? null,
          },
          update: {
            prompt: scene.prompt ?? null,
            tags: scene.tags ?? null,
          },
        })
      )
    ),
    Promise.all(
      assets.props.map((prop) =>
        prisma.assetProp.upsert({
          where: { projectId_name: { projectId, name: prop.name } },
          create: {
            projectId,
            name: prop.name,
            prompt: prop.prompt ?? null,
          },
          update: {
            prompt: prop.prompt ?? null,
          },
        })
      )
    ),
  ])

  await prisma.$transaction([
    prisma.episodeAsset.deleteMany({ where: { episodeId } }),
    prisma.episodeAsset.createMany({
      data: buildEpisodeAssetData(
        episodeId,
        savedCharacters.map((item) => item.id),
        savedScenes.map((item) => item.id),
        savedProps.map((item) => item.id)
      ),
    }),
  ])

  return {
    characterCount: savedCharacters.length,
    sceneCount: savedScenes.length,
    propCount: savedProps.length,
  }
}

async function generateEpisodeScript(params: {
  projectId: string
  episodeId: string
  episodeTitle: string
  chapterContent: string
  duration: string
  previousContent: string | null
  targetInfo: string
}) {
  const {
    projectId,
    episodeId,
    episodeTitle,
    chapterContent,
    duration,
    previousContent,
    targetInfo,
  } = params

  const task = await createRunningAiTask({
    projectId,
    episodeId,
    targetInfo,
    taskType: "llm_script",
  })

  try {
    const result = await callLLM({
      messages: [
        { role: "system", content: buildEpisodeScriptSystemPrompt() },
        {
          role: "user",
          content: buildEpisodeScriptUserPrompt({
            episodeTitle,
            chapterContent,
            previousContent: previousContent?.slice(-1000) ?? null,
            duration,
          }),
        },
      ],
    })

    const scriptContent = result.content?.trim()
    if (!scriptContent) {
      throwCutGoError("LLM_INVALID_RESPONSE", "LLM 未返回有效剧本内容")
    }

    await prisma.episode.update({
      where: { id: episodeId },
      data: { script: scriptContent },
    })

    await markAiTaskSucceeded(task.id)
  } catch (error) {
    await markAiTaskFailed(task.id, error)
    throw error
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
  const title = rawTitle.trim()
  const chapterContent = rawText.trim()

  const episode = await prisma.episode.create({
    data: {
      projectId,
      index: episodeIndex,
      title,
      rawText: chapterContent,
      wordCount: countWords(chapterContent),
      duration: "3min",
    },
  })

  let assetsExtracted = false
  let scriptGenerated = false
  let warning: string | null = null
  let assetStats = {
    characterCount: 0,
    sceneCount: 0,
    propCount: 0,
  }

  if (extractAssets) {
    try {
      const previousEpisode = await prisma.episode.findFirst({
        where: {
          projectId,
          index: { lt: episodeIndex },
          NOT: { script: "" },
        },
        orderBy: { index: "desc" },
        select: { script: true },
      })

      const assets = await extractAssetsFromRawText(chapterContent)
      assetStats = await saveAssetsToEpisode({
        projectId,
        episodeId: episode.id,
        assets,
      })
      assetsExtracted = true

      await generateEpisodeScript({
        projectId,
        episodeId: episode.id,
        episodeTitle: title,
        chapterContent,
        duration: episode.duration,
        previousContent: previousEpisode?.script?.trim() || null,
        targetInfo: `第${episode.index + 1}集 ${episode.title}`,
      })
      scriptGenerated = true
    } catch (error) {
      warning =
        error instanceof CutGoError
          ? error.message
          : error instanceof Error
          ? error.message
          : "自动提取资产并生成剧本失败"
    }
  }

  const latestEpisode = await prisma.episode.findUnique({
    where: { id: episode.id },
    include: { episodeAssets: true },
  })

  if (!latestEpisode) {
    throwCutGoError("NOT_FOUND", "分集不存在")
  }

  return NextResponse.json(
    {
      episode: {
        ...latestEpisode,
        ...extractEpisodeAssetIds(latestEpisode.episodeAssets),
        episodeAssets: undefined,
      },
      extractAssets: extractAssets ?? false,
      assetsExtracted,
      scriptGenerated,
      assetStats,
      warning,
    },
    { status: 201 }
  )
})
