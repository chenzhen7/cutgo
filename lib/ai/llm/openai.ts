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
 * OpenAI 兼容的 LLM Provider（构造器方式）
 * 适用于 OpenAI、DeepSeek、月之暗面、智谱等遵循 OpenAI API 标准的服务商
 */
export class OpenAILLMProvider implements LLMProvider {
  readonly id = "openai"
  private readonly openai

  constructor(private readonly config: OpenAICompatibleConfig) {
    this.openai = createOpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl.replace(/\/$/, ""),
    })
  }

  /**
   * 调用对话补全接口
   */
  async chat(options: LLMGenerateOptions): Promise<LLMGenerateResult> {
    const { messages, model, temperature = 0.3, maxTokens, responseFormat } = options
    const result = await generateText({
      model: this.openai(model || this.config.model),
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature,
      maxOutputTokens: maxTokens,
      providerOptions:
        responseFormat === "json_object"
          ? {
              openai: {
                responseFormat: { type: "json_object" },
              },
            }
          : undefined,
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
