/**
 * 多模型统一入口
 * 文档见 doc/多模型对接方案.md
 */

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

export { getLLMConfig, getImageConfig, getVideoConfig } from "./config"
export type { LLMConfig, ImageConfig, VideoConfig } from "./config"

export { getLLMProvider, clearLLMProviderCache } from "./llm"
export { getImageProvider, clearImageProviderCache } from "./image"
export { getVideoProvider, clearVideoProviderCache } from "./video"
