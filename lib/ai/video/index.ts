import { getVideoConfig } from "../config"
import { throwCutGoError } from "@/lib/api-error"
import { DoubaoVideoProvider } from "./doubao"
import { PlaceholderVideoProvider } from "./placeholder"
import { logAIEvent } from "../logging"
import type {
  VideoProvider,
  VideoGenerateOptions,
  VideoGenerateResult,
  VideoTaskStatus,
} from "../types"

/** 视频模型配置运行时参数定义 */
export interface VideoProviderRuntimeConfig {
  provider: string
  apiKey: string
  baseUrl: string
  model: string
}

/**
 * 获取当前配置的视频生成 Provider（异步，从数据库读取配置）。
 * 无配置时返回 PlaceholderVideoProvider，确保业务流程不中断。
 */
export async function getVideoProvider(): Promise<VideoProvider> {
  const config = await getVideoConfig()
  if (!config) return new PlaceholderVideoProvider()

  const provider = createVideoProviderFromConfig(config)
  return provider ?? new PlaceholderVideoProvider()
}

/**
 * 根据运行时传入的配置创建视频 Provider。
 * 不读取数据库，适合"测试连接"等场景。
 * 未能匹配任何已知 provider 时返回 null。
 */
export function createVideoProviderFromConfig(
  config: VideoProviderRuntimeConfig
): VideoProvider | null {
  if (!config.apiKey) return null

  if (config.provider === "doubao") {
    return new DoubaoVideoProvider({
      apiKey: config.apiKey,
      baseUrl: config.baseUrl || "https://ark.cn-beijing.volces.com/api/v3",
      model: config.model,
    })
  }

  return null
}

/**
 * 使用当前生效配置发起视频生成任务。
 * 未配置时抛出 VIDEO_NOT_CONFIGURED，由上层 route 统一转换为标准错误响应。
 */
export async function callVideo(
  options: VideoGenerateOptions,
  providerOverride?: VideoProvider
): Promise<VideoGenerateResult> {
  let provider = providerOverride

  if (!provider) {
    const config = await getVideoConfig()
    if (!config) {
      throwCutGoError("VIDEO_NOT_CONFIGURED")
    }

    provider = createVideoProviderFromConfig(config) ?? undefined
  }

  if (!provider) {
    throwCutGoError("VIDEO_NOT_CONFIGURED")
  }

  logAIEvent("video", "request", {
    provider: provider.id,
    body: options,
  })

  const result = await provider.generate(options)

  logAIEvent("video", "response", {
    provider: provider.id,
    body: result,
  })

  return result
}

/**
 * 查询视频生成任务状态。
 * 未配置时抛出 VIDEO_NOT_CONFIGURED。
 */
export async function queryVideoTask(
  taskId: string,
  providerOverride?: VideoProvider
): Promise<VideoTaskStatus> {
  let provider = providerOverride

  if (!provider) {
    const config = await getVideoConfig()
    if (!config) {
      throwCutGoError("VIDEO_NOT_CONFIGURED")
    }

    provider = createVideoProviderFromConfig(config) ?? undefined
  }

  if (!provider) {
    throwCutGoError("VIDEO_NOT_CONFIGURED")
  }

  logAIEvent("video", "request", {
    provider: provider.id,
    action: "queryTask",
    taskId,
  })

  const status = await provider.queryTask(taskId)

  logAIEvent("video", "response", {
    provider: provider.id,
    action: "queryTask",
    taskId,
    status,
  })

  return status
}
