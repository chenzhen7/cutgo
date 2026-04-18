import { API_ERRORS } from "@/lib/api-error"
import { getImageConfig, getLLMConfig, getTTSConfig, getVideoConfig } from "@/lib/ai/config"
import { prisma } from "@/lib/db"
import type { AiTaskType } from "@/lib/ai-task"

export const AI_TASK_STARTUP_RECOVERY_ERROR_CODE = "PROCESS_RESTARTED"
export const AI_TASK_STARTUP_RECOVERY_ERROR_MESSAGE =
  "Task interrupted because the service restarted. Please retry."

export type StartupRecoveryResult = {
  failedAiTaskCount: number
  recoveredShotImageCount: number
  recoveredAssetCharacterImageCount: number
  recoveredAssetSceneImageCount: number
  recoveredAssetPropImageCount: number
  recoveredImageRecordCount: number
}

type CreateAiTaskInput = {
  projectId: string
  taskType: AiTaskType
  episodeId?: string | null
  shotId?: string | null
  videoCompositionId?: string | null
  targetInfo: string
  maxRetries?: number
}

export function toErrorInfo(error: unknown): { code: string; message: string } {
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
      targetInfo: input.targetInfo,
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

export async function failRunningAiTasksOnStartup(): Promise<StartupRecoveryResult> {
  const now = new Date()
  const [aiTasks, shots, assetCharacters, assetScenes, assetProps] = await prisma.$transaction([
    prisma.aiTask.updateMany({
      where: { status: "running" },
      data: {
        status: "failed",
        errorCode: AI_TASK_STARTUP_RECOVERY_ERROR_CODE,
        errorMessage: AI_TASK_STARTUP_RECOVERY_ERROR_MESSAGE,
        finishedAt: now,
      },
    }),
    prisma.shot.updateMany({
      where: { imageStatus: "generating" },
      data: {
        imageStatus: "error",
        imageErrorMessage: AI_TASK_STARTUP_RECOVERY_ERROR_MESSAGE,
      },
    }),
    prisma.assetCharacter.updateMany({
      where: { imageStatus: "generating" },
      data: {
        imageStatus: "error",
        imageErrorMessage: AI_TASK_STARTUP_RECOVERY_ERROR_MESSAGE,
      },
    }),
    prisma.assetScene.updateMany({
      where: { imageStatus: "generating" },
      data: {
        imageStatus: "error",
        imageErrorMessage: AI_TASK_STARTUP_RECOVERY_ERROR_MESSAGE,
      },
    }),
    prisma.assetProp.updateMany({
      where: { imageStatus: "generating" },
      data: {
        imageStatus: "error",
        imageErrorMessage: AI_TASK_STARTUP_RECOVERY_ERROR_MESSAGE,
      },
    }),
  ])

  const recoveredImageRecordCount =
    shots.count + assetCharacters.count + assetScenes.count + assetProps.count

  return {
    failedAiTaskCount: aiTasks.count,
    recoveredShotImageCount: shots.count,
    recoveredAssetCharacterImageCount: assetCharacters.count,
    recoveredAssetSceneImageCount: assetScenes.count,
    recoveredAssetPropImageCount: assetProps.count,
    recoveredImageRecordCount,
  }
}
