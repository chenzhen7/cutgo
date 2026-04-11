import type {
  VideoProvider,
  VideoGenerateOptions,
  VideoGenerateResult,
  VideoTaskStatus,
} from "../types"
import { throwCutGoError } from "@/lib/api-error"
import { fetchImageAsBase64 } from "@/lib/utils/local-image"
import { logAIEvent } from "../logging"

export interface AliyunVideoConfig {
  apiKey: string
  baseUrl: string
  model: string
  resolution?: string
}

interface AliyunVideoCreateResponse {
  request_id: string
  output?: {
    task_id: string
    task_status: string
  }
  code?: string
  message?: string
}

interface AliyunVideoQueryResponse {
  request_id: string
  output?: {
    task_id: string
    task_status: string
    video_url?: string
    code?: string
    message?: string
  }
  code?: string
  message?: string
}

/**
 * 阿里云百炼（万相）视频生成 Provider
 * 支持模型：
 *   - wan2.6-i2v-flash, wan2.5-i2v-preview, wan2.2-i2v-plus 等（图生视频）
 *   - wan2.2-kf2v-flash, wanx2.1-kf2v-plus 等（首尾帧生视频）
 */
export class AliyunVideoProvider implements VideoProvider {
  readonly id = "aliyun"

  private readonly baseUrl: string

  constructor(private readonly config: AliyunVideoConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "")
  }

  async generate(options: VideoGenerateOptions): Promise<VideoGenerateResult> {
    const {
      prompt,
      imageUrls,
      durationSeconds,
    } = options

    if (!imageUrls || imageUrls.length === 0) {
      throwCutGoError("VALIDATION", "阿里云视频生成需要至少一张参考图")
    }

    const base64Urls = await Promise.all(
      imageUrls.map((url) => fetchImageAsBase64(url))
    )

    const isWan27 = this.config.model.startsWith("wan2.7")
    const isKeyframe = base64Urls.length >= 2

    // 确定请求 URL
    let endpoint = ""
    if (isWan27) {
      endpoint = "/services/aigc/video-generation/video-synthesis"
    } else {
      endpoint = isKeyframe
        ? "/services/aigc/image2video/video-synthesis"
        : "/services/aigc/video-generation/video-synthesis"
    }
    const url = `${this.baseUrl}${endpoint}`

    const input: Record<string, unknown> = {
      prompt,
    }

    if (isWan27) {
      const media: { type: string; url: string }[] = []
      media.push({ type: "first_frame", url: base64Urls[0] })
      if (isKeyframe) {
        media.push({ type: "last_frame", url: base64Urls[1] })
      }
      input.media = media
    } else {
      if (isKeyframe) {
        input.first_frame_url = base64Urls[0]
        input.last_frame_url = base64Urls[1]
      } else {
        input.img_url = base64Urls[0]
      }
    }

    const parameters: Record<string, unknown> = {
      prompt_extend: true,
    }

    if (this.config.resolution) {
      parameters.resolution = this.config.resolution
    }

    if (durationSeconds !== undefined) {
      parameters.duration = durationSeconds
    }

    const body = {
      model: this.config.model,
      input,
      parameters,
    }

    logAIEvent("video", "request", {
      provider: this.id,
      body,
    })

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-DashScope-Async": "enable",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(300_000),
    })

    if (!res.ok) {
      const errorText = await res.text()
      throwCutGoError("INTERNAL", `阿里云视频任务创建失败 status=${res.status}，error=${errorText}`)
    }

    const json = (await res.json()) as AliyunVideoCreateResponse

    logAIEvent("video", "response", {
      provider: this.id,
      body: json,
    })

    if (json.code) {
      throwCutGoError("INTERNAL", `阿里云视频任务创建失败：${json.message || json.code}`)
    }

    if (!json.output?.task_id) {
      throwCutGoError("INTERNAL", "阿里云视频服务未返回 task id")
    }

    return { taskId: json.output.task_id }
  }

  async queryTask(taskId: string): Promise<VideoTaskStatus> {
    logAIEvent("video", "request", {
      provider: this.id,
      action: "queryTask",
      taskId,
    })

    const url = `${this.baseUrl}/tasks/${encodeURIComponent(taskId)}`
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      signal: AbortSignal.timeout(30_000),
    })

    if (!res.ok) {
      const errorText = await res.text()
      throwCutGoError("INTERNAL", `阿里云视频任务查询失败 status=${res.status}，error=${errorText}`)
    }

    const json = (await res.json()) as AliyunVideoQueryResponse

    logAIEvent("video", "response", {
      provider: this.id,
      action: "queryTask",
      taskId,
      body: json,
    })

    if (json.code) {
      throwCutGoError("INTERNAL", `阿里云视频任务查询失败：${json.message || json.code}`)
    }

    const status = json.output?.task_status

    switch (status) {
      case "PENDING":
        return { status: "pending" }
      case "RUNNING":
        return { status: "processing" }
      case "SUCCEEDED": {
        const videoUrl = json.output?.video_url
        if (!videoUrl) {
          throwCutGoError("INTERNAL", "阿里云视频任务成功但未返回视频 URL")
        }
        return { status: "success", url: videoUrl }
      }
      case "FAILED":
        return { status: "failed", reason: json.output?.message || json.message || "任务执行失败" }
      case "CANCELED":
        return { status: "failed", reason: "任务已取消" }
      case "UNKNOWN":
        return { status: "failed", reason: "任务不存在或状态未知" }
      default:
        return { status: "processing" }
    }
  }
}
