import type {
  VideoProvider,
  VideoGenerateOptions,
  VideoGenerateResult,
  VideoTaskStatus,
} from "../types"
import { throwCutGoError } from "@/lib/api-error"
import { fetchImageAsBase64 } from "@/lib/utils/local-image"
import { logAIEvent } from "../logging"

export interface GoogleVideoConfig {
  apiKey: string
  /**
   * e.g. https://us-central1-aiplatform.googleapis.com/v1/projects/YOUR_PROJECT/locations/us-central1/publishers/google/models
   */
  baseUrl: string
  model: string
  config?: Record<string, any>
}

interface GoogleVideoCreateResponse {
  name?: string
  error?: { code: number; message: string; status: string }
}

interface GoogleVideoQueryResponse {
  name?: string
  done?: boolean
  response?: {
    videoUri?: string
    // Or maybe it returns bytesBase64Encoded? Usually videoUri or gcsUri
    // Wait, Veo returns base64 or GCS URI?
    // Let's assume it returns bytesBase64Encoded or uri
  }
  error?: { code: number; message: string; status: string }
}

export class GoogleVideoProvider implements VideoProvider {
  readonly id = "google"

  private readonly baseUrl: string

  constructor(private readonly config: GoogleVideoConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "")
  }

  async generate(options: VideoGenerateOptions): Promise<VideoGenerateResult> {
    const {
      prompt,
      imageUrls,
      durationSeconds,
      ratio = "16:9",
      fps,
    } = options

    const instance: any = {
      prompt,
    }

    if (imageUrls && imageUrls.length > 0) {
      const processImage = async (url: string) => {
        const base64Str = await fetchImageAsBase64(url)
        const match = base64Str.match(/^data:([^;]+);base64,(.+)$/)
        if (match) {
          return {
            inlineData: {
              mimeType: match[1],
              data: match[2],
            },
          }
        }
        return {
          inlineData: {
            mimeType: "image/png",
            data: base64Str.includes(",") ? base64Str.split(",")[1] : base64Str,
          },
        }
      }

      instance.image = await processImage(imageUrls[0])

      if (imageUrls.length > 1) {
        instance.lastFrame = await processImage(imageUrls[1])
      }
    }

    const parameters: any = {
      aspectRatio: ratio,
    }

    if (this.config.config?.resolution) {
      parameters.resolution = this.config.config.resolution
    }

    if (durationSeconds) {
      parameters.durationSeconds = durationSeconds
    }
    const body = {
      instances: [instance],
      parameters,
    }

    logAIEvent("video", "request", {
      provider: this.id,
      body,
    })

    // e.g. https://.../models/veo-2.0:predictLongRunning
    const url = `${this.baseUrl}/${this.config.model}:predictLongRunning`
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": this.config.apiKey,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(300_000),
    })

    if (!res.ok) {
      const errorText = await res.text()
      throwCutGoError("INTERNAL", `Google 视频任务创建失败 status=${res.status}，error=${errorText}`)
    }

    const json = (await res.json()) as GoogleVideoCreateResponse

    logAIEvent("video", "response", {
      provider: this.id,
      body: json,
    })

    if (json.error) {
      throwCutGoError("INTERNAL", `Google 视频任务创建失败：${json.error.message}`)
    }

    if (!json.name) {
      throwCutGoError("INTERNAL", "Google 视频服务未返回 operation name")
    }

    return { taskId: json.name }
  }

  async queryTask(taskId: string): Promise<VideoTaskStatus> {
    logAIEvent("video", "request", {
      provider: this.id,
      action: "queryTask",
      taskId,
    })

    // taskId is the operation name, e.g. projects/.../operations/...
    // We need to extract the base domain from baseUrl
    const urlObj = new URL(this.baseUrl)
    // The base URL is usually https://generativelanguage.googleapis.com/v1beta
    // So we can just use the base URL and append the operation name
    // e.g. https://generativelanguage.googleapis.com/v1beta/operations/123
    // But wait, the baseUrl in config might be https://generativelanguage.googleapis.com/v1beta/models
    // Let's just use the origin and the path if it's not models
    let domainBase = this.baseUrl
    if (domainBase.endsWith("/models")) {
      domainBase = domainBase.replace(/\/models$/, "")
    }
    const url = `${domainBase}/${taskId}`

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": this.config.apiKey,
      },
      signal: AbortSignal.timeout(30_000),
    })

    if (!res.ok) {
      const errorText = await res.text()
      throwCutGoError("INTERNAL", `Google 视频任务查询失败 status=${res.status}，error=${errorText}`)
    }

    const json = (await res.json()) as any

    logAIEvent("video", "response", {
      provider: this.id,
      action: "queryTask",
      taskId,
      body: json,
    })

    if (json.error) {
      throwCutGoError("INTERNAL", `Google 视频任务查询失败：${json.error.message}`)
    }

    if (!json.done) {
      return { status: "processing" }
    }

    // When done is true, response contains the result
    if (json.response) {
      let videoUrl = ""

      // According to Gemini API docs, the video URI is at:
      // response.generateVideoResponse.generatedSamples[0].video.uri
      const generatedSamples = json.response.generateVideoResponse?.generatedSamples || []
      if (generatedSamples.length > 0) {
        const video = generatedSamples[0].video
        if (video?.uri) {
          videoUrl = video.uri
        }
      }

      if (!videoUrl) {
        throwCutGoError("INTERNAL", "Google 视频任务成功但未返回视频内容")
      }

      // We need to download the video and save it locally
      try {
        // Fetch the video using the URI and API key
        const videoRes = await fetch(videoUrl, {
          headers: {
            "x-goog-api-key": this.config.apiKey,
          },
        })

        if (!videoRes.ok) {
          throw new Error(`Failed to fetch video from URI: ${videoRes.statusText}`)
        }

        const arrayBuffer = await videoRes.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const base64Data = buffer.toString("base64")
        const localDataUrl = `data:video/mp4;base64,${base64Data}`

        return { status: "success", url: localDataUrl }
      } catch (err: any) {
        throwCutGoError("INTERNAL", `下载 Google 视频失败：${err.message}`)
      }
    }

    return { status: "failed", reason: "Unknown error" }
  }
}
