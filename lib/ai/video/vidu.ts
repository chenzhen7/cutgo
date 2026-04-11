import type {
  VideoProvider,
  VideoGenerateOptions,
  VideoGenerateResult,
  VideoTaskStatus,
} from "../types"
import { throwCutGoError } from "@/lib/api-error"
import { fetchImageAsBase64 } from "@/lib/utils/local-image"
import { logAIEvent } from "../logging"

export interface ViduVideoConfig {
  apiKey: string
  baseUrl: string
  model: string
  resolution?: string
}

/** 创建任务响应 */
interface ViduVideoCreateResponse {
  task_id?: string
  error?: string // 在某些失败情况下可能有 error 字段
}

/** 查询任务响应 */
interface ViduVideoQueryResponse {
  id?: string
  state?: "created" | "queueing" | "processing" | "success" | "failed"
  err_code?: string
  creations?: Array<{
    id: string
    url: string
    cover_url?: string
  }>
}

/**
 * Vidu 视频生成 Provider
 * 官网：https://platform.vidu.com/
 * 支持模型：viduq3-turbo, viduq3-pro, viduq2-pro, viduq2, viduq1
 */
export class ViduVideoProvider implements VideoProvider {
  readonly id = "vidu"

  private readonly baseUrl: string

  constructor(private readonly config: ViduVideoConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "") || "https://api.vidu.com"
  }

  async generate(options: VideoGenerateOptions): Promise<VideoGenerateResult> {
    const {
      prompt,
      imageUrls,
      durationSeconds,
      ratio,
      generateAudio = false,
      seed,
    } = options

    const hasTwoImages = imageUrls && imageUrls.length >= 2
    const endpoint = hasTwoImages ? "/ent/v2/start-end2video" : "/ent/v2/img2video"
    const url = `${this.baseUrl}${endpoint}`
    // 没有图片不能生成视频，图片最多只能有2张，超过进行切割
    if (!imageUrls || imageUrls.length === 0) {
      throw new Error("生成视频至少需要1张图片")
    }
    let usedImageUrls = imageUrls
    if (imageUrls.length > 2) {
      usedImageUrls = imageUrls.slice(0, 2)
    }
    const body: Record<string, any> = {
      model: this.config.model,
      prompt,
    }
    // Vidu 需要 data:image/png;base64, 前缀或图片 URL
    const base64Urls = await Promise.all(
      usedImageUrls!.map(async (url) => {
        if (url.startsWith("http")) {
          return url
        }
        const b64 = await fetchImageAsBase64(url)
        return b64.startsWith("data:") ? b64 : `data:image/png;base64,${b64}`
      })
    )
    body.images = base64Urls

    if (durationSeconds !== undefined) {
      body.duration = durationSeconds
    }

    body.resolution = this.config.resolution || "1080p"

    if (ratio) {
      body.aspect_ratio = ratio
    }

    if (seed !== undefined && seed !== -1) {
      body.seed = seed
    }

    if (generateAudio) {
      body.audio = true
    }

    logAIEvent("video", "request", {
      provider: this.id,
      url,
      body,
    })

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // 注意：Vidu API 使用 Token {your_api_key} 格式
        Authorization: `Token ${this.config.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(300_000),
    })

    if (!res.ok) {
      const errorText = await res.text()
      throwCutGoError("INTERNAL", `Vidu视频任务创建失败 status=${res.status}，error=${errorText}`)
    }

    const json = (await res.json()) as ViduVideoCreateResponse

    logAIEvent("video", "response", {
      provider: this.id,
      body: json,
    })

    if (!json.task_id) {
      throwCutGoError("INTERNAL", "Vidu视频服务未返回 task_id")
    }

    return { taskId: json.task_id }
  }

  async queryTask(taskId: string): Promise<VideoTaskStatus> {
    logAIEvent("video", "request", {
      provider: this.id,
      action: "queryTask",
      taskId,
    })

    const url = `${this.baseUrl}/ent/v2/tasks/${encodeURIComponent(taskId)}/creations`
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${this.config.apiKey}`,
      },
      signal: AbortSignal.timeout(15_000),
    })

    if (!res.ok) {
      const errorText = await res.text()
      throwCutGoError("INTERNAL", `Vidu视频任务查询失败 status=${res.status}，error=${errorText}`)
    }

    const json = (await res.json()) as ViduVideoQueryResponse

    logAIEvent("video", "response", {
      provider: this.id,
      action: "queryTask",
      taskId,
      body: json,
    })

    switch (json.state) {
      case "created":
      case "queueing":
        return { status: "pending" }
      case "processing":
        return { status: "processing" }
      case "success": {
        const videoUrl = json.creations?.[0]?.url
        if (!videoUrl) {
          throwCutGoError("INTERNAL", "Vidu视频任务成功但未返回视频 URL")
        }
        return { status: "success", url: videoUrl }
      }
      case "failed":
        return { status: "failed", reason: json.err_code || "Vidu 视频生成失败" }
      default:
        return { status: "processing" }
    }
  }
}
