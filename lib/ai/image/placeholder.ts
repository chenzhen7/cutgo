import type { ImageProvider, ImageGenerateOptions, ImageGenerateResult } from "../types"

/**
 * 图像生成占位实现
 * 当用户未配置 API Key 或处于测试环境时使用。
 * 它不调用任何 AI 接口，而是根据 prompt 生成一个带文字的彩色背景图。
 */
export function createPlaceholderImageProvider(): ImageProvider {
  /**
   * 生成一个基于 placehold.co 的图片 URL
   */
  function makePlaceholderUrl(prompt: string, width: number, height: number, index?: number): string {
    // 对 prompt 进行简单清理，防止 URL 编码问题
    const label = encodeURIComponent(
      (index != null ? `#${index + 1} ` : "") + prompt.slice(0, 30).replace(/[^\w\s]/g, "")
    )
    
    // 随机选择一个背景颜色
    const colors = ["264653", "2a9d8f", "e9c46a", "f4a261", "e76f51", "606c38"]
    const bg = colors[Math.floor(Math.random() * colors.length)]
    
    return `https://placehold.co/${width}x${height}/${bg}/white?text=${label}`
  }

  return {
    id: "placeholder",
    /**
     * 模拟生成图片
     */
    async generate(options: ImageGenerateOptions): Promise<ImageGenerateResult | ImageGenerateResult[]> {
      const { prompt, width, height, numOutputs = 1 } = options
      
      // 如果请求多张图片，返回数组
      if (numOutputs > 1) {
        return Array.from({ length: numOutputs }, (_, i) => ({
          url: makePlaceholderUrl(prompt, width, height, i),
        }))
      }
      
      // 默认返回单张图片对象
      return { url: makePlaceholderUrl(prompt, width, height) }
    },
  }
}
