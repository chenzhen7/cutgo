import type { VideoProvider, VideoGenerateOptions, VideoGenerateResult, VideoTaskStatus } from "../types"

/**
 * 视频生成占位实现
 * 用于未配置 API Key 的情况，返回模拟任务 ID。
 */
export class PlaceholderVideoProvider implements VideoProvider {
  readonly id = "placeholder"

  async generate(_options: VideoGenerateOptions): Promise<VideoGenerateResult> {
    return { taskId: "placeholder-task-id" }
  }

  async queryTask(_taskId: string): Promise<VideoTaskStatus> {
    return { status: "success", url: "" }
  }
}
