import type { ImageGenerateOptions, ImageGenerateResult, ImageProvider } from "../types"
import { throwCutGoError } from "@/lib/api-error"

export interface DoubaoImageConfig {
  apiKey: string
  baseUrl: string
  model: string
}

interface DoubaoImageDataItem {
  url?: string
  b64_json?: string
}

interface DoubaoImageResponse {
  data?: DoubaoImageDataItem[]
}

/**
 * 火山方舟（豆包/即梦）图片生成 Provider（OpenAI 兼容 Images API）
 * 仅支持 4.0+ 模型：doubao-seedream-4-0-250828 / 4-5 / 5-0。
 */
export class DoubaoImageProvider implements ImageProvider {
  readonly id = "doubao"
  private readonly isDev: boolean

  constructor(private readonly config: DoubaoImageConfig) {
    this.isDev = process.env.NODE_ENV === "development"
  }

  async generate(options: ImageGenerateOptions): Promise<ImageGenerateResult | ImageGenerateResult[]> {
    const { numOutputs = 1 } = options
    if (numOutputs <= 1) {
      return this.generateSingle(options)
    }

    const tasks = Array.from({ length: numOutputs }, () => this.generateSingle(options))
    return Promise.all(tasks)
  }

  private async generateSingle(options: ImageGenerateOptions): Promise<ImageGenerateResult> {
    const prompt = this.buildPrompt(options.prompt, options.negativePrompt)
    const url = `${this.config.baseUrl.replace(/\/$/, "")}/images/generations`

    console.log("[Doubao Image] request", {
      url,
      model: this.config.model,
      size: `${options.width}x${options.height}`,
      promptPreview:
        prompt.length > 200 ? `${prompt.slice(0, 200)}…` : prompt,
    })

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        prompt,
        size: `${options.width}x${options.height}`,
        response_format: "url",
      }),
      signal: AbortSignal.timeout(300_000),
    })

    if (this.isDev) {
      console.log("[Doubao Image] response status", res.status, res.statusText)
    }

    if (!res.ok) {
      const errorText = await res.text()

      throwCutGoError(
        "INTERNAL",`status=${res.status}，error=${errorText}`
      )
    }

    const json = (await res.json()) as DoubaoImageResponse

    const raw = JSON.stringify(json)
      console.log(
        "[Doubao Image] response body (truncated)",
        raw.length > 100 ? `${raw.slice(0, 100)}…` : raw
      )

    const first = json.data?.[0]
    if (!first) {
      throwCutGoError("INTERNAL", "豆包生图服务未返回有效图片数据")
    }

    if (first.url) {
      return { url: first.url }
    }

    if (first.b64_json) {
      return { url: `data:image/png;base64,${first.b64_json}` }
    }

    throwCutGoError("INTERNAL", "豆包生图服务返回格式异常：缺少图片地址")
  }

  private buildPrompt(prompt: string, negativePrompt?: string): string {
    if (!negativePrompt?.trim()) return prompt
    return `${prompt}\n\nNegative prompt: ${negativePrompt}`
  }
}
