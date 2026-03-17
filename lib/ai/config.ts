/**
 * 多模型配置：从数据库（Settings 表）读取用户配置
 * Settings 表只有一条全局记录（id = "global"），不存在时自动创建并返回默认值
 */

import { prisma } from "@/lib/db"

/** 语言模型配置接口 */
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

/** 获取当前配置的语言模型参数 */
export async function getLLMConfig(): Promise<LLMConfig | null> {
  const s = await loadSettings()
  if (!s.textApiKey) return null
  return {
    provider: s.textProvider as LLMConfig["provider"],
    apiKey: s.textApiKey,
    baseUrl: s.textBaseUrl || defaultTextBaseUrl(s.textProvider),
    model: s.textModel,
  }
}

/** 获取当前配置的图像生成参数 */
export async function getImageConfig(): Promise<ImageConfig> {
  const s = await loadSettings()
  const provider = s.imageProvider as ImageConfig["provider"]
  return {
    provider,
    apiKey: s.imageApiKey || undefined,
    baseUrl:
      provider === "comfyui"
        ? s.comfyuiUrl
        : s.imageBaseUrl || "https://api.openai.com/v1",
    model: s.imageModel || undefined,
  }
}

/** 获取当前配置的视频生成参数 */
export async function getVideoConfig(): Promise<VideoConfig> {
  const s = await loadSettings()
  return {
    provider: s.videoProvider as VideoConfig["provider"],
    apiKey: s.videoApiKey || undefined,
    baseUrl: s.videoBaseUrl || "https://api.runwayml.com/v1",
    model: s.videoModel || undefined,
  }
}

/** 获取当前配置的语音合成参数 */
export async function getTTSConfig(): Promise<TTSConfig> {
  const s = await loadSettings()
  return {
    provider: s.ttsProvider as TTSConfig["provider"],
    apiKey: s.ttsApiKey || undefined,
    baseUrl: s.ttsBaseUrl || undefined,
    model: s.ttsModel || undefined,
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
