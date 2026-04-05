import type { ImageGenerateOptions, ImageGenerateResult, ImageProvider } from "../types"
import { throwCutGoError } from "@/lib/api-error"
import { persistGeneratedImageLocally, fetchImageAsBase64 } from "@/lib/utils/local-image"
import { logAIEvent } from "../logging"

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

type DoubaoImageInput = string | string[] | undefined

/**
 * 火山方舟（豆包/即梦）图片生成 Provider（OpenAI 兼容 Images API）
 * 仅支持 4.0+ 模型：doubao-seedream-4-0-250828 / 4-5 / 5-0。
 */
export class DoubaoImageProvider implements ImageProvider {
  readonly id = "doubao"

  private readonly baseUrl: string

  constructor(private readonly config: DoubaoImageConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "")
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
    const { prompt: rawPrompt, negativePrompt, aspectRatio, referenceImages, projectId, scope } = options
    const prompt = this.buildPrompt(rawPrompt, negativePrompt)
    const url = `${this.baseUrl}/images/generations`
    const imageInput = await this.resolveImageInput(referenceImages)

    const requestBody = {
      model: this.config.model,
      prompt,
      ratio: aspectRatio,
      ...(imageInput ? { image: imageInput } : {}),
      response_format: "url",
    }

    logAIEvent("image", "request", {
      provider: this.id,
      body: requestBody,
    })

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(300_000),
    })

    if (!res.ok) {
      const errorText = await res.text()

      throwCutGoError(
        "INTERNAL", `status=${res.status}，error=${errorText}`
      )
    }

    const json = (await res.json()) as DoubaoImageResponse

    logAIEvent("image", "response", {
      provider: this.id,
      body: json,
    })

    const first = json.data?.[0]
    if (!first) {
      throwCutGoError("INTERNAL", "豆包生图服务未返回有效图片数据")
    }

    if (first.url) {
      const persistedUrl = await persistGeneratedImageLocally({
        sourceUrl: first.url,
        projectId,
        scope,
      })
      return { url: persistedUrl }
    }

    if (first.b64_json) {
      const dataUrl = `data:image/png;base64,${first.b64_json}`
      const persistedUrl = await persistGeneratedImageLocally({
        sourceUrl: dataUrl,
        projectId,
        scope,
      })
      return { url: persistedUrl }
    }

    throwCutGoError("INTERNAL", "豆包生图服务返回格式异常：缺少图片地址")
  }

  private buildPrompt(prompt: string, negativePrompt?: string): string {
    if (!negativePrompt?.trim()) return prompt
    return `${prompt}\n\nNegative prompt: ${negativePrompt}`
  }

  /** 参考图：URL 或 data:image/...;base64,...；单张 string，多张 string[] */
  private async resolveImageInput(referenceImages?: string[]): Promise<DoubaoImageInput> {
    const validImages = (referenceImages || []).map((item) => item.trim()).filter(Boolean)
    if (validImages.length === 0) return undefined

    const base64Images = await Promise.all(
      validImages.map((url) => fetchImageAsBase64(url))
    )

    return base64Images.length === 1 ? base64Images[0] : base64Images
  }
}
