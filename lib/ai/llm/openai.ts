import type { LLMProvider, LLMGenerateOptions, LLMGenerateResult } from "../types"
import { generateText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"

/** OpenAI 兼容接口的配置参数 */
export interface OpenAICompatibleConfig {
  apiKey: string
  baseUrl: string
  model: string
}

/**
 * OpenAI 兼容的 LLM Provider
 * 使用 @ai-sdk/openai 并指定 compatibility: "compatible"，强制走 /chat/completions 接口
 * 适用于 OpenAI、DeepSeek、字节豆包（火山方舟）、智谱等遵循 OpenAI API 标准的服务商
 */
export class OpenAILLMProvider implements LLMProvider {
  readonly id = "openai"
  private readonly openai

  constructor(private readonly config: OpenAICompatibleConfig) {
    const isDev = process.env.NODE_ENV === "development"

    this.openai = createOpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl.replace(/\/$/, ""),
      fetch: isDev
        ? async (url, options) => {
            console.log("[AI SDK] URL:", url)
            console.log("[AI SDK] Headers:", options?.headers)
            console.log("[AI SDK] Body:", options?.body)
            const response = await fetch(url, options)
            const clone = response.clone()
            const text = await clone.text()
            console.log("[AI SDK] Response:", text)
            return response
          }
        : undefined,
    })
  }

  /**
   * 调用 /chat/completions 接口
   */
  async chat(options: LLMGenerateOptions): Promise<LLMGenerateResult> {
    const { messages, model } = options

    const result = await generateText({
      model: this.openai.chat(model || this.config.model),
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    })

    return {
      content: result.text,
      usage: result.usage
        ? {
            promptTokens: result.usage.inputTokens,
            completionTokens: result.usage.outputTokens,
          }
        : undefined,
    }
  }
}
