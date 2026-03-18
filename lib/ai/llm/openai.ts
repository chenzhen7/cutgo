import type { LLMProvider, LLMGenerateOptions, LLMGenerateResult } from "../types"

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

  constructor(private readonly config: OpenAICompatibleConfig) {}

  /**
   * 调用对话补全接口
   */
  async chat(options: LLMGenerateOptions): Promise<LLMGenerateResult> {
    const { messages, model, temperature = 0.3, maxTokens, responseFormat } = options

    // 拼接 API 地址，确保结尾没有多余的斜杠
    const url = `${this.config.baseUrl.replace(/\/$/, "")}/chat/completions`

    // 构建请求体
    const body: Record<string, unknown> = {
      model: model || this.config.model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature,
    }

    if (maxTokens != null) body.max_tokens = maxTokens

    // 支持 JSON Mode
    if (responseFormat === "json_object") {
      body.response_format = { type: "json_object" }
    }

    // 发起 fetch 请求
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
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

    // 解析返回内容
    const content = data.choices?.[0]?.message?.content ?? ""

    // 解析 Token 使用情况
    const usage = data.usage
      ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
        }
      : undefined

    return { content, usage }
  }
}
