import { getLLMConfig } from "../config"
import { GoogleLLMProvider } from "./google"
import { OpenAILLMProvider } from "./openai"
import type { LLMGenerateOptions, LLMGenerateResult, LLMProvider } from "../types"
import { API_ERRORS } from "@/lib/api-error"

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
 * 未配置时抛出 API_ERRORS.LLM_NOT_CONFIGURED.code，由上层 route 统一转换为标准错误响应。
 */
export async function callLLM(
  options: LLMGenerateOptions
): Promise<LLMGenerateResult> {
  const llmProvider = await getLLMProvider()
  if (!llmProvider) {
    throw new Error(API_ERRORS.LLM_NOT_CONFIGURED.code)
  }
  return llmProvider.chat(options)
}
