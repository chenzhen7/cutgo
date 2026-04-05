import { getImageConfig } from "../config"
import { throwCutGoError } from "@/lib/api-error"
import { DoubaoImageProvider } from "./doubao"
import { PlaceholderImageProvider } from "./placeholder"
import { StabilityImageProvider } from "./stability"
import type { ImageGenerateOptions, ImageGenerateResult, ImageProvider } from "../types"
import { logAIEvent } from "../logging"

/** 图像模型配置运行时参数定义 */
export interface ImageProviderRuntimeConfig {
  provider: string
  apiKey: string
  baseUrl: string
  model: string
}

/**
 * 获取当前配置的图像生成 Provider（异步，从数据库读取配置）。
 * 无配置时返回 PlaceholderImageProvider，确保业务流程不中断。
 */
export async function getImageProvider(): Promise<ImageProvider> {
  const config = await getImageConfig()
  if (!config) return new PlaceholderImageProvider()

  const provider = createImageProviderFromConfig(config)
  return provider ?? new PlaceholderImageProvider()
}

/**
 * 根据运行时传入的配置创建图像 Provider。
 * 不读取数据库，适合"测试连接"等场景。
 * 未能匹配任何已知 provider 时返回 null。
 */
export function createImageProviderFromConfig(
  config: ImageProviderRuntimeConfig
): ImageProvider | null {
  if (!config.apiKey && config.provider !== "comfyui") return null

  if (config.provider === "doubao") {
    return new DoubaoImageProvider({
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      model: config.model,
    })
  }

  if (config.provider === "stability") {
    return new StabilityImageProvider({
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      model: config.model,
    })
  }

  // ComfyUI 及其他 provider 暂未实现，降级为占位图
  return null
}

/**
 * 使用当前生效配置调用图像生成接口。
 * 未配置时抛出 IMAGE_NOT_CONFIGURED，由上层 route 统一转换为标准错误响应。
 */
export async function callImage(
  options: ImageGenerateOptions,
  customProvider?: ImageProvider
): Promise<ImageGenerateResult | ImageGenerateResult[]> {
  let provider = customProvider

  if (!provider) {
    const config = await getImageConfig()
    if (!config) {
      throwCutGoError("IMAGE_NOT_CONFIGURED")
    }
    provider = createImageProviderFromConfig(config) ?? undefined
  }

  if (!provider) {
    throwCutGoError("IMAGE_NOT_CONFIGURED")
  }

  const result = await provider.generate(options)
  return result

}
