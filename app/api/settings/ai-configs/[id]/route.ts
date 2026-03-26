import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import {
  clearImageProviderCache,
  clearLLMProviderCache,
  clearVideoProviderCache,
} from "@/lib/ai"

/** GET /api/settings/ai-configs/[id] — 获取单条配置 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const config = await prisma.aIModelConfig.findUnique({ where: { id } })
    if (!config) {
      return NextResponse.json({ error: "配置不存在" }, { status: 404 })
    }
    return NextResponse.json({ ...config, config: JSON.parse(config.config) })
  } catch (error) {
    console.error("[ai-configs/:id GET]", error)
    return NextResponse.json({ error: "读取配置失败" }, { status: 500 })
  }
}

/** PUT /api/settings/ai-configs/[id] — 更新配置 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { name, provider, model, apiKey, baseUrl, config, isDefault } = body

    const existing = await prisma.aIModelConfig.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "配置不存在" }, { status: 404 })
    }

    // 若将此配置设为默认，先清除同类型其他配置的 isDefault
    if (isDefault && !existing.isDefault) {
      await prisma.aIModelConfig.updateMany({
        where: { type: existing.type, id: { not: id } },
        data: { isDefault: false },
      })
    }

    const updated = await prisma.aIModelConfig.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(provider !== undefined && { provider }),
        ...(model !== undefined && { model }),
        ...(apiKey !== undefined && { apiKey }),
        ...(baseUrl !== undefined && { baseUrl }),
        ...(config !== undefined && { config: JSON.stringify(config) }),
        ...(isDefault !== undefined && { isDefault }),
      },
    })

    // 若设为默认，同步 Settings
    if (isDefault) {
      await syncActiveConfig(existing.type, id)
    }

    clearProviderCacheByType(existing.type)

    return NextResponse.json({ ...updated, config: JSON.parse(updated.config) })
  } catch (error) {
    console.error("[ai-configs/:id PUT]", error)
    return NextResponse.json({ error: "更新配置失败" }, { status: 500 })
  }
}

/** DELETE /api/settings/ai-configs/[id] — 删除配置 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const existing = await prisma.aIModelConfig.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "配置不存在" }, { status: 404 })
    }

    await prisma.aIModelConfig.delete({ where: { id } })

    // 若删除的是当前激活配置，将 Settings 中对应字段置空
    const settings = await prisma.settings.findFirst()
    if (settings) {
      const fieldMap: Record<string, string> = {
        llm: "activeLLMConfigId",
        image: "activeImageConfigId",
        video: "activeVideoConfigId",
        tts: "activeTTSConfigId",
      }
      const field = fieldMap[existing.type]
      if (field && (settings as Record<string, unknown>)[field] === id) {
        // 尝试找同类型的下一个默认配置
        const fallback = await prisma.aIModelConfig.findFirst({
          where: { type: existing.type, isDefault: true },
        })
        await prisma.settings.update({
          where: { id: "global" },
          data: { [field]: fallback?.id ?? null },
        })
      }
    }

    clearProviderCacheByType(existing.type)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[ai-configs/:id DELETE]", error)
    return NextResponse.json({ error: "删除配置失败" }, { status: 500 })
  }
}

async function syncActiveConfig(type: string, configId: string | null) {
  const fieldMap: Record<string, string> = {
    llm: "activeLLMConfigId",
    image: "activeImageConfigId",
    video: "activeVideoConfigId",
    tts: "activeTTSConfigId",
  }
  const field = fieldMap[type]
  if (!field) return

  await prisma.settings.upsert({
    where: { id: "global" },
    create: { id: "global", [field]: configId },
    update: { [field]: configId },
  })
}

function clearProviderCacheByType(type: string) {
  if (type === "llm") clearLLMProviderCache()
  if (type === "image") clearImageProviderCache()
  if (type === "video") clearVideoProviderCache()
}
