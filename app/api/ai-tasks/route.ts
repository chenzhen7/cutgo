import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { throwCutGoError, withError } from "@/lib/api-error"
import { isAiTaskStatus, isAiTaskType } from "@/lib/ai-task"

const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

function toInt(value: string | null, fallback: number): number {
  if (!value) return fallback
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback
}

export const GET = withError(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)

  const projectId = searchParams.get("projectId")?.trim()
  if (!projectId) {
    throwCutGoError("MISSING_PARAMS", "projectId is required")
  }

  const keyword = searchParams.get("keyword")?.trim() || ""
  const statusParam = searchParams.get("status")?.trim() || ""
  const taskTypeParam = searchParams.get("taskType")?.trim() || ""
  const startDate = searchParams.get("startDate")?.trim() || ""
  const endDate = searchParams.get("endDate")?.trim() || ""
  const page = toInt(searchParams.get("page"), DEFAULT_PAGE)
  const pageSize = Math.min(toInt(searchParams.get("pageSize"), DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE)

  const sortByRaw = searchParams.get("sortBy")?.trim() || "createdAt"
  const sortBy = ["createdAt", "updatedAt", "startedAt", "finishedAt"].includes(sortByRaw)
    ? sortByRaw
    : "createdAt"
  const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc"

  const where: Record<string, unknown> = { projectId }

  if (statusParam) {
    if (!isAiTaskStatus(statusParam)) {
      throwCutGoError("VALIDATION", `Invalid status: ${statusParam}`)
    }
    where.status = statusParam
  }

  if (taskTypeParam) {
    if (!isAiTaskType(taskTypeParam)) {
      throwCutGoError("VALIDATION", `Invalid taskType: ${taskTypeParam}`)
    }
    where.taskType = taskTypeParam
  }

  if (keyword) {
    where.OR = [
      { id: { contains: keyword } },
      { model: { contains: keyword } },
      { currentStep: { contains: keyword } },
      { errorMessage: { contains: keyword } },
      { errorCode: { contains: keyword } },
    ]
  }

  if (startDate || endDate) {
    const createdAt: Record<string, Date> = {}
    if (startDate) {
      const value = new Date(startDate)
      if (Number.isNaN(value.getTime())) {
        throwCutGoError("VALIDATION", "startDate 非法")
      }
      createdAt.gte = value
    }
    if (endDate) {
      const value = new Date(endDate)
      if (Number.isNaN(value.getTime())) {
        throwCutGoError("VALIDATION", "endDate 非法")
      }
      createdAt.lte = value
    }
    where.createdAt = createdAt
  }

  const [total, items] = await Promise.all([
    prisma.aiTask.count({ where }),
    prisma.aiTask.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        episode: { select: { id: true, index: true, title: true } },
        shot: { select: { id: true, index: true } },
        videoComposition: { select: { id: true, episodeId: true, status: true, progress: true } },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { [sortBy]: sortOrder },
    }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return NextResponse.json({
    items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
    },
  })
})
