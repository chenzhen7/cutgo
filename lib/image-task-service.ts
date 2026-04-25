import { prisma } from "@/lib/db"
import { callImage } from "@/lib/ai/image"
import {
  createRunningAiTask,
  markAiTaskFailed,
  markAiTaskSucceeded,
  toErrorInfo,
} from "@/lib/ai-task-service"
import { throwCutGoError } from "@/lib/api-error"
import { getStylePresetDescription } from "@/lib/types"
import { buildMultiGridPrompt, buildImagePrompt } from "@/app/api/images/prompt-utils"
import {
  ASSET_CHARACTER_TURNAROUND_IMAGE_PROMPT,
  buildAssetCharacterImagePrompt,
  buildAssetPropImagePrompt,
  buildAssetSceneImagePrompt,
} from "@/lib/prompts/asset-image"
import { extractShotAssetIds } from "@/lib/utils"

export type ImageStatus = "idle" | "generating" | "completed" | "error"
export type ShotImageType = "keyframe" | "first_last" | "multi_grid"
export type AssetType = "character" | "scene" | "prop"

type SubmitShotImageInput = {
  shotId: string
  imageType?: ShotImageType
  content?: string
  prompt?: string
  promptEnd?: string
  gridPrompts?: string[]
  gridLayout?: string
  negativePrompt?: string
  referenceImages?: string[]
  refLabels?: string[]
  refImageNote?: string
}

type SerializableShot = Awaited<ReturnType<typeof getSerializedShot>>

const ASSET_SIZE_MAP: Record<AssetType, { aspectRatio: string; resolution: string }> = {
  character: { aspectRatio: "1:1", resolution: "1024x1024" },
  scene: { aspectRatio: "3:2", resolution: "1080x1920" },
  prop: { aspectRatio: "1:1", resolution: "512x512" },
}

const ASSET_TYPE_LABEL: Record<AssetType, string> = {
  character: "角色",
  scene: "场景",
  prop: "道具",
}

async function getSerializedShot(shotId: string) {
  const shot = await prisma.shot.findUnique({
    where: { id: shotId },
    include: { shotAssets: true },
  })

  if (!shot) {
    throwCutGoError("NOT_FOUND", "Shot not found")
  }

  return {
    ...shot,
    ...extractShotAssetIds(shot.shotAssets),
    shotAssets: undefined,
  }
}

function detachTask(task: Promise<unknown>) {
  void task.catch((error) => {
    console.error("[image-task] background task failed", error)
  })
}

async function findAsset(type: AssetType, id: string) {
  if (type === "character") {
    const asset = await prisma.assetCharacter.findUnique({
      where: { id },
      include: { project: { select: { stylePreset: true } } },
    })
    if (!asset) throwCutGoError("NOT_FOUND", "角色不存在")
    return asset
  }

  if (type === "scene") {
    const asset = await prisma.assetScene.findUnique({
      where: { id },
      include: { project: { select: { stylePreset: true } } },
    })
    if (!asset) throwCutGoError("NOT_FOUND", "场景不存在")
    return asset
  }

  const asset = await prisma.assetProp.findUnique({
    where: { id },
    include: { project: { select: { stylePreset: true } } },
  })
  if (!asset) throwCutGoError("NOT_FOUND", "道具不存在")
  return asset
}

async function updateAssetGeneratingState(type: AssetType, id: string, taskId: string) {
  const data = {
    imageUrl: null,
    imageStatus: "generating" as const,
    imageTaskId: taskId,
    imageErrorMessage: null,
  }

  if (type === "character") {
    return prisma.assetCharacter.update({ where: { id }, data })
  }
  if (type === "scene") {
    return prisma.assetScene.update({ where: { id }, data })
  }
  return prisma.assetProp.update({ where: { id }, data })
}

async function markAssetCompleted(type: AssetType, id: string, taskId: string, imageUrl: string) {
  const data = {
    imageUrl,
    imageStatus: "completed" as const,
    imageTaskId: taskId,
    imageErrorMessage: null,
  }

  if (type === "character") {
    await prisma.assetCharacter.update({ where: { id }, data })
    return
  }
  if (type === "scene") {
    await prisma.assetScene.update({ where: { id }, data })
    return
  }
  await prisma.assetProp.update({ where: { id }, data })
}

async function markAssetErrored(type: AssetType, id: string, taskId: string, error: unknown) {
  const { message } = toErrorInfo(error)
  const data = {
    imageStatus: "error" as const,
    imageTaskId: taskId,
    imageErrorMessage: message,
  }

  if (type === "character") {
    await prisma.assetCharacter.update({ where: { id }, data })
    return
  }
  if (type === "scene") {
    await prisma.assetScene.update({ where: { id }, data })
    return
  }
  await prisma.assetProp.update({ where: { id }, data })
}

async function executeAssetImageTask(input: {
  taskId: string
  type: AssetType
  id: string
  projectId: string
  prompt: string
  aspectRatio: string
  resolution: string
  stylePreset?: string | null
}) {
  try {
    const basePrompt =
      input.type === "character"
        ? buildAssetCharacterImagePrompt(input.prompt)
        : input.type === "scene"
          ? buildAssetSceneImagePrompt(input.prompt)
          : buildAssetPropImagePrompt(input.prompt)

    const styleText = input.stylePreset
      ? `${input.stylePreset}，${getStylePresetDescription(input.stylePreset)}`
      : null
    const finalPrompt = styleText ? `${basePrompt}，${styleText}` : basePrompt

    const result = await callImage({
      prompt: finalPrompt,
      projectId: input.projectId,
      scope: "asset",
      aspectRatio: input.aspectRatio,
      resolution: input.resolution,
    })

    const firstImageUrl = Array.isArray(result) ? result[0].url : result.url

    const imageUrl =
      input.type === "character"
        ? await (async () => {
            const turnaroundResult = await callImage({
              prompt: ASSET_CHARACTER_TURNAROUND_IMAGE_PROMPT,
              projectId: input.projectId,
              scope: "asset",
              referenceImages: [firstImageUrl],
              aspectRatio: input.aspectRatio,
              resolution: input.resolution,
            })
            return Array.isArray(turnaroundResult) ? turnaroundResult[0].url : turnaroundResult.url
          })()
        : firstImageUrl

    await markAssetCompleted(input.type, input.id, input.taskId, imageUrl)
    await markAiTaskSucceeded(input.taskId)
  } catch (error) {
    await markAssetErrored(input.type, input.id, input.taskId, error)
    await markAiTaskFailed(input.taskId, error)
  }
}

async function markShotCompleted(
  shotId: string,
  taskId: string,
  data: { imageUrl: string; lastFrameUrl: string | null; imageType: ShotImageType }
) {
  await prisma.shot.update({
    where: { id: shotId },
    data: {
      imageUrl: data.imageUrl,
      lastFrameUrl: data.lastFrameUrl,
      imageType: data.imageType,
      imageStatus: "completed",
      imageTaskId: taskId,
      imageErrorMessage: null,
    },
  })
}

async function markShotErrored(shotId: string, taskId: string, error: unknown) {
  const { message } = toErrorInfo(error)
  await prisma.shot.update({
    where: { id: shotId },
    data: {
      imageStatus: "error",
      imageTaskId: taskId,
      imageErrorMessage: message,
    },
  })
}

async function executeShotImageTask(input: {
  taskId: string
  shotId: string
  projectId: string
  aspectRatio: string
  resolution: string
  stylePreset?: string | null
  imageType: ShotImageType
  content: string | null
  prompt: string
  promptEnd: string | null
  gridLayout: string | null
  gridPrompts: string[]
  negativePrompt: string | null
  referenceImages?: string[]
  refLabels?: string[]
  referenceImageNote?: string
}) {
  try {
    if (input.imageType === "keyframe") {
      const generatedPrompt = buildImagePrompt(input.content, input.prompt, input.refLabels, input.stylePreset)
      const result = await callImage({
        prompt: generatedPrompt,
        projectId: input.projectId,
        scope: "shot",
        negativePrompt: input.negativePrompt ?? undefined,
        aspectRatio: input.aspectRatio,
        resolution: input.resolution,
        referenceImages: input.referenceImages,
        referenceImageNote: input.referenceImageNote,
      })
      const imageUrl = Array.isArray(result) ? result[0].url : result.url
      await markShotCompleted(input.shotId, input.taskId, {
        imageUrl,
        lastFrameUrl: null,
        imageType: "keyframe",
      })
      await markAiTaskSucceeded(input.taskId)
      return
    }

    if (input.imageType === "first_last") {
      const promptStart = buildImagePrompt(input.content, input.prompt, input.refLabels, input.stylePreset)
      const promptEnd = buildImagePrompt(input.content, input.promptEnd, input.refLabels, input.stylePreset)
      const [startResult, endResult] = await Promise.all([
        callImage({
          prompt: promptStart,
          projectId: input.projectId,
          scope: "shot",
          negativePrompt: input.negativePrompt ?? undefined,
          aspectRatio: input.aspectRatio,
          resolution: input.resolution,
          referenceImages: input.referenceImages,
          referenceImageNote: input.referenceImageNote,
        }),
        callImage({
          prompt: promptEnd,
          projectId: input.projectId,
          scope: "shot",
          negativePrompt: input.negativePrompt ?? undefined,
          aspectRatio: input.aspectRatio,
          resolution: input.resolution,
          referenceImages: input.referenceImages,
          referenceImageNote: input.referenceImageNote,
        }),
      ])

      const firstUrl = Array.isArray(startResult) ? startResult[0].url : startResult.url
      const lastUrl = Array.isArray(endResult) ? endResult[0].url : endResult.url

      await markShotCompleted(input.shotId, input.taskId, {
        imageUrl: firstUrl,
        lastFrameUrl: lastUrl,
        imageType: "first_last",
      })
      await markAiTaskSucceeded(input.taskId)
      return
    }

    const combinedPrompt = buildMultiGridPrompt(
      input.content,
      input.gridPrompts,
      input.gridLayout,
      input.refLabels,
      input.stylePreset
    )
    const result = await callImage({
      prompt: combinedPrompt,
      projectId: input.projectId,
      scope: "shot",
      negativePrompt: input.negativePrompt ?? undefined,
      aspectRatio: input.aspectRatio,
      resolution: input.resolution,
      referenceImages: input.referenceImages,
      referenceImageNote: input.referenceImageNote,
    })
    const imageUrl = Array.isArray(result) ? result[0].url : result.url

    await markShotCompleted(input.shotId, input.taskId, {
      imageUrl,
      lastFrameUrl: null,
      imageType: "multi_grid",
    })
    await markAiTaskSucceeded(input.taskId)
  } catch (error) {
    await markShotErrored(input.shotId, input.taskId, error)
    await markAiTaskFailed(input.taskId, error)
  }
}

export async function submitShotImageTask(input: SubmitShotImageInput): Promise<{
  shot: SerializableShot
  taskId: string
}> {
  const shot = await prisma.shot.findUnique({
    where: { id: input.shotId },
    include: {
      episode: {
        select: {
          id: true,
          projectId: true,
          index: true,
          title: true,
          project: {
            select: {
              name: true,
              aspectRatio: true,
              resolution: true,
              stylePreset: true,
            },
          },
        },
      },
    },
  })

  if (!shot) {
    throwCutGoError("NOT_FOUND", "Shot not found")
  }

  const imageType = input.imageType ?? (shot.imageType as ShotImageType) ?? "keyframe"
  const content = input.content ?? shot.content
  const prompt = input.prompt ?? shot.prompt
  const promptEnd = input.promptEnd ?? shot.promptEnd
  const gridLayout = input.gridLayout ?? shot.gridLayout
  const negativePrompt = input.negativePrompt ?? shot.negativePrompt
  const gridPrompts = input.gridPrompts ?? (() => {
    try {
      return shot.gridPrompts ? (JSON.parse(shot.gridPrompts) as string[]) : []
    } catch {
      return []
    }
  })()

  // 用户自定义参考图
  const refImageUrls: string[] = input.referenceImages ?? (() => {
    try {
      return shot.refImageUrls ? (JSON.parse(shot.refImageUrls) as string[]) : []
    } catch {
      return []
    }
  })()
  const refImageNote = input.refImageNote ?? shot.refImageNote

  if (imageType !== "multi_grid" && !prompt) {
    throwCutGoError("MISSING_PARAMS", "prompt is required")
  }
  if (imageType === "first_last" && !promptEnd) {
    throwCutGoError("VALIDATION", "promptEnd is required for first_last type")
  }
  if (imageType === "multi_grid" && gridPrompts.length === 0) {
    throwCutGoError("VALIDATION", "gridPrompts are required for multi_grid type")
  }

  const task = await createRunningAiTask({
    projectId: shot.episode.projectId,
    episodeId: shot.episode.id,
    shotId: shot.id,
    targetInfo: `第 ${shot.episode.index + 1} 集 ${shot.episode.title} 分镜 ${shot.index + 1}`,
    taskType: "image_generate",
  })

  // 如果有旧图片，保存到历史记录
  const newImageHistory = shot.imageUrl
    ? JSON.stringify([
        {
          url: shot.imageUrl,
          lastFrameUrl: shot.lastFrameUrl,
          createdAt: new Date().toISOString(),
        },
        ...(shot.imageHistory ? JSON.parse(shot.imageHistory) : []),
      ])
    : shot.imageHistory

  await prisma.shot.update({
    where: { id: shot.id },
    data: {
      content,
      prompt,
      promptEnd,
      negativePrompt,
      imageType,
      gridLayout,
      gridPrompts: imageType === "multi_grid" ? JSON.stringify(gridPrompts) : input.gridPrompts !== undefined ? null : shot.gridPrompts,
      imageUrl: null,
      lastFrameUrl: null,
      imageStatus: "generating",
      imageTaskId: task.id,
      imageErrorMessage: null,
      imageHistory: newImageHistory,
      ...(input.refImageNote !== undefined ? { refImageNote: input.refImageNote } : {}),
    },
  })

  detachTask(
    executeShotImageTask({
      taskId: task.id,
      shotId: shot.id,
      projectId: shot.episode.projectId,
      aspectRatio: shot.episode.project.aspectRatio,
      resolution: shot.episode.project.resolution,
      stylePreset: shot.episode.project.stylePreset,
      imageType,
      content,
      prompt,
      promptEnd,
      gridLayout,
      gridPrompts,
      negativePrompt,
      referenceImages: refImageUrls.length > 0 ? refImageUrls : input.referenceImages,
      refLabels: input.refLabels,
      referenceImageNote: refImageNote ?? undefined,
    })
  )

  return {
    shot: await getSerializedShot(shot.id),
    taskId: task.id,
  }
}

export async function submitBatchShotImageTasks(input: {
  projectId: string
  episodeId?: string | null
  mode?: "all" | "missing_only"
  shotIds?: string[]
}) {
  const project = await prisma.project.findUnique({ where: { id: input.projectId } })
  if (!project) {
    throwCutGoError("NOT_FOUND", "Project not found")
  }

  const where: Record<string, unknown> = { episode: { projectId: input.projectId } }
  if (input.episodeId) where.episodeId = input.episodeId

  if (input.shotIds && input.shotIds.length > 0) {
    where.id = { in: input.shotIds }
  } else if ((input.mode ?? "missing_only") === "missing_only") {
    where.imageUrl = null
  }

  const shots = await prisma.shot.findMany({
    where,
    orderBy: [{ episodeId: "asc" }, { index: "asc" }],
    include: { shotAssets: true },
  })

  const characterIds = new Set<string>()
  const sceneIds = new Set<string>()
  const propIds = new Set<string>()

  for (const shot of shots) {
    for (const sa of shot.shotAssets) {
      if (sa.assetType === "character") characterIds.add(sa.assetId)
      else if (sa.assetType === "scene") sceneIds.add(sa.assetId)
      else if (sa.assetType === "prop") propIds.add(sa.assetId)
    }
  }

  const [characters, scenes, props] = await Promise.all([
    prisma.assetCharacter.findMany({
      where: { id: { in: Array.from(characterIds) } },
      select: { id: true, name: true, imageUrl: true },
    }),
    prisma.assetScene.findMany({
      where: { id: { in: Array.from(sceneIds) } },
      select: { id: true, name: true, imageUrl: true },
    }),
    prisma.assetProp.findMany({
      where: { id: { in: Array.from(propIds) } },
      select: { id: true, name: true, imageUrl: true },
    }),
  ])

  const characterMap = new Map(characters.map((c) => [c.id, c]))
  const sceneMap = new Map(scenes.map((s) => [s.id, s]))
  const propMap = new Map(props.map((p) => [p.id, p]))

  const submitted: { shotId: string; taskId: string }[] = []
  const skipped: { shotId: string; reason: string }[] = []

  for (const shot of shots) {
    if (shot.imageStatus === "generating") {
      skipped.push({ shotId: shot.id, reason: "already_generating" })
      continue
    }

    const assetIds = extractShotAssetIds(shot.shotAssets)

    // 校验关联资产图片是否齐全（与单张生成保持一致）
    const missingAssetNames: string[] = []
    for (const cid of assetIds.characterIds) {
      const c = characterMap.get(cid)
      if (!c?.imageUrl) missingAssetNames.push(`角色「${c?.name ?? "未知"}」`)
    }
    if (assetIds.sceneId) {
      const s = sceneMap.get(assetIds.sceneId)
      if (!s?.imageUrl) missingAssetNames.push(`场景「${s?.name ?? "未知"}」`)
    }
    for (const pid of assetIds.propIds) {
      const p = propMap.get(pid)
      if (!p?.imageUrl) missingAssetNames.push(`道具「${p?.name ?? "未知"}」`)
    }

    if (missingAssetNames.length > 0) {
      skipped.push({ shotId: shot.id, reason: `缺少关联资产图片：${missingAssetNames.join("、")}` })
      continue
    }

    const referenceImages: string[] = []
    const refLabels: string[] = []
    let imgIndex = 1

    for (const cid of assetIds.characterIds) {
      const c = characterMap.get(cid)
      if (c?.imageUrl) {
        referenceImages.push(c.imageUrl)
        refLabels.push(`图${imgIndex}为角色「${c.name}」`)
        imgIndex++
      }
    }

    if (assetIds.sceneId) {
      const s = sceneMap.get(assetIds.sceneId)
      if (s?.imageUrl) {
        referenceImages.push(s.imageUrl)
        refLabels.push(`图${imgIndex}为场景「${s.name}」`)
        imgIndex++
      }
    }

    for (const pid of assetIds.propIds) {
      const p = propMap.get(pid)
      if (p?.imageUrl) {
        referenceImages.push(p.imageUrl)
        refLabels.push(`图${imgIndex}为道具「${p.name}」`)
        imgIndex++
      }
    }

    // 合并用户自定义参考图
    const customRefUrls: string[] = (() => {
      try {
        return shot.refImageUrls ? (JSON.parse(shot.refImageUrls) as string[]) : []
      } catch {
        return []
      }
    })()
    for (const url of customRefUrls) {
      if (url) {
        referenceImages.push(url)
        refLabels.push(`图${imgIndex}为用户参考图`)
        imgIndex++
      }
    }

    const result = await submitShotImageTask({
      shotId: shot.id,
      referenceImages: referenceImages.length > 0 ? referenceImages : undefined,
      refLabels: refLabels.length > 0 ? refLabels : undefined,
      refImageNote: shot.refImageNote ?? undefined,
    })
    submitted.push({ shotId: shot.id, taskId: result.taskId })
  }

  return {
    submitted,
    skipped,
    stats: {
      total: shots.length,
      submitted: submitted.length,
      skipped: skipped.length,
    },
  }
}

export async function submitAssetImageTask(input: { type: AssetType; id: string }) {
  const asset = await findAsset(input.type, input.id)
  const { aspectRatio, resolution } = ASSET_SIZE_MAP[input.type]
  const prompt = asset.prompt?.trim() || asset.name

  const task = await createRunningAiTask({
    projectId: asset.projectId,
    targetInfo: `${ASSET_TYPE_LABEL[input.type]}：${asset.name}`,
    taskType: "image_generate",
  })

  const updatedAsset = await updateAssetGeneratingState(input.type, input.id, task.id)

  detachTask(
    executeAssetImageTask({
      taskId: task.id,
      type: input.type,
      id: input.id,
      projectId: asset.projectId,
      prompt,
      aspectRatio,
      resolution,
      stylePreset: asset.project?.stylePreset,
    })
  )

  return {
    asset: updatedAsset,
    taskId: task.id,
  }
}
