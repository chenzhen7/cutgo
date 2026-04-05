import {
  type LLMProvider,
  type LLMGenerateOptions,
  type LLMGenerateResult,
  DEFAULT_LLM_TIMEOUT_MS,
  DEFAULT_LLM_MAX_RETRIES,
} from "../types"
import { generateText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { logAIEvent } from "../logging"

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
    this.openai = createOpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl.replace(/\/$/, ""),
    })
  }

  /**
   * 调用 /chat/completions 接口
   */
  async chat(options: LLMGenerateOptions): Promise<LLMGenerateResult> {
    const { messages, model, maxTokens, timeoutMs } = options

    const requestPayload = {
      model: model || this.config.model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      ...(maxTokens != null ? { maxOutputTokens: maxTokens } : {}),
    }

    logAIEvent("llm", "request", {
      provider: this.id,
      body: requestPayload,
    })

    const result = await generateText({
      model: this.openai.chat(model || this.config.model),
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      ...(maxTokens != null ? { maxOutputTokens: maxTokens } : {}),
      maxRetries: DEFAULT_LLM_MAX_RETRIES,
      timeout: timeoutMs || DEFAULT_LLM_TIMEOUT_MS,
    })

    logAIEvent("llm", "response", {
      provider: this.id,
      body: {
        text: result.text,
        usage: result.usage,
      },
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
