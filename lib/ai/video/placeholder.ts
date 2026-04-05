import type { VideoProvider, VideoGenerateOptions, VideoGenerateResult, VideoTaskStatus } from "../types"
import { logAIEvent } from "../logging"

/**
 * 视频生成占位实现
 * 用于未配置 API Key 的情况，返回模拟任务 ID。
 */
export class PlaceholderVideoProvider implements VideoProvider {
  readonly id = "placeholder"

  async generate(options: VideoGenerateOptions): Promise<VideoGenerateResult> {
    logAIEvent("video", "request", {
      provider: this.id,
      body: options,
    })
    
    const result = { taskId: "placeholder-task-id" }
    
    logAIEvent("video", "response", {
      provider: this.id,
      body: result,
    })
    
    return result
  }

  async queryTask(taskId: string): Promise<VideoTaskStatus> {
    logAIEvent("video", "request", {
      provider: this.id,
      action: "queryTask",
      taskId,
    })
    
    const status: VideoTaskStatus = { status: "success", url: "" }
    
    logAIEvent("video", "response", {
      provider: this.id,
      action: "queryTask",
      taskId,
      status,
    })
    
    return status
  }
}
