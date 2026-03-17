import { getVideoConfig } from "../config"
import type { VideoProvider, VideoGenerateOptions, VideoGenerateResult } from "../types"

// 缓存 Provider 实例
let cachedProvider: VideoProvider | null = null

/**
 * 视频生成占位实现
 * 用于测试或未配置 API Key 的情况。
 */
function createPlaceholderVideoProvider(): VideoProvider {
  return {
    id: "placeholder",
    async generate(_options: VideoGenerateOptions): Promise<VideoGenerateResult> {
      // 模拟返回一个任务 ID
      return { taskId: "placeholder", statusUrl: "" }
    },
  }
}

/**
 * 获取当前配置的视频生成 Provider（异步，从数据库读取配置）。
 * 如果没有 API Key，则返回占位实现。
 */
export async function getVideoProvider(): Promise<VideoProvider> {
  if (cachedProvider) return cachedProvider
  
  const config = await getVideoConfig()
  
  if (config?.provider === "runway" && config.apiKey) {
    // 待实现：Runway Gen-2/Gen-3 接口
    // const { createRunwayVideoProvider } = await import("./runway")
    // cachedProvider = createRunwayVideoProvider(config)
    cachedProvider = createPlaceholderVideoProvider()
  } else {
    cachedProvider = createPlaceholderVideoProvider()
  }
  
  return cachedProvider
}

/**
 * 清除 Provider 缓存
 */
export function clearVideoProviderCache(): void {
  cachedProvider = null
}
