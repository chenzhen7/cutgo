/**
 * 多模型对接 - 统一类型定义
 * 业务只依赖这些接口，不关心具体厂商
 */

// ── LLM ──

export type LLMMessageRole = "system" | "user" | "assistant"

export interface LLMMessage {
  role: LLMMessageRole
  content: string
}

export interface LLMGenerateOptions {
  messages: LLMMessage[]
  model?: string
  temperature?: number
  maxTokens?: number
  responseFormat?: "text" | "json_object"
}

export interface LLMUsage {
  promptTokens?: number
  completionTokens?: number
}

export interface LLMGenerateResult {
  content: string
  usage?: LLMUsage
}

export interface LLMProvider {
  id: string
  chat(options: LLMGenerateOptions): Promise<LLMGenerateResult>
}

// ── Image ──

export interface ImageGenerateOptions {
  prompt: string
  negativePrompt?: string
  width: number
  height: number
  stylePreset?: string
  numOutputs?: number
}

export interface ImageGenerateResult {
  url: string
}

export interface ImageProvider {
  id: string
  generate(options: ImageGenerateOptions): Promise<ImageGenerateResult | ImageGenerateResult[]>
}

// ── Video ──

export interface VideoGenerateOptions {
  imageUrl?: string
  prompt: string
  durationSeconds?: number
  aspectRatio?: string
}

/** 同步返回 URL 或异步返回 taskId + 状态查询地址 */
export type VideoGenerateResult =
  | { url: string }
  | { taskId: string; statusUrl?: string }

export interface VideoProvider {
  id: string
  generate(options: VideoGenerateOptions): Promise<VideoGenerateResult>
}
