import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { cutGoError, withError } from "@/lib/api-error"

export const GET = withError(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get("search") || ""
  const platform = searchParams.get("platform") || ""
  const status = searchParams.get("status") || ""
  const sort = searchParams.get("sort") || "updatedAt"
  const order = searchParams.get("order") || "desc"

  const where: Record<string, unknown> = {}

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
      { tags: { contains: search } },
    ]
  }

  if (platform) {
    where.platform = platform
  }

  if (status) {
    where.status = status
  }

  const projects = await prisma.project.findMany({
    where,
    orderBy: { [sort]: order },
  })

  return NextResponse.json(projects)
})

export const POST = withError(async (request: NextRequest) => {
  const body = await request.json()

  const { name, description, tags, platform, aspectRatio, resolution, duration } = body

  if (!name || !name.trim()) {
    throw cutGoError("VALIDATION", "项目名称不能为空")
  }

  const project = await prisma.project.create({
    data: {
      name: name.trim(),
      description: description || null,
      tags: tags || null,
      platform: platform || "抖音/TikTok",
      aspectRatio: aspectRatio || "9:16",
      resolution: resolution || "1080x1920",
      duration: duration || "60s",
    },
  })

  return NextResponse.json(project, { status: 201 })
})
