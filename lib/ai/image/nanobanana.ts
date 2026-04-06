import type { ImageGenerateOptions, ImageGenerateResult, ImageProvider } from "../types"
import { throwCutGoError } from "@/lib/api-error"
import { fetchImageAsBase64, persistGeneratedImageLocally } from "@/lib/utils/local-image"
import { logAIEvent } from "../logging"

export interface NanobananaImageConfig {
  apiKey: string
  baseUrl: string
  model: string
}

interface GeminiGenerateContentResponse {
  candidates?: {
    content?: {
      parts?: {
        text?: string
        inlineData?: {
          mimeType: string
          data: string
        }
        inline_data?: {
          mime_type: string
          data: string
        }
      }[]
    }
  }[]
  error?: {
    message: string
  }
}

/**
 * Google Gemini (Nano Banana) 图片生成 Provider
 * 使用官方 Gemini API 规范：https://generativelanguage.googleapis.com/v1beta/models/...:generateContent
 */
export class NanobananaImageProvider implements ImageProvider {
  readonly id = "nanobanana"
  private readonly baseUrl: string

  constructor(private readonly config: NanobananaImageConfig) {
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
    const { prompt: rawPrompt, negativePrompt, aspectRatio, projectId, scope, referenceImages } = options
    const prompt = this.buildPrompt(rawPrompt, negativePrompt)

    const url = `${this.baseUrl}/models/${this.config.model}:generateContent`

    const parts: any[] = [{ text: prompt }]

    if (referenceImages && referenceImages.length > 0) {
      const validImages = referenceImages.map(item => item.trim()).filter(Boolean)
      if (validImages.length > 0) {
        const base64Images = await Promise.all(
          validImages.map(imgUrl => fetchImageAsBase64(imgUrl))
        )
        for (const b64 of base64Images) {
          const match = b64.match(/^data:([^;]+);base64,(.+)$/)
          if (match) {
            parts.push({
              inlineData: {
                mimeType: match[1],
                data: match[2],
              }
            })
          }
        }
      }
    }

    const requestBody = {
      contents: [
        {
          parts,
        }
      ],
      generationConfig: {
        responseModalities: ["IMAGE"],
        imageConfig: {
          aspectRatio,
        }
      }
    }

    logAIEvent("image", "request", {
      provider: this.id,
      body: requestBody,
    })

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": this.config.apiKey,
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(300_000),
    })

    if (!res.ok) {
      const errorText = await res.text()
      throwCutGoError("INTERNAL", `status=${res.status}，error=${errorText}`)
    }

    const json = (await res.json()) as GeminiGenerateContentResponse

    logAIEvent("image", "response", {
      provider: this.id,
      body: json,
    })

    if (json.error) {
      throwCutGoError("INTERNAL", `Gemini 生图服务返回错误：${json.error.message}`)
    }

    const firstCandidate = json.candidates?.[0]
    const responseParts = firstCandidate?.content?.parts || []
    
    let imageDataUrl = ""
    for (const part of responseParts) {
      const inline: any = part.inlineData || part.inline_data
      if (inline && inline.data) {
        const mime = inline.mimeType || inline.mime_type || "image/png"
        imageDataUrl = `data:${mime};base64,${inline.data}`
        break
      }
    }

    if (!imageDataUrl) {
      throwCutGoError("INTERNAL", "Gemini 生图服务未返回有效图片数据")
    }

    const persistedUrl = await persistGeneratedImageLocally({
      sourceUrl: imageDataUrl,
      projectId,
      scope,
    })

    return { url: persistedUrl }
  }

  private buildPrompt(prompt: string, negativePrompt?: string): string {
    if (!negativePrompt?.trim()) return prompt
    return `${prompt}\n\nNegative prompt: ${negativePrompt}`
  }
}
