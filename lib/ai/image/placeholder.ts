import type { ImageProvider, ImageGenerateOptions, ImageGenerateResult } from "../types"
import { persistGeneratedImageLocally } from "@/lib/utils/local-image"

/**
 * 图像生成占位实现（构造器方式）
 * 当用户未配置 API Key 或处于测试环境时使用。
 * 它不调用任何 AI 接口，而是根据 prompt 生成一个带文字的彩色背景图。
 */
export class PlaceholderImageProvider implements ImageProvider {
  readonly id = "placeholder"

  /**
   * 生成一个基于 placehold.co 的图片 URL
   */
  private makePlaceholderUrl(prompt: string, width: number, height: number, index?: number): string {
    const label = encodeURIComponent(
      (index != null ? `#${index + 1} ` : "") + prompt.slice(0, 30).replace(/[^\w\s]/g, "")
    )
    const colors = ["264653", "2a9d8f", "e9c46a", "f4a261", "e76f51", "606c38"]
    const bg = colors[Math.floor(Math.random() * colors.length)]
    return `https://placehold.co/${width}x${height}/${bg}/white?text=${label}`
  }

  /**
   * 模拟生成图片
   */
  async generate(options: ImageGenerateOptions): Promise<ImageGenerateResult | ImageGenerateResult[]> {
    const { prompt, width, height, numOutputs = 1, projectId, scope } = options
    if (numOutputs > 1) {
      const results = Array.from({ length: numOutputs }, (_, i) => ({
        url: this.makePlaceholderUrl(prompt, width, height, i),
      }))
      return Promise.all(
        results.map(async (item) => ({
          url: await persistGeneratedImageLocally({
            sourceUrl: item.url,
            projectId,
            scope,
          }),
        }))
      )
    }
    const rawUrl = this.makePlaceholderUrl(prompt, width, height)
    const localUrl = await persistGeneratedImageLocally({
      sourceUrl: rawUrl,
      projectId,
      scope,
    })
    return { url: localUrl }
  }
}
