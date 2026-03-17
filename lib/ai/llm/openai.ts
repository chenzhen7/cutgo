import type { LLMProvider, LLMGenerateOptions, LLMGenerateResult } from "../types"

export interface OpenAICompatibleConfig {
  apiKey: string
  baseUrl: string
  model: string
}

/**
 * OpenAI 兼容接口（适用于 OpenAI、DeepSeek、月之暗面、智谱等）
 * 统一走 /chat/completions
 */
export function createOpenAILLMProvider(config: OpenAICompatibleConfig): LLMProvider {
  return {
    id: "openai",
    async chat(options: LLMGenerateOptions): Promise<LLMGenerateResult> {
      const { messages, model, temperature = 0.3, maxTokens, responseFormat } = options
      const url = `${config.baseUrl.replace(/\/$/, "")}/chat/completions`
      const body: Record<string, unknown> = {
        model: model || config.model,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        temperature,
      }
      if (maxTokens != null) body.max_tokens = maxTokens
      if (responseFormat === "json_object") {
        body.response_format = { type: "json_object" }
      }

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`LLM API error ${res.status}: ${errText}`)
      }

      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>
        usage?: { prompt_tokens?: number; completion_tokens?: number }
      }
      const content = data.choices?.[0]?.message?.content ?? ""
      const usage = data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
          }
        : undefined

      return { content, usage }
    },
  }
}
