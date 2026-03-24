import {
  DEFAULT_LLM_MAX_RETRIES,
  DEFAULT_LLM_TIMEOUT_MS,
  type LLMProvider,
  type LLMGenerateOptions,
  type LLMGenerateResult,
} from "../types"
import { generateText } from "ai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"

export interface GoogleLLMConfig {
  apiKey: string
  /** 留空则使用 SDK 默认（Google AI Studio：`generativelanguage.googleapis.com/v1beta`） */
  baseUrl: string
  model: string
}

/**
 * Google Gemini（Generative Language API）
 * API Key 见 https://aistudio.google.com/apikey
 */
export class GoogleLLMProvider implements LLMProvider {
  readonly id = "google"
  private readonly googleAI

  constructor(private readonly config: GoogleLLMConfig) {
    const base = config.baseUrl?.trim().replace(/\/$/, "")
    this.googleAI = createGoogleGenerativeAI({
      apiKey: config.apiKey,
      baseURL: base || undefined,
    })
  }

  async chat(options: LLMGenerateOptions): Promise<LLMGenerateResult> {
    const { messages, model, maxTokens, timeoutMs } = options
    const modelId = model || this.config.model

    const result = await generateText({
      model: this.googleAI.chat(modelId),
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      ...(maxTokens != null ? { maxOutputTokens: maxTokens } : {}),
      maxRetries: DEFAULT_LLM_MAX_RETRIES,
      timeout: timeoutMs || DEFAULT_LLM_TIMEOUT_MS,
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
