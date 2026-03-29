import { API_ERRORS } from "@/lib/api-error"
import { getImageConfig, getLLMConfig, getTTSConfig, getVideoConfig } from "@/lib/ai/config"
import { prisma } from "@/lib/db"
import type { AiTaskType } from "@/lib/ai-task"

type CreateAiTaskInput = {
  projectId: string
  taskType: AiTaskType
  episodeId?: string | null
  shotId?: string | null
  videoCompositionId?: string | null
  maxRetries?: number
}

function toErrorInfo(error: unknown): { code: string; message: string } {
  const e = error as { code?: string; message?: string }
  return {
    code: typeof e?.code === "string" ? e.code : API_ERRORS.INTERNAL.code,
    message:
      typeof e?.message === "string" && e.message.trim().length > 0
        ? e.message
        : API_ERRORS.INTERNAL.defaultMessage,
  }
}

function formatModel(provider: string | null | undefined, model: string | null | undefined): string | null {
  if (!provider || !model) return null
  return `${provider}/${model}`
}

async function resolveModelForTaskType(taskType: AiTaskType): Promise<string | null> {
  if (taskType === "llm_script" || taskType === "llm_shot") {
    const config = await getLLMConfig()
    return formatModel(config?.provider, config?.model)
  }
  if (taskType === "image_generate") {
    const config = await getImageConfig()
    return formatModel(config?.provider, config?.model)
  }
  if (taskType === "shot_video_generate" || taskType === "video_generate") {
    const config = await getVideoConfig()
    return formatModel(config?.provider, config?.model)
  }
  if (taskType === "tts_generate") {
    const config = await getTTSConfig()
    return formatModel(config?.provider, config?.model)
  }
  return null
}

export async function createRunningAiTask(input: CreateAiTaskInput) {
  const model = await resolveModelForTaskType(input.taskType)

  const task = await prisma.aiTask.create({
    data: {
      projectId: input.projectId,
      episodeId: input.episodeId ?? null,
      shotId: input.shotId ?? null,
      videoCompositionId: input.videoCompositionId ?? null,
      taskType: input.taskType,
      status: "running",
      model,
      maxRetries: input.maxRetries ?? 0,
      startedAt: new Date(),
    },
  })
  return task
}

export async function markAiTaskSucceeded(taskId: string) {
  await prisma.aiTask.update({
    where: { id: taskId },
    data: {
      status: "succeeded",
      errorCode: null,
      errorMessage: null,
      finishedAt: new Date(),
    },
  })
}

export async function markAiTaskFailed(taskId: string, error: unknown) {
  const { code, message } = toErrorInfo(error)
  await prisma.aiTask.update({
    where: { id: taskId },
    data: {
      status: "failed",
      errorCode: code,
      errorMessage: message,
      finishedAt: new Date(),
    },
  })
}
