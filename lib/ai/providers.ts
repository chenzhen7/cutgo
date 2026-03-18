import type { AIModelConfig } from "./types"

export type ProviderModelOption = {
  value: string
  label: string
}

export type ProviderOption = {
  label: string
  models: ProviderModelOption[]
  defaultBaseUrl: string
}

export const AI_PROVIDER_OPTIONS_BY_TYPE: Record<
  AIModelConfig["type"],
  Record<string, ProviderOption>
> = {
  llm: {
    openai: {
      label: "OpenAI",
      models: [
        { value: "gpt-5.4", label: "GPT-5.4（旗舰）" },
        { value: "gpt-5.4-mini", label: "GPT-5.4 Mini（高性价比）" },
        { value: "gpt-5.4-nano", label: "GPT-5.4 Nano（低延迟）" },
        { value: "chatgpt-4o-latest", label: "ChatGPT-4o Latest（兼容）" },
      ],
      defaultBaseUrl: "https://api.openai.com/v1",
    },
    deepseek: {
      label: "DeepSeek",
      models: [
        { value: "deepseek-chat", label: "DeepSeek-V3 (deepseek-chat)" },
        { value: "deepseek-reasoner", label: "DeepSeek-R1 (deepseek-reasoner)" },
      ],
      defaultBaseUrl: "https://api.deepseek.com/v1",
    },
    anthropic: {
      label: "Anthropic (Claude)",
      models: [
        { value: "claude-opus-4-6", label: "Claude Opus 4.6" },
        { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
        { value: "claude-haiku-4-5", label: "Claude Haiku 4.5" },
      ],
      defaultBaseUrl: "https://api.anthropic.com/v1",
    },
    qwen: {
      label: "阿里通义千问",
      models: [
        { value: "qwen-max-latest", label: "Qwen-Max Latest" },
        { value: "qwen-plus-latest", label: "Qwen-Plus Latest" },
        { value: "qwen-turbo-latest", label: "Qwen-Turbo Latest" },
      ],
      defaultBaseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    },
  },
  image: {
    openai: {
      label: "OpenAI (DALL-E)",
      models: [{ value: "dall-e-3", label: "DALL-E 3" }],
      defaultBaseUrl: "https://api.openai.com/v1",
    },
    comfyui: {
      label: "ComfyUI (本地)",
      models: [{ value: "comfyui", label: "ComfyUI 工作流" }],
      defaultBaseUrl: "http://127.0.0.1:8188",
    },
    stability: {
      label: "Stability AI (SDXL)",
      models: [{ value: "stable-diffusion-xl-1024-v1-0", label: "SDXL 1.0" }],
      defaultBaseUrl: "https://api.stability.ai/v1",
    },
  },
  video: {
    runway: {
      label: "Runway",
      models: [{ value: "gen3a_turbo", label: "Gen-3 Alpha Turbo" }],
      defaultBaseUrl: "https://api.dev.runwayml.com/v1",
    },
    kling: {
      label: "快手可灵",
      models: [{ value: "kling-v1", label: "可灵 v1" }],
      defaultBaseUrl: "https://api.klingai.com/v1",
    },
    minimax: {
      label: "MiniMax 海螺",
      models: [{ value: "video-01", label: "海螺视频 01" }],
      defaultBaseUrl: "https://api.minimax.chat/v1",
    },
  },
  tts: {
    "edge-tts": {
      label: "Microsoft Edge TTS（免费）",
      models: [
        { value: "zh-CN-XiaoxiaoNeural", label: "晓晓（普通话女声）" },
        { value: "zh-CN-YunxiNeural", label: "云希（普通话男声）" },
        { value: "zh-CN-XiaoyiNeural", label: "晓伊（普通话女声）" },
      ],
      defaultBaseUrl: "",
    },
    openai: {
      label: "OpenAI TTS",
      models: [
        { value: "tts-1", label: "TTS-1" },
        { value: "tts-1-hd", label: "TTS-1 HD" },
      ],
      defaultBaseUrl: "https://api.openai.com/v1",
    },
    elevenlabs: {
      label: "ElevenLabs",
      models: [{ value: "eleven_multilingual_v2", label: "Multilingual v2" }],
      defaultBaseUrl: "https://api.elevenlabs.io/v1",
    },
    minimax: {
      label: "MiniMax 语音合成",
      models: [{ value: "speech-01-turbo", label: "Speech-01 Turbo" }],
      defaultBaseUrl: "https://api.minimax.chat/v1",
    },
  },
}

export const OPENAI_COMPATIBLE_LLM_PROVIDERS = new Set(
  Object.keys(AI_PROVIDER_OPTIONS_BY_TYPE.llm)
)

export function isOpenAICompatibleLLMProvider(provider: string): boolean {
  return OPENAI_COMPATIBLE_LLM_PROVIDERS.has(provider)
}

export function getProviderDefaultBaseUrl(provider: string): string {
  for (const optionsByProvider of Object.values(AI_PROVIDER_OPTIONS_BY_TYPE)) {
    const target = optionsByProvider[provider]
    if (target) return target.defaultBaseUrl
  }
  return ""
}
