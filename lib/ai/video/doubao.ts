import type {
  VideoProvider,
  VideoGenerateOptions,
  VideoGenerateResult,
  VideoTaskStatus,
} from "../types"
import { throwCutGoError } from "@/lib/api-error"

export interface DoubaoVideoConfig {
  apiKey: string
  baseUrl: string
  model: string
}

/** 创建任务响应 */
interface DoubaoVideoCreateResponse {
  task_id?: string
  error?: { code: string; message: string }
}

/** 查询任务响应 */
interface DoubaoVideoQueryResponse {
  code?: string
  message?: string
  data?: {
    task_id: string
    status: "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED"
    fail_reason?: string
    data?: {
      content?: {
        video_url?: string
      }
    }
  }
}

/**
 * 火山方舟（豆包/即梦）视频生成 Provider
 * 支持模型：
 *   - doubao-seedance-1-0-pro-250528（文生视频 + 首帧/首尾帧）
 *   - doubao-seedance-1-0-pro-fast-251015（文生视频 + 首帧，快速模式）
 *   - doubao-seedance-1-5-pro-251215（文生视频 + 首帧/首尾帧 + 有声视频）
 */
export class DoubaoVideoProvider implements VideoProvider {
  readonly id = "doubao"

  private readonly baseUrl: string

  constructor(private readonly config: DoubaoVideoConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "")
  }

  async generate(options: VideoGenerateOptions): Promise<VideoGenerateResult> {
    const {
      prompt,
      imageUrls,
      durationSeconds,
      ratio = "16:9",
      resolution = "1080p",
      fps = 24,
      seed = -1,
      watermark = false,
      cameraFixed = false,
      generateAudio = false,
    } = options

    const body: Record<string, unknown> = {
      model: this.config.model,
      prompt,
      resolution,
      ratio,
      fps,
      seed,
      watermark,
      camerafixed: cameraFixed,
    }

    if (durationSeconds !== undefined) {
      body.duration = durationSeconds
    }

    if (imageUrls && imageUrls.length > 0) {
      body.images = imageUrls
    }

    if (generateAudio) {
      body.generate_audio = true
    }

    const url = `${this.baseUrl}/video/generations`
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    })

    if (!res.ok) {
      const errorText = await res.text()
      throwCutGoError("INTERNAL", `豆包视频任务创建失败 status=${res.status}，error=${errorText}`)
    }

    const json = (await res.json()) as DoubaoVideoCreateResponse

    if (json.error) {
      throwCutGoError("INTERNAL", `豆包视频任务创建失败：${json.error.message}`)
    }

    if (!json.task_id) {
      throwCutGoError("INTERNAL", "豆包视频服务未返回 task_id")
    }

    return { taskId: json.task_id }
  }

  async queryTask(taskId: string): Promise<VideoTaskStatus> {
    const url = `${this.baseUrl}/video/generations/${encodeURIComponent(taskId)}`
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      signal: AbortSignal.timeout(15_000),
    })

    if (!res.ok) {
      const errorText = await res.text()
      throwCutGoError("INTERNAL", `豆包视频任务查询失败 status=${res.status}，error=${errorText}`)
    }

    const json = (await res.json()) as DoubaoVideoQueryResponse

    if (json.code && json.code !== "success") {
      throwCutGoError("INTERNAL", `豆包视频任务查询失败：${json.message ?? json.code}`)
    }

    const taskData = json.data
    if (!taskData) {
      throwCutGoError("INTERNAL", "豆包视频任务查询返回格式异常")
    }

    switch (taskData.status) {
      case "PENDING":
        return { status: "pending" }
      case "PROCESSING":
        return { status: "processing" }
      case "SUCCESS": {
        const videoUrl = taskData.data?.content?.video_url
        if (!videoUrl) {
          throwCutGoError("INTERNAL", "豆包视频任务成功但未返回视频 URL")
        }
        return { status: "success", url: videoUrl }
      }
      case "FAILED":
        return { status: "failed", reason: taskData.fail_reason }
      default:
        return { status: "processing" }
    }
  }
}
