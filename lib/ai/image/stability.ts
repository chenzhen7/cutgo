import type { ImageProvider, ImageGenerateOptions, ImageGenerateResult } from "../types"

export interface StabilityImageConfig {
  apiKey: string
  baseUrl: string
  model: string
}

interface StabilityTextPrompt {
  text: string
  weight: number
}

interface StabilityArtifact {
  base64: string
  finishReason: string
}

/**
 * 将宽高对齐到 Stability AI 要求的 64 的倍数
 */
function alignTo64(value: number): number {
  return Math.round(value / 64) * 64 || 64
}

/**
 * Stability AI (SDXL) 图像生成 Provider
 * 调用 /v1/generation/{engine_id}/text-to-image 接口
 * 返回 base64 编码图像，转换为 data URI
 */
export class StabilityImageProvider implements ImageProvider {
  readonly id = "stability"

  constructor(private readonly config: StabilityImageConfig) { }

  async generate(options: ImageGenerateOptions): Promise<ImageGenerateResult | ImageGenerateResult[]> {
    const { prompt, negativePrompt, width, height, numOutputs = 1 } = options

    const baseUrl = this.config.baseUrl.replace(/\/$/, "")
    const engineId = this.config.model || "stable-diffusion-xl-1024-v1-0"
    const url = `${baseUrl}/generation/${engineId}/text-to-image`

    const textPrompts: StabilityTextPrompt[] = [{ text: prompt, weight: 1.0 }]
    if (negativePrompt) {
      textPrompts.push({ text: negativePrompt, weight: -1.0 })
    }

    const body = {
      text_prompts: textPrompts,
      cfg_scale: 7,
      width: alignTo64(width),
      height: alignTo64(height),
      steps: 30,
      samples: numOutputs,
    }

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Stability AI API error ${res.status}: ${errText}`)
    }

    const json = await res.json() as { artifacts: StabilityArtifact[] }
    if (!json.artifacts?.length) {
      throw new Error("Stability AI API returned no artifacts")
    }

    const results: ImageGenerateResult[] = json.artifacts.map((artifact) => ({
      url: `data:image/png;base64,${artifact.base64}`,
    }))

    return numOutputs === 1 ? results[0] : results
  }
}
