import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { throwCutGoError, withError } from "@/lib/api-error"

function safeJsonParse(value: string | null) {
  if (!value) return null
  try {
    return JSON.parse(value) as unknown
  } catch {
    return value
  }
}

type TaskEvent = {
  key: string
  label: string
  at: Date | null
  status?: string
  detail?: string | null
}

export const GET = withError(
  async (_request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const { id } = await context.params

    const task = await prisma.aiTask.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true } },
        episode: { select: { id: true, index: true, title: true } },
        shot: { select: { id: true, index: true } },
        videoComposition: {
          select: {
            id: true,
            episodeId: true,
            status: true,
            progress: true,
            currentStep: true,
            errorMessage: true,
          },
        },
      },
    })

    if (!task) {
      throwCutGoError("NOT_FOUND", "任务不存在")
    }

    const events: TaskEvent[] = [
      { key: "created", label: "任务创建", at: task.createdAt, status: "queued" },
      { key: "started", label: "任务开始", at: task.startedAt, status: "running" },
      {
        key: "finished",
        label: task.status === "failed" ? "任务失败" : "任务结束",
        at: task.finishedAt,
        status: task.status,
        detail: task.errorMessage || task.currentStep,
      },
    ]

    if (task.status === "running") {
      events.push({
        key: "running",
        label: "运行中",
        at: task.updatedAt,
        status: "running",
        detail: task.currentStep || null,
      })
    }

    if (task.videoComposition?.currentStep && task.status !== "running") {
      events.push({
        key: "video_step",
        label: "视频步骤记录",
        at: task.updatedAt,
        detail: task.videoComposition.currentStep,
      })
    }

    return NextResponse.json({
      ...task,
      parsedConfigSnapshot: safeJsonParse(task.configSnapshot),
      parsedInputPayload: safeJsonParse(task.inputPayload),
      parsedOutputPayload: safeJsonParse(task.outputPayload),
      events: events
        .filter((item) => item.at)
        .sort((a, b) => (a.at!.getTime() > b.at!.getTime() ? 1 : -1)),
    })
  }
)
