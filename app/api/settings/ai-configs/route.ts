import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

/** GET /api/settings/ai-configs?type=llm — 获取指定类型的所有模型配置 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type")

    const configs = await prisma.aIModelConfig.findMany({
      where: type ? { type } : undefined,
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    })

    return NextResponse.json(
      configs.map((c) => ({
        ...c,
        config: c.config ? JSON.parse(c.config) : {},
      }))
    )
  } catch (error) {
    console.error("[ai-configs GET]", error)
    return NextResponse.json({ error: "读取模型配置失败" }, { status: 500 })
  }
}

/** POST /api/settings/ai-configs — 新增模型配置 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, type, provider, model, apiKey, baseUrl, config, isDefault } = body

    if (!name || !type || !provider || !model) {
      return NextResponse.json(
        { error: "name、type、provider、model 为必填项" },
        { status: 400 }
      )
    }

    // 若新配置标记为默认，先将同类型其他配置的 isDefault 清除
    if (isDefault) {
      await prisma.aIModelConfig.updateMany({
        where: { type },
        data: { isDefault: false },
      })
    }

    const created = await prisma.aIModelConfig.create({
      data: {
        name,
        type,
        provider,
        model,
        apiKey: apiKey ?? "",
        baseUrl: baseUrl ?? "",
        config: config ? JSON.stringify(config) : "{}",
        isDefault: isDefault ?? false,
      },
    })

    // 若新配置是默认配置，同步更新 Settings 中对应的 activeXxxConfigId
    if (isDefault) {
      await syncActiveConfig(type, created.id)
    }

    return NextResponse.json({ ...created, config: config ?? {} }, { status: 201 })
  } catch (error) {
    console.error("[ai-configs POST]", error)
    return NextResponse.json({ error: "创建模型配置失败" }, { status: 500 })
  }
}

/** 同步更新 Settings 中的激活配置 ID */
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
