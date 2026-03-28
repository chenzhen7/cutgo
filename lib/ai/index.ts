/**
 * 多模型统一入口
 * 业务代码应通过此文件导出所需的 Provider 和配置函数
 * 详细设计见 doc/多模型对接设计文档.md
 */

// 导出类型定义
export type {
  LLMMessage,
  LLMMessageRole,
  LLMGenerateOptions,
  LLMGenerateResult,
  LLMProvider,
  ImageGenerateOptions,
  ImageGenerateResult,
  ImageProvider,
  VideoGenerateOptions,
  VideoGenerateResult,
  VideoProvider,
} from "./types"

// 导出配置获取相关
export { getLLMConfig, getImageConfig, getVideoConfig, getTTSConfig, getActiveConfig } from "./config"
export type { AIModelConfig } from "./types"

// 导出各能力的 Provider 获取函数
export { getLLMProvider } from "./llm"
export { getImageProvider } from "./image"
export { getVideoProvider } from "./video"
