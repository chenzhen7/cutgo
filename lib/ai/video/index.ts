import { getVideoConfig } from "../config"
import type { VideoProvider, VideoGenerateOptions, VideoGenerateResult } from "../types"

let cachedProvider: VideoProvider | null = null

/**
 * 占位：未配置视频 API 时返回假 taskId，业务可据此提示“请配置 Runway 等”
 */
function createPlaceholderVideoProvider(): VideoProvider {
  return {
    id: "placeholder",
    async generate(_options: VideoGenerateOptions): Promise<VideoGenerateResult> {
      return { taskId: "placeholder", statusUrl: "" }
    },
  }
}

/**
 * 获取当前配置的 Video Provider。
 * 无 Key 时返回占位实现。
 */
export function getVideoProvider(): VideoProvider {
  if (cachedProvider) return cachedProvider
  const config = getVideoConfig()
  if (config.provider === "runway" && config.apiKey) {
    // const { createRunwayVideoProvider } = await import("./runway")
    // cachedProvider = createRunwayVideoProvider(config)
    cachedProvider = createPlaceholderVideoProvider()
  } else {
    cachedProvider = createPlaceholderVideoProvider()
  }
  return cachedProvider
}

export function clearVideoProviderCache(): void {
  cachedProvider = null
}
