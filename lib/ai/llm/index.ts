import { getLLMConfig } from "@/lib/ai"
import { GoogleLLMProvider } from "./google"
import { OpenAILLMProvider } from "./openai"
import type { LLMGenerateOptions, LLMGenerateResult, LLMProvider } from "../types"
import { throwCutGoError } from "@/lib/api-error"
import { logAIEvent } from "../logging"

// 模型配置运行时参数定义
export interface LLMProviderRuntimeConfig {
  provider: string
  apiKey: string
  baseUrl: string
  model: string
}

/**
 * 获取当前配置的 LLM Provider（异步，从数据库读取配置）。
 * 无配置时返回 null，由业务层决定是否降级（例如提示用户配置 API Key）。
 */
export async function getLLMProvider(): Promise<LLMProvider | null> {
  const config = await getLLMConfig()
  if (!config) return null
  return createLLMProviderFromConfig(config)
}

/**
 * 根据运行时传入的配置创建 LLM Provider。
 * 该函数不读取数据库，也不写入全局缓存，适合“测试连接”等场景。
 */
export function createLLMProviderFromConfig(config: LLMProviderRuntimeConfig): LLMProvider | null {

  if (config.provider === "google") {
    return new GoogleLLMProvider({
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      model: config.model,
    })
  }

  // OpenAI 兼容 /chat/completions（含中转填写的 Base URL）
  if (
    config.provider === "openai" ||
    config.provider === "deepseek" ||
    config.provider === "anthropic" ||
    config.provider === "qwen" ||
    config.provider === "doubao" ||
    config.provider === "zhipu" ||
    config.provider === "custom-openai"
  ) {
    return new OpenAILLMProvider({
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      model: config.model,
    })
  }

  return null
}

/**
 * 使用当前生效配置调用 LLM 聊天接口。
 * 未配置时直接抛出标准 CutGoError("LLM_NOT_CONFIGURED")，由 withError 统一响应。
 */
export async function callLLM(
  options: LLMGenerateOptions
): Promise<LLMGenerateResult> {
  const llmProvider = await getLLMProvider()
  if (!llmProvider) {
    throwCutGoError("LLM_NOT_CONFIGURED")
  }

  logAIEvent("llm", "request", {
    provider: llmProvider.id,
    body: options,
  })

  const result = await llmProvider.chat(options)
  logAIEvent("llm", "response", {
    provider: llmProvider.id,
    body: result,
  })
  return result
  
}
