import { getImageConfig } from "../config"
import { PlaceholderImageProvider } from "./placeholder"
import type { ImageProvider } from "../types"

/**
 * 获取当前配置的图像生成 Provider（异步，从数据库读取配置）。
 * 如果未配置 API Key 或配置为 placeholder，则返回占位图实现，确保业务流程不中断。
 */
export async function getImageProvider(): Promise<ImageProvider> {
  const config = await getImageConfig()
  
  // 根据配置选择不同的 Provider
  if (config?.provider === "openai" && config.apiKey) {
    // 待实现：OpenAI DALL-E 3
    // const { OpenAIImageProvider } = await import("./openai")
    // return new OpenAIImageProvider(config)
    return new PlaceholderImageProvider()
  } else if (config?.provider === "comfyui" && config.baseUrl) {
    // 待实现：ComfyUI 接口
    // const { ComfyUIImageProvider } = await import("./comfyui")
    // return new ComfyUIImageProvider(config)
    return new PlaceholderImageProvider()
  } else {
    // 默认返回占位图 Provider
    return new PlaceholderImageProvider()
  }
}
