import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

/** GET /api/settings — 读取全局设置 */
export async function GET() {
  try {
    const settings = await prisma.settings.upsert({
      where: { id: "global" },
      create: { id: "global" },
      update: {},
    })
    return NextResponse.json(settings)
  } catch (error) {
    console.error("[settings GET]", error)
    return NextResponse.json({ error: "读取设置失败" }, { status: 500 })
  }
}

/** PUT /api/settings — 保存全局设置 */
export async function PUT(req: Request) {
  try {
    const body = await req.json()

    // 只允许更新白名单字段，防止污染 id 等主键
    const {
      activeLLMConfigId,
      activeImageConfigId,
      activeVideoConfigId,
      activeTTSConfigId,
    } = body

    const settings = await prisma.settings.upsert({
      where: { id: "global" },
      create: {
        id: "global",
        activeLLMConfigId,
        activeImageConfigId,
        activeVideoConfigId,
        activeTTSConfigId,
      },
      update: {
        ...(activeLLMConfigId !== undefined && { activeLLMConfigId }),
        ...(activeImageConfigId !== undefined && { activeImageConfigId }),
        ...(activeVideoConfigId !== undefined && { activeVideoConfigId }),
        ...(activeTTSConfigId !== undefined && { activeTTSConfigId }),
      },
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error("[settings PUT]", error)
    return NextResponse.json({ error: "保存设置失败" }, { status: 500 })
  }
}
