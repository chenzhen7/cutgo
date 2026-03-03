export interface Project {
  id: string
  name: string
  description: string | null
  tags: string | null
  coverUrl: string | null
  platform: string
  aspectRatio: string
  resolution: string
  duration: string
  stylePreset: string | null
  globalNegPrompt: string | null
  styleRefUrl: string | null
  status: string
  step: number
  stepLabel: string
  createdAt: string
  updatedAt: string
}

export interface CreateProjectInput {
  name: string
  description?: string
  tags?: string
  platform: string
  aspectRatio: string
  resolution: string
  duration: string
}

export interface UpdateProjectInput {
  name?: string
  description?: string
  tags?: string
  coverUrl?: string
  platform?: string
  aspectRatio?: string
  resolution?: string
  duration?: string
  stylePreset?: string
  globalNegPrompt?: string
  styleRefUrl?: string
  status?: string
  step?: number
  stepLabel?: string
}

export const PLATFORM_PRESETS = [
  { label: "抖音/TikTok", value: "douyin", aspectRatio: "9:16", resolution: "1080x1920" },
  { label: "视频号/快手", value: "kuaishou", aspectRatio: "3:4", resolution: "1080x1440" },
  { label: "YouTube/横屏", value: "youtube", aspectRatio: "16:9", resolution: "1920x1080" },
] as const

export const DURATION_OPTIONS = ["30s", "60s", "90s", "自定义"] as const

export const STYLE_PRESETS = {
  realistic: [
    { label: "都市霸总", value: "urban-ceo" },
    { label: "古装仙侠", value: "ancient-xianxia" },
    { label: "硬核科幻", value: "hard-scifi" },
  ],
  artistic: [
    { label: "日漫风", value: "anime-jp" },
    { label: "美漫风格", value: "comic-us" },
    { label: "赛博朋克", value: "cyberpunk" },
    { label: "水墨风", value: "ink-wash" },
  ],
} as const

export const DEFAULT_NEGATIVE_PROMPTS =
  "bad anatomy, text, watermark, low quality, blurry, deformed, extra limbs, disfigured"
