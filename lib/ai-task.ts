export const AI_TASK_TYPES = [
  "llm_outline",
  "llm_extract_assets",
  "llm_script",
  "llm_shot",
  "image_generate",
  "shot_video_generate",
  "video_generate",
  "tts_generate",
] as const

export const AI_TASK_STATUSES = [
  "queued",
  "running",
  "succeeded",
  "failed",
  "cancelled",
] as const

export type AiTaskType = (typeof AI_TASK_TYPES)[number]
export type AiTaskStatus = (typeof AI_TASK_STATUSES)[number]

export const AI_TASK_TYPE_LABEL: Record<AiTaskType, string> = {
  llm_outline: "LLM 大纲生成",
  llm_extract_assets: "LLM 资产提取",
  llm_script: "LLM 剧本生成",
  llm_shot: "LLM 分镜生成",
  image_generate: "图片生成",
  shot_video_generate: "镜头视频生成",
  video_generate: "整集视频合成",
  tts_generate: "TTS 配音",
}

export const AI_TASK_STATUS_LABEL: Record<AiTaskStatus, string> = {
  queued: "排队中",
  running: "运行中",
  succeeded: "成功",
  failed: "失败",
  cancelled: "已取消",
}

export function isAiTaskType(value: string): value is AiTaskType {
  return AI_TASK_TYPES.includes(value as AiTaskType)
}

export function isAiTaskStatus(value: string): value is AiTaskStatus {
  return AI_TASK_STATUSES.includes(value as AiTaskStatus)
}
