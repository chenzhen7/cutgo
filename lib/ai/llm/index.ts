import { getLLMConfig } from "../config"
import { createOpenAILLMProvider } from "./openai"
import type { LLMProvider } from "../types"

// 缓存 Provider 实例，避免重复创建
let cachedProvider: LLMProvider | null = null

/**
 * 获取当前配置的 LLM Provider（异步，从数据库读取配置）。
 * 无配置时返回 null，由业务层决定是否降级（例如提示用户配置 API Key）。
 */
export async function getLLMProvider(): Promise<LLMProvider | null> {
  if (cachedProvider) return cachedProvider
  
  const config = await getLLMConfig()
  if (!config) return null

  // 目前主流国产模型（DeepSeek、Qwen）均兼容 OpenAI 接口协议
  if (config.provider === "openai" || config.provider === "deepseek" || config.provider === "qwen" || config.provider === "anthropic") {
    // 注意：Anthropic 即使 provider 叫 anthropic，如果用户填的是兼容 OpenAI 的中转地址，这里也能跑通
    // 如果是原生 Anthropic SDK，则需要另外实现
    cachedProvider = createOpenAILLMProvider({
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      model: config.model,
    })
    return cachedProvider
  }
  
  // 待扩展：支持 Anthropic 等非 OpenAI 兼容接口
  // if (config.provider === "anthropic") { ... }
  
  return null
}

/**
 * 清除 Provider 缓存。
 * 当用户在设置页面更改了模型厂商或 API Key 时，应调用此函数以确保下次获取的是最新配置。
 */
export function clearLLMProviderCache(): void {
  cachedProvider = null
}
