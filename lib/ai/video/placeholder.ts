import type { VideoProvider, VideoGenerateOptions, VideoGenerateResult } from "../types"

/**
 * 视频生成占位实现（构造器方式）
 * 用于测试或未配置 API Key 的情况。
 */
export class PlaceholderVideoProvider implements VideoProvider {
  readonly id = "placeholder"

  async generate(_options: VideoGenerateOptions): Promise<VideoGenerateResult> {
    return { taskId: "placeholder", statusUrl: "" }
  }
}
