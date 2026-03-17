/**
 * 多模型配置：从环境变量（及可选 DB）读取当前使用的 provider、key、url、model
 * 未配置时返回空或默认值，由各 getXxxProvider() 决定降级策略
 */

export interface LLMConfig {
  provider: "openai" | "anthropic"
  apiKey: string
  baseUrl: string
  model: string
}

export interface ImageConfig {
  provider: "openai" | "comfyui" | "placeholder"
  apiKey?: string
  baseUrl?: string
  model?: string
}

export interface VideoConfig {
  provider: "runway" | "placeholder"
  apiKey?: string
  baseUrl?: string
}

function getEnv(key: string, fallback = ""): string {
  if (typeof process === "undefined" || !process.env) return fallback
  return (process.env[key] ?? fallback).trim()
}

export function getLLMConfig(): LLMConfig | null {
  const apiKey = getEnv("OPENAI_API_KEY")
  if (!apiKey) return null
  return {
    provider: (getEnv("LLM_PROVIDER") || "openai") as LLMConfig["provider"],
    apiKey,
    baseUrl: getEnv("OPENAI_BASE_URL", "https://api.openai.com/v1"),
    model: getEnv("OPENAI_MODEL", "gpt-4o-mini"),
  }
}

export function getImageConfig(): ImageConfig {
  const providerRaw = getEnv("IMAGE_PROVIDER", "").toLowerCase()
  const apiKey = getEnv("IMAGE_OPENAI_API_KEY") || getEnv("OPENAI_API_KEY")
  const comfyUrl = getEnv("COMFYUI_BASE_URL", "http://127.0.0.1:8188")
  const openaiUrl = getEnv("OPENAI_BASE_URL", "https://api.openai.com/v1")
  const provider: ImageConfig["provider"] =
    providerRaw === "comfyui" ? "comfyui" : apiKey ? "openai" : "placeholder"
  return {
    provider,
    apiKey: apiKey || undefined,
    baseUrl: provider === "comfyui" ? comfyUrl : openaiUrl,
    model: getEnv("IMAGE_MODEL", "dall-e-3"),
  }
}

export function getVideoConfig(): VideoConfig {
  const apiKey = getEnv("RUNWAY_API_KEY")
  return {
    provider: apiKey ? "runway" : "placeholder",
    apiKey: apiKey || undefined,
    baseUrl: getEnv("RUNWAY_BASE_URL", "https://api.runwayml.com/v1"),
  }
}
