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
export const DEFAULT_LLM_TIMEOUT_MS = 300 * 1000

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
  projectId: string
  scope: "shot" | "asset"
  negativePrompt?: string
  /** 参考图 URL / Base64（data:image/...;base64,...） */
  referenceImages?: string[]
  /** 宽高比例，如 "9:16"、"16:9"、"1:1" */
  aspectRatio?: string
  /** 分辨率，如 "1080x1920"、"1920x1080"、"512x512" */
  resolution?: string
  stylePreset?: string
  /** 生成图片的数量 默认1 */
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
  prompt: string
  /** 首帧/首尾帧图片 URL 列表（1 张=首帧，2 张=首尾帧） */
  imageUrls?: string[]
  /** 视频时长（秒），2-12 */
  durationSeconds?: number
  /** 宽高比，如 "16:9"、"9:16"、"1:1"、"adaptive" */
  ratio?: string
  /** 帧率，默认 24 */
  fps?: number
  /** 随机种子，-1 表示随机 */
  seed?: number
  /** 是否添加水印，默认 false */
  watermark?: boolean
  /** 是否固定镜头，默认 false */
  cameraFixed?: boolean
  /** 是否生成音频（仅部分模型支持），默认 false */
  generateAudio?: boolean
}

/** 视频生成任务状态 */
export type VideoTaskStatus =
  | { status: "pending" | "processing" }
  | { status: "success"; url: string }
  | { status: "failed"; reason?: string }

/** 
 * 视频生成结果（异步任务）
 * 返回任务 ID，通过 queryTask 轮询状态
 */
export interface VideoGenerateResult {
  taskId: string
}

/** 视频生成服务提供商接口定义 */
export interface VideoProvider {
  id: string
  /** 发起视频生成任务，返回 taskId */
  generate(options: VideoGenerateOptions): Promise<VideoGenerateResult>
  /** 查询异步任务状态 */
  queryTask(taskId: string): Promise<VideoTaskStatus>
}
