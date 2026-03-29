import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { withError, throwCutGoError } from "@/lib/api-error"
import { getImageProvider } from "@/lib/ai/image"

type AssetType = "character" | "scene" | "prop"

interface GenerateAssetImageRequest {
  type: AssetType
  id: string
}

/** 各资产类型的默认生图尺寸 */
const SIZE_MAP: Record<AssetType, { width: number; height: number }> = {
  character: { width: 512, height: 512 },
  scene:     { width: 768, height: 512 },
  prop:      { width: 512, height: 512 },
}

export const POST = withError(async (request: NextRequest) => {
  const body: GenerateAssetImageRequest = await request.json()
  const { type, id } = body

  if (!type || !id) {
    throwCutGoError("MISSING_PARAMS", "type 和 id 不能为空")
  }

  const provider = await getImageProvider()
  const { width, height } = SIZE_MAP[type]

  if (type === "character") {
    const asset = await prisma.assetCharacter.findUnique({ where: { id } })
    if (!asset) throwCutGoError("NOT_FOUND", "角色不存在")

    const prompt = asset!.prompt?.trim() || asset!.name
    const result = await provider.generate({ prompt, width, height })
    const imageUrl = Array.isArray(result) ? result[0].url : result.url

    const updated = await prisma.assetCharacter.update({
      where: { id },
      data: { imageUrl },
    })
    return NextResponse.json(updated)
  }

  if (type === "scene") {
    const asset = await prisma.assetScene.findUnique({ where: { id } })
    if (!asset) throwCutGoError("NOT_FOUND", "场景不存在")

    const prompt = asset!.prompt?.trim() || asset!.name
    const result = await provider.generate({ prompt, width, height })
    const imageUrl = Array.isArray(result) ? result[0].url : result.url

    const updated = await prisma.assetScene.update({
      where: { id },
      data: { imageUrl },
    })
    return NextResponse.json(updated)
  }

  if (type === "prop") {
    const asset = await prisma.assetProp.findUnique({ where: { id } })
    if (!asset) throwCutGoError("NOT_FOUND", "道具不存在")

    const prompt = asset!.prompt?.trim() || asset!.name
    const result = await provider.generate({ prompt, width, height })
    const imageUrl = Array.isArray(result) ? result[0].url : result.url

    const updated = await prisma.assetProp.update({
      where: { id },
      data: { imageUrl },
    })
    return NextResponse.json(updated)
  }

  throwCutGoError("VALIDATION", "type 必须是 character、scene 或 prop")
})
