/**
 * 多模型对接 - 统一类型定义
 * 业务逻辑只依赖这些接口，不关心具体的 AI 厂商实现
 */

// ── 语言模型 (LLM) 相关类型 ──

/** 统一的模型配置结构 */
export interface AIModelConfig {
  id: string
  name: string
  type: "llm" | "image" | "video" | "tts"
  provider: string
  model: string
  apiKey: string
  baseUrl: string
  config?: Record<string, any>
  isDefault: boolean
}

/** 消息角色：系统提示词、用户输入、AI 回复 */
export type LLMMessageRole = "system" | "user" | "assistant"

/** 单条对话消息结构 */
export interface LLMMessage {
  role: LLMMessageRole
  content: string
}

/**
 * 传给 AI SDK `generateText` 的 `maxRetries`：失败后的额外请求次数（非总次数）。
 * 设为 1 表示最多再试 1 次（共 2 次请求）。
 */
export const DEFAULT_LLM_MAX_RETRIES = 1

/** 生成文本的配置选项 */
export interface LLMGenerateOptions {
  messages: LLMMessage[]
  model?: string
  /** 本次回复最多生成的 token 数（未传则由各厂商/SDK 默认） */
  maxTokens?: number
  /** 整次请求超时（毫秒），传给 AI SDK `generateText` 的 `timeout` */
  timeoutMs?: number

  // /** 响应格式：普通文本或 JSON 对象 */
  // responseFormat?: "text" | "json_object"
}

/** Token 使用情况统计 */
export interface LLMUsage {
  promptTokens?: number
  completionTokens?: number
}

/** 文本生成结果 */
export interface LLMGenerateResult {
  content: string
  usage?: LLMUsage
}

/** LLM 服务提供商接口定义 */
export interface LLMProvider {
  id: string
  /** 发起对话请求 */
  chat(options: LLMGenerateOptions): Promise<LLMGenerateResult>
}

// ── 图像生成 (Image) 相关类型 ──

/** 图像生成配置选项 */
export interface ImageGenerateOptions {
  prompt: string
  negativePrompt?: string
  width: number
  height: number
  stylePreset?: string
  /** 生成图片的数量 */
  numOutputs?: number
}

/** 图像生成结果：通常是一个图片 URL */
export interface ImageGenerateResult {
  url: string
}

/** 图像生成服务提供商接口定义 */
export interface ImageProvider {
  id: string
  /** 发起生图请求 */
  generate(options: ImageGenerateOptions): Promise<ImageGenerateResult | ImageGenerateResult[]>
}

// ── 视频生成 (Video) 相关类型 ──

/** 视频生成配置选项 */
export interface VideoGenerateOptions {
  imageUrl?: string
  prompt: string
  durationSeconds?: number
  aspectRatio?: string
}

/** 
 * 视频生成结果
 * 同步返回：直接给出视频 URL
 * 异步返回：返回任务 ID 和状态查询地址
 */
export type VideoGenerateResult =
  | { url: string }
  | { taskId: string; statusUrl?: string }

/** 视频生成服务提供商接口定义 */
export interface VideoProvider {
  id: string
  /** 发起生视频请求 */
  generate(options: VideoGenerateOptions): Promise<VideoGenerateResult>
}
