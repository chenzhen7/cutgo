import { getImageConfig } from "../config"
import { createPlaceholderImageProvider } from "./placeholder"
import type { ImageProvider } from "../types"

// 缓存 Provider 实例
let cachedProvider: ImageProvider | null = null

/**
 * 获取当前配置的图像生成 Provider（异步，从数据库读取配置）。
 * 如果未配置 API Key 或配置为 placeholder，则返回占位图实现，确保业务流程不中断。
 */
export async function getImageProvider(): Promise<ImageProvider> {
  if (cachedProvider) return cachedProvider
  
  const config = await getImageConfig()
  
  // 根据配置选择不同的 Provider
  if (config.provider === "openai" && config.apiKey) {
    // 待实现：OpenAI DALL-E 3
    // const { createOpenAIImageProvider } = await import("./openai")
    // cachedProvider = createOpenAIImageProvider(config)
    cachedProvider = createPlaceholderImageProvider()
  } else if (config.provider === "comfyui" && config.baseUrl) {
    // 待实现：ComfyUI 接口
    // const { createComfyUIImageProvider } = await import("./comfyui")
    // cachedProvider = createComfyUIImageProvider(config)
    cachedProvider = createPlaceholderImageProvider()
  } else {
    // 默认返回占位图 Provider
    cachedProvider = createPlaceholderImageProvider()
  }
  
  return cachedProvider
}

/**
 * 清除 Provider 缓存
 */
export function clearImageProviderCache(): void {
  cachedProvider = null
}
