/**
 * 多模型配置：从数据库（Settings 表）读取用户配置
 * Settings 表只有一条全局记录（id = "global"），不存在时自动创建并返回默认值
 */

import { prisma } from "@/lib/db"

/** 通用 AI 配置接口 */
export interface AIConfig {
  id: string
  name: string
  type: "llm" | "image" | "video" | "tts"
  provider: string
  model: string
  apiKey: string
  baseUrl?: string
  otherConfig?: string // JSON string for extra params
  isActive: boolean
}

/** 语言模型配置接口 (从 AIConfig 映射) */
export interface LLMConfig {
  provider: "openai" | "anthropic" | "deepseek" | "qwen"
  apiKey: string
  baseUrl: string
  model: string
}

/** 图像生成配置接口 */
export interface ImageConfig {
  provider: "openai" | "comfyui" | "placeholder"
  apiKey?: string
  baseUrl?: string
  model?: string
}

/** 视频生成配置接口 */
export interface VideoConfig {
  provider: "runway" | "placeholder"
  apiKey?: string
  baseUrl?: string
  model?: string
}

/** 语音合成 (TTS) 配置接口 */
export interface TTSConfig {
  provider: "openai" | "elevenlabs" | "edge-tts" | "minimax"
  apiKey?: string
  baseUrl?: string
  model?: string
}

/** 
 * 加载全局设置
 * 采用 upsert 确保数据库中始终有一条 ID 为 "global" 的记录
 */
async function loadSettings() {
  return prisma.settings.upsert({
    where: { id: "global" },
    create: { id: "global" },
    update: {},
  })
}

/** 获取指定类型的当前激活配置 */
export async function getActiveConfig(type: AIConfig["type"]): Promise<AIConfig | null> {
  const config = await prisma.aIConfig.findFirst({
    where: { type, isActive: true },
  })
  return config as AIConfig | null
}

/** 获取当前配置的语言模型参数 */
export async function getLLMConfig(): Promise<LLMConfig | null> {
  const config = await getActiveConfig("llm")
  if (!config || !config.apiKey) return null
  
  return {
    provider: config.provider as LLMConfig["provider"],
    apiKey: config.apiKey,
    baseUrl: config.baseUrl || defaultTextBaseUrl(config.provider),
    model: config.model,
  }
}

/** 获取当前配置的图像生成参数 */
export async function getImageConfig(): Promise<ImageConfig | null> {
  const config = await getActiveConfig("image")
  if (!config) return null

  const provider = config.provider as ImageConfig["provider"]
  return {
    provider,
    apiKey: config.apiKey || undefined,
    baseUrl:
      provider === "comfyui"
        ? (config.otherConfig ? JSON.parse(config.otherConfig).comfyuiUrl : "")
        : config.baseUrl || "https://api.openai.com/v1",
    model: config.model || undefined,
  }
}

/** 获取当前配置的视频生成参数 */
export async function getVideoConfig(): Promise<VideoConfig | null> {
  const config = await getActiveConfig("video")
  if (!config) return null

  return {
    provider: config.provider as VideoConfig["provider"],
    apiKey: config.apiKey || undefined,
    baseUrl: config.baseUrl || "https://api.runwayml.com/v1",
    model: config.model || undefined,
  }
}

/** 获取当前配置的语音合成参数 */
export async function getTTSConfig(): Promise<TTSConfig | null> {
  const config = await getActiveConfig("tts")
  if (!config) return null

  return {
    provider: config.provider as TTSConfig["provider"],
    apiKey: config.apiKey || undefined,
    baseUrl: config.baseUrl || undefined,
    model: config.model || undefined,
  }
}

/** 
 * 各厂商默认的 API 基础地址
 */
function defaultTextBaseUrl(provider: string): string {
  switch (provider) {
    case "openai":
      return "https://api.openai.com/v1"
    case "anthropic":
      return "https://api.anthropic.com"
    case "deepseek":
      return "https://api.deepseek.com/v1"
    case "qwen":
      return "https://dashscope.aliyuncs.com/compatible-mode/v1"
    default:
      return ""
  }
}
