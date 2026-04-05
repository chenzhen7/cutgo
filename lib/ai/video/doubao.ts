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
  id?: string
  error?: { code: string; message: string }
}

/** 查询任务响应 */
interface DoubaoVideoQueryResponse {
  id?: string
  status?: "queuing" | "running" | "succeeded" | "failed"
  content?: Array<{
    type: string
    video_url?: { url: string }
  }>
  error?: { code: string; message: string }
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
      generateAudio = false,
    } = options

    // 按官方 content 数组格式构建请求
    type ContentItem =
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string }; role?: "first_frame" | "last_frame" }

    const content: ContentItem[] = [{ type: "text", text: prompt }]

    if (imageUrls && imageUrls.length > 0) {
      if (imageUrls.length === 1) {
        // 单图：首帧参考
        content.push({ type: "image_url", image_url: { url: imageUrls[0] } })
      } else {
        // 双图：首尾帧，按官方 role 字段区分
        content.push({ type: "image_url", image_url: { url: imageUrls[0] }, role: "first_frame" })
        content.push({ type: "image_url", image_url: { url: imageUrls[1] }, role: "last_frame" })
      }
    }

    const body: Record<string, unknown> = {
      model: this.config.model,
      content,
      ratio,
    }

    if (durationSeconds !== undefined) {
      body.duration = durationSeconds
    }

    if (generateAudio) {
      body.generate_audio = true
    }

    const url = this.baseUrl
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

    if (!json.id) {
      throwCutGoError("INTERNAL", "豆包视频服务未返回 task id")
    }

    return { taskId: json.id }
  }

  async queryTask(taskId: string): Promise<VideoTaskStatus> {
    const url = `${this.baseUrl}/${encodeURIComponent(taskId)}`
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

    const apiErrorMsg = json.error ? (json.error.message ?? json.error.code) : undefined
    if (json.error) {
      throwCutGoError("INTERNAL", `豆包视频任务查询失败：${apiErrorMsg}`)
    }

    switch (json.status) {
      case "queuing":
        return { status: "pending" }
      case "running":
        return { status: "processing" }
      case "succeeded": {
        const videoItem = json.content?.find((c) => c.type === "video_url")
        const videoUrl = videoItem?.video_url?.url
        if (!videoUrl) {
          throwCutGoError("INTERNAL", "豆包视频任务成功但未返回视频 URL")
        }
        return { status: "success", url: videoUrl }
      }
      case "failed":
        return { status: "failed", reason: apiErrorMsg }
      default:
        return { status: "processing" }
    }
  }
}
