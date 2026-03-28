import { getVideoConfig } from "../config"
import { PlaceholderVideoProvider } from "./placeholder"
import type { VideoProvider } from "../types"

/**
 * 获取当前配置的视频生成 Provider（异步，从数据库读取配置）。
 * 如果没有 API Key，则返回占位实现。
 */
export async function getVideoProvider(): Promise<VideoProvider> {
  const config = await getVideoConfig()

  if (config?.provider === "runway" && config.apiKey) {
    // 待实现：Runway Gen-2/Gen-3 接口
    // const { RunwayVideoProvider } = await import("./runway")
    // return new RunwayVideoProvider(config)
    return new PlaceholderVideoProvider()
  } else {
    return new PlaceholderVideoProvider()
  }
}

/**
 * 清除 Provider 缓存。
 * 已废弃：现在 getVideoProvider 每次都会读取最新配置。
 */
export function clearVideoProviderCache(): void {
  // 保持函数存在以兼容现有调用
}
