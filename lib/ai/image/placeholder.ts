import type { ImageProvider, ImageGenerateOptions, ImageGenerateResult } from "../types"

/**
 * 无 Key 或未配置生图时的占位实现：返回 placeholder 图片 URL
 */
export function createPlaceholderImageProvider(): ImageProvider {
  function makePlaceholderUrl(prompt: string, width: number, height: number, index?: number): string {
    const label = encodeURIComponent(
      (index != null ? `#${index + 1} ` : "") + prompt.slice(0, 30).replace(/[^\w\s]/g, "")
    )
    const colors = ["264653", "2a9d8f", "e9c46a", "f4a261", "e76f51", "606c38"]
    const bg = colors[Math.floor(Math.random() * colors.length)]
    return `https://placehold.co/${width}x${height}/${bg}/white?text=${label}`
  }

  return {
    id: "placeholder",
    async generate(options: ImageGenerateOptions): Promise<ImageGenerateResult | ImageGenerateResult[]> {
      const { prompt, width, height, numOutputs = 1 } = options
      if (numOutputs > 1) {
        return Array.from({ length: numOutputs }, (_, i) => ({
          url: makePlaceholderUrl(prompt, width, height, i),
        }))
      }
      return { url: makePlaceholderUrl(prompt, width, height) }
    },
  }
}
