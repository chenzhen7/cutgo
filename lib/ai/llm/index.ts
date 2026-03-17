import { getLLMConfig } from "../config"
import { createOpenAILLMProvider } from "./openai"
import type { LLMProvider } from "../types"

let cachedProvider: LLMProvider | null = null

/**
 * 获取当前配置的 LLM Provider。
 * 无配置时返回一个“占位”实现：直接抛错或返回固定文案，由业务层决定是否降级（如你现有的 generateLocalAnalysis）。
 */
export function getLLMProvider(): LLMProvider | null {
  if (cachedProvider) return cachedProvider
  const config = getLLMConfig()
  if (!config) return null
  if (config.provider === "openai") {
    cachedProvider = createOpenAILLMProvider({
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      model: config.model,
    })
    return cachedProvider
  }
  // 后续可加：if (config.provider === "anthropic") { ... }
  return null
}

/**
 * 清除缓存（例如设置页切换了 provider 或 key 时调用）
 */
export function clearLLMProviderCache(): void {
  cachedProvider = null
}
