/**
 * 多模型配置：从数据库（Settings 表）读取用户配置
 * Settings 表只有一条全局记录（id = "global"），不存在时自动创建并返回默认值
 */

import { prisma } from "@/lib/db"
import { AIModelConfig } from "./types"

/** 
 * 加载全局设置
 */
async function loadSettings() {
  return prisma.settings.upsert({
    where: { id: "global" },
    create: { id: "global" },
    update: {},
  })
}

/** 获取当前激活的模型配置 */
export async function getActiveConfig(type: AIModelConfig["type"]): Promise<AIModelConfig | null> {
  const s = await loadSettings()
  
  let configId: string | null = null
  switch (type) {
    case "llm": configId = s.activeLLMConfigId; break;
    case "image": configId = s.activeImageConfigId; break;
    case "video": configId = s.activeVideoConfigId; break;
    case "tts": configId = s.activeTTSConfigId; break;
  }

  if (configId) {
    const config = await prisma.aIModelConfig.findUnique({ where: { id: configId } })
    if (config) return formatConfig(config)
  }

  // 兜底：返回该类型的默认配置
  const defaultConfig = await prisma.aIModelConfig.findFirst({ 
    where: { type, isDefault: true } 
  })
  return defaultConfig ? formatConfig(defaultConfig) : null
}

/** 格式化数据库模型为业务配置对象 */
function formatConfig(dbConfig: any): AIModelConfig {
  return {
    ...dbConfig,
    config: dbConfig.config ? JSON.parse(dbConfig.config) : {}
  } as AIModelConfig
}

/** 获取当前配置的语言模型参数 (兼容旧接口) */
export async function getLLMConfig(): Promise<AIModelConfig | null> {
  return getActiveConfig("llm")
}

/** 获取当前配置的图像生成参数 (兼容旧接口) */
export async function getImageConfig(): Promise<AIModelConfig | null> {
  return getActiveConfig("image")
}

/** 获取当前配置的视频生成参数 (兼容旧接口) */
export async function getVideoConfig(): Promise<AIModelConfig | null> {
  return getActiveConfig("video")
}

/** 获取当前配置的语音合成参数 (兼容旧接口) */
export async function getTTSConfig(): Promise<AIModelConfig | null> {
  return getActiveConfig("tts")
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
