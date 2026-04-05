import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { withError, throwCutGoError } from "@/lib/api-error"
import { createRunningAiTask, markAiTaskFailed, markAiTaskSucceeded } from "@/lib/ai-task-service"
import { callImage } from "@/lib/ai/image"

type AssetType = "character" | "scene" | "prop"

interface GenerateAssetImageRequest {
  type: AssetType
  id: string
}

/** 各资产类型的默认生图尺寸 */
const SIZE_MAP: Record<AssetType, { aspectRatio: string; resolution: string }> = {
  character: { aspectRatio: "1:1", resolution: "1024x1024" },
  scene: { aspectRatio: "3:2", resolution: "1080x1920" },
  prop: { aspectRatio: "1:1", resolution: "512x512" },
}

/** 任务列表展示用（与 API 请求体中的英文 type 区分） */
const ASSET_TYPE_LABEL: Record<AssetType, string> = {
  character: "角色",
  scene: "场景",
  prop: "道具",
}

type AssetRecord = {
  id: string
  name: string
  prompt: string | null
  projectId: string
}

async function findAsset(type: AssetType, id: string): Promise<AssetRecord> {
  if (type === "character") {
    const asset = await prisma.assetCharacter.findUnique({ where: { id } })
    if (!asset) throwCutGoError("NOT_FOUND", "角色不存在")
    return asset
  }
  if (type === "scene") {
    const asset = await prisma.assetScene.findUnique({ where: { id } })
    if (!asset) throwCutGoError("NOT_FOUND", "场景不存在")
    return asset
  }
  const asset = await prisma.assetProp.findUnique({ where: { id } })
  if (!asset) throwCutGoError("NOT_FOUND", "道具不存在")
  return asset
}

async function updateAssetImage(type: AssetType, id: string, imageUrl: string) {
  if (type === "character") {
    await prisma.assetCharacter.update({ where: { id }, data: { imageUrl } })
    return
  }
  if (type === "scene") {
    await prisma.assetScene.update({ where: { id }, data: { imageUrl } })
    return
  }
  await prisma.assetProp.update({ where: { id }, data: { imageUrl } })
}

async function runAssetImageTask({
  taskId,
  type,
  id,
  projectId,
  prompt,
  aspectRatio,
  resolution,
}: {
  taskId: string
  type: AssetType
  id: string
  projectId: string
  prompt: string
  aspectRatio: string
  resolution: string
}) {
  try {
    const result = await callImage({
      prompt,
      projectId,
      scope: "asset",
      aspectRatio,
      resolution,
    })
    const imageUrl = Array.isArray(result) ? result[0].url : result.url
    await updateAssetImage(type, id, imageUrl)
    await markAiTaskSucceeded(taskId)
  } catch (err) {
    await markAiTaskFailed(taskId, err)
  }
}

export const POST = withError(async (request: NextRequest) => {
  const body: GenerateAssetImageRequest = await request.json()
  const { type, id } = body

  if (!type || !id) {
    throwCutGoError("MISSING_PARAMS", "type 和 id 不能为空")
  }
  if (!["character", "scene", "prop"].includes(type)) {
    throwCutGoError("VALIDATION", "type 必须是 character、scene 或 prop")
  }

  const { aspectRatio, resolution } = SIZE_MAP[type]
  const asset = await findAsset(type, id)
  const prompt = asset.prompt?.trim() || asset.name
  const task = await createRunningAiTask({
    projectId: asset.projectId,
    targetInfo: `${ASSET_TYPE_LABEL[type]}：${asset.name}`,
    taskType: "image_generate",
  })

  void runAssetImageTask({
    taskId: task.id,
    type,
    id,
    projectId: asset.projectId,
    prompt,
    aspectRatio,
    resolution,
  })

  return NextResponse.json({
    accepted: true,
    taskId: task.id,
  })
})
