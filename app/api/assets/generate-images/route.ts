import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { withError, throwCutGoError } from "@/lib/api-error"

type AssetType = "character" | "scene" | "prop"

interface GenerateAssetImageRequest {
  type: AssetType
  id: string
}

function makePlaceholderUrl(name: string, prompt: string, type: AssetType): string {
  const label = encodeURIComponent(name.slice(0, 20))
  const colorMap: Record<AssetType, string> = {
    character: "7c3aed",
    scene: "0369a1",
    prop: "b45309",
  }
  const bg = colorMap[type]
  const [w, h] = type === "scene" ? [768, 432] : [512, 512]
  void prompt
  return `https://placehold.co/${w}x${h}/${bg}/white?text=${label}`
}

async function generateAssetImage(
  name: string,
  prompt: string,
  type: AssetType
): Promise<string> {
  // TODO: Replace with real AI image generation
  await new Promise((r) => setTimeout(r, 600))
  return makePlaceholderUrl(name, prompt, type)
}

export const POST = withError(async (request: NextRequest) => {
  const body: GenerateAssetImageRequest = await request.json()
  const { type, id } = body

  if (!type || !id) {
    throwCutGoError("VALIDATION", "type and id are required")
  }

  if (type === "character") {
    const asset = await prisma.assetCharacter.findUnique({ where: { id } })
    if (!asset) throwCutGoError("NOT_FOUND", "角色不存在")
    const prompt = asset!.prompt ?? asset!.name
    const imageUrl = await generateAssetImage(asset!.name, prompt, "character")
    const updated = await prisma.assetCharacter.update({
      where: { id },
      data: { imageUrl },
    })
    return NextResponse.json(updated)
  }

  if (type === "scene") {
    const asset = await prisma.assetScene.findUnique({ where: { id } })
    if (!asset) throwCutGoError("NOT_FOUND", "场景不存在")
    const prompt = asset!.prompt ?? asset!.name
    const imageUrl = await generateAssetImage(asset!.name, prompt, "scene")
    const updated = await prisma.assetScene.update({
      where: { id },
      data: { imageUrl },
    })
    return NextResponse.json(updated)
  }

  if (type === "prop") {
    const asset = await prisma.assetProp.findUnique({ where: { id } })
    if (!asset) throwCutGoError("NOT_FOUND", "道具不存在")
    const prompt = asset!.prompt ?? asset!.name
    const imageUrl = await generateAssetImage(asset!.name, prompt, "prop")
    const updated = await prisma.assetProp.update({
      where: { id },
      data: { imageUrl },
    })
    return NextResponse.json(updated)
  }

  throwCutGoError("VALIDATION", "type must be character, scene, or prop")
})
