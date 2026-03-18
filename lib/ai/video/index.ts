import { getVideoConfig } from "../config"
import { PlaceholderVideoProvider } from "./placeholder"
import type { VideoProvider } from "../types"

// 缓存 Provider 实例
let cachedProvider: VideoProvider | null = null

/**
 * 获取当前配置的视频生成 Provider（异步，从数据库读取配置）。
 * 如果没有 API Key，则返回占位实现。
 */
export async function getVideoProvider(): Promise<VideoProvider> {
  if (cachedProvider) return cachedProvider

  const config = await getVideoConfig()

  if (config?.provider === "runway" && config.apiKey) {
    // 待实现：Runway Gen-2/Gen-3 接口
    // const { RunwayVideoProvider } = await import("./runway")
    // cachedProvider = new RunwayVideoProvider(config)
    cachedProvider = new PlaceholderVideoProvider()
  } else {
    cachedProvider = new PlaceholderVideoProvider()
  }

  return cachedProvider
}

/**
 * 清除 Provider 缓存
 */
export function clearVideoProviderCache(): void {
  cachedProvider = null
}
