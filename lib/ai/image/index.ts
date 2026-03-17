import { getImageConfig } from "../config"
import { createPlaceholderImageProvider } from "./placeholder"
import type { ImageProvider } from "../types"

let cachedProvider: ImageProvider | null = null

/**
 * 获取当前配置的 Image Provider。
 * 无 Key 或配置为 placeholder 时返回占位实现（始终可用）。
 */
export function getImageProvider(): ImageProvider {
  if (cachedProvider) return cachedProvider
  const config = getImageConfig()
  if (config.provider === "openai" && config.apiKey) {
    // 可选：动态 import 避免无 openai 依赖时报错
    // const { createOpenAIImageProvider } = await import("./openai")
    // cachedProvider = createOpenAIImageProvider(config)
    // 暂时仍用 placeholder，接入 DALL·E 时在此处挂载
    cachedProvider = createPlaceholderImageProvider()
  } else if (config.provider === "comfyui" && config.baseUrl) {
    // 可选：const { createComfyUIImageProvider } = await import("./comfyui")
    // cachedProvider = createComfyUIImageProvider(config)
    cachedProvider = createPlaceholderImageProvider()
  } else {
    cachedProvider = createPlaceholderImageProvider()
  }
  return cachedProvider
}

export function clearImageProviderCache(): void {
  cachedProvider = null
}
