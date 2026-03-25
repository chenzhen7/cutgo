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
  novel?: Novel | null
  createdAt: string
  updatedAt: string
}

// ── Novel Import Types ──

export interface Novel {
  id: string
  projectId: string
  title: string | null
  rawText: string
  wordCount: number
  chapters: Chapter[]
  createdAt: string
  updatedAt: string
}

export interface Chapter {
  id: string
  novelId: string
  index: number
  title: string | null
  content: string
  wordCount: number
  selected: boolean
  paragraphs: Paragraph[]
  createdAt: string
  updatedAt: string
}

export interface Paragraph {
  id: string
  chapterId: string
  index: number
  content: string
  wordCount: number
  selected: boolean
  createdAt: string
}


// ── Episode（可按小说章节创建，或由剧本页按所选章节生成）──

export interface Episode {
  id: string
  projectId: string
  /** JSON 数组字符串，本集涵盖的所有章节 ID（有序）；无关联章节时为 null */
  chapterIds: string | null
  index: number
  title: string
  outline: string | null
  goldenHook: string | null
  keyConflict: string | null
  cliffhanger: string | null
  duration: string
  /** JSON 字符串数组：本集涉及的角色资产名称列表（由 AI 大纲生成时关联） */
  episodeCharacters: string | null
  /** JSON 字符串数组：本集涉及的场景资产名称列表（由 AI 大纲生成时关联） */
  episodeScenes: string | null
  /** JSON 字符串数组：本集涉及的道具资产名称列表（由 AI 大纲生成时关联） */
  episodeProps: string | null
  createdAt: string
  updatedAt: string
}

// ── Script Types ──

export interface Script {
  id: string
  projectId: string
  episodeId: string
  episode: {
    id: string
    index: number
    title: string
    chapterIds: string | null
  }
  title: string
  content: string
  status: "draft" | "generated" | "edited"
  characters: string | null
  props: string | null
  location: string | null
  createdAt: string
  updatedAt: string
}

export type ScriptGenerateStatus = "idle" | "generating" | "completed" | "error"

export interface ScriptGenerateProgress {
  current: number
  total: number
  currentEpisodeTitle: string
}

export interface ScriptGenerateResult {
  scripts: Script[]
  stats: {
    scriptCount: number
    generatedEpisodes: number
    skippedEpisodes: number
  }
}

export type GenerateStatus = "idle" | "generating" | "completed" | "error"

export interface GenerateProgress {
  current: number
  total: number
  currentChapterTitle: string
}

export interface EpisodeInput {
  chapterId: string
  index?: number
  title: string
  outline?: string
  goldenHook?: string
  keyConflict?: string
  cliffhanger?: string
  duration?: string
}

export interface SceneInput {
  title: string
  summary?: string
  duration?: string
  characters?: string
  emotion?: string
}

export interface GenerateResult {
  episodes: Episode[]
  stats: {
    episodeCount: number
    totalScenes: number
    totalDuration: string
    characterCount: number
    generatedChapters: number
    skippedChapters: number
  }
}

export interface ImportNovelInput {
  projectId: string
  title?: string
  rawText: string
}


// ── Asset Types ──

export interface AssetCharacter {
  id: string
  projectId: string
  name: string
  role: "protagonist" | "supporting" | "extra"
  gender: string | null
  description: string | null
  personality: string | null
  imageUrl: string | null
  seed: number | null
  locked: boolean
  createdAt: string
  updatedAt: string
}

export interface AssetScene {
  id: string
  projectId: string
  name: string
  description: string | null
  imageUrl: string | null
  tags: string | null
  createdAt: string
  updatedAt: string
}

export interface AssetProp {
  id: string
  projectId: string
  name: string
  description: string | null
  imageUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface AssetCharacterInput {
  name: string
  role?: "protagonist" | "supporting" | "extra"
  gender?: string
  description?: string
  personality?: string
  imageUrl?: string
  seed?: number
  locked?: boolean
}

export interface AssetSceneInput {
  name: string
  description?: string
  imageUrl?: string
  tags?: string
}

export interface AssetPropInput {
  name: string
  description?: string
  imageUrl?: string
}

export type AnalysisStatus = "idle" | "analyzing" | "completed" | "error"

export interface AnalysisResult {
  chapters: {
    index: number
    title: string | null
    content: string
    paragraphs: { index: number; content: string }[]
  }[]
  stats: {
    totalWords: number
    chapterCount: number
  }
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

export const STYLE_PRESETS = [
  { label: "都市霸总", value: "urban-ceo" },
  { label: "古装仙侠", value: "ancient-xianxia" },
  { label: "硬核科幻", value: "hard-scifi" },
  { label: "日漫风", value: "anime-jp" },
  { label: "美漫风格", value: "comic-us" },
  { label: "赛博朋克", value: "cyberpunk" },
  { label: "水墨风", value: "ink-wash" },
] as const

export const DEFAULT_NEGATIVE_PROMPTS =
  "bad anatomy, text, watermark, low quality, blurry, deformed, extra limbs, disfigured"

// ── Script Shot Plan Types ──

export type ShotSize = "extreme_wide" | "wide" | "medium" | "medium_close" | "close" | "extreme_close"
export type CameraMovement = "static" | "push_in" | "pull_out" | "pan" | "tilt" | "tracking" | "orbit" | "crane" | "handheld"
export type CameraAngle = "eye_level" | "high" | "low" | "birds_eye" | "dutch"
export type ScriptShotPlanStatus = "draft" | "generated" | "edited"

export const SHOT_SIZE_OPTIONS: { value: ShotSize; label: string; en: string }[] = [
  { value: "extreme_wide", label: "远景", en: "Extreme Wide Shot" },
  { value: "wide", label: "全景", en: "Wide Shot" },
  { value: "medium", label: "中景", en: "Medium Shot" },
  { value: "medium_close", label: "中近景", en: "Medium Close-Up" },
  { value: "close", label: "近景", en: "Close-Up" },
  { value: "extreme_close", label: "特写", en: "Extreme Close-Up" },
]

export const CAMERA_MOVEMENT_OPTIONS: { value: CameraMovement; label: string; en: string }[] = [
  { value: "static", label: "静止", en: "Static" },
  { value: "push_in", label: "推进", en: "Push In" },
  { value: "pull_out", label: "拉远", en: "Pull Out" },
  { value: "pan", label: "横摇", en: "Pan" },
  { value: "tilt", label: "竖摇", en: "Tilt" },
  { value: "tracking", label: "跟拍", en: "Tracking" },
  { value: "orbit", label: "环绕", en: "Orbit" },
  { value: "crane", label: "升降", en: "Crane" },
  { value: "handheld", label: "手持", en: "Handheld" },
]

export const CAMERA_ANGLE_OPTIONS: { value: CameraAngle; label: string; en: string }[] = [
  { value: "eye_level", label: "平视", en: "Eye Level" },
  { value: "high", label: "俯拍", en: "High Angle" },
  { value: "low", label: "仰拍", en: "Low Angle" },
  { value: "birds_eye", label: "鸟瞰", en: "Bird's Eye" },
  { value: "dutch", label: "荷兰角", en: "Dutch Angle" },
]

export type ImageType = "keyframe" | "first_last" | "multi_grid"
export type GridLayout = "2x2" | "1x3" | "2x3"

export const IMAGE_TYPE_OPTIONS: { value: ImageType; label: string; description: string }[] = [
  { value: "keyframe", label: "关键帧", description: "生成1张关键画面" },
  { value: "first_last", label: "首尾帧", description: "生成首帧和尾帧各1张，适合运镜" },
  { value: "multi_grid", label: "多宫格", description: "多画面拼合为1张图" },
]

export const GRID_LAYOUT_OPTIONS: { value: GridLayout; label: string; cols: number; rows: number; count: number }[] = [
  { value: "2x2", label: "2×2", cols: 2, rows: 2, count: 4 },
  { value: "1x3", label: "1×3", cols: 3, rows: 1, count: 3 },
  { value: "2x3", label: "2×3", cols: 3, rows: 2, count: 6 },
]

export interface Shot {
  id: string
  scriptId: string
  index: number
  shotSize: ShotSize
  cameraMovement: CameraMovement
  cameraAngle: CameraAngle
  composition: string
  prompt: string
  negativePrompt: string | null
  duration: string
  imageUrl: string | null
  imageType: ImageType
  imageUrls: string | null
  promptEnd: string | null
  gridLayout: GridLayout | null
  gridPrompts: string | null
  scriptLineIds: string | null
  dialogueText: string | null
  actionNote: string | null
  characterIds: string | null
  sceneId: string | null
  propIds: string | null
  videoUrl: string | null
  videoStatus: VideoStatus | null
  videoPrompt: string | null
  videoDuration: string | null
  createdAt: string
  updatedAt: string
}

export type VideoStatus = "idle" | "generating" | "completed" | "error"

export const VIDEO_DURATION_OPTIONS = ["3s", "5s", "8s"] as const
export const VIDEO_MOTION_OPTIONS: { value: string; label: string }[] = [
  { value: "low", label: "低" },
  { value: "medium", label: "中" },
  { value: "high", label: "高" },
]

export interface ScriptShotPlan {
  id: string
  projectId: string
  scriptId: string
  script: {
    id: string
    title: string
    content: string
    episodeId: string
    episode: {
      id: string
      index: number
      title: string
    }
  }
  status: ScriptShotPlanStatus
  shots: Shot[]
  createdAt: string
  updatedAt: string
}

export type ScriptShotGenerateStatus = "idle" | "generating" | "completed" | "error"

export interface ScriptShotGenerateProgress {
  current: number
  total: number
  currentSceneTitle: string
  currentEpisodeTitle: string
}

export interface ShotInput {
  shotSize?: string
  cameraMovement?: string
  cameraAngle?: string
  composition: string
  prompt: string
  negativePrompt?: string
  duration?: string
  imageType?: ImageType
  imageUrl?: string
  imageUrls?: string
  promptEnd?: string
  gridLayout?: GridLayout
  gridPrompts?: string
  scriptLineIds?: string
  dialogueText?: string
  actionNote?: string
  characterIds?: string
  sceneId?: string
  propIds?: string
  videoUrl?: string
  videoStatus?: VideoStatus
  videoPrompt?: string
  videoDuration?: string
  insertAfter?: string
}

export interface ScriptShotGenerateResult {
  scriptShotPlans: ScriptShotPlan[]
  stats: {
    scriptCount: number
    totalShots: number
    avgShotsPerScript: number
    generatedScenes: number
    skippedScenes: number
  }
}

// ── Video Composition Types ──

export interface VideoCompositionConfig {
  subtitle: {
    enabled: boolean
    dialoguePosition: "bottom_center" | "bottom_left" | "bottom_right" | "top_center"
    narrationPosition: "top_center" | "bottom_center" | "middle_center"
    fontFamily: string
    fontSize: number
    fontColor: string
    strokeColor: string
    strokeWidth: number
    backgroundColor: string
    backgroundOpacity: number
    borderRadius: number
  }
  tts: {
    enabled: boolean
    speed: number
    narrationVoice: string
    characterVoices: Record<string, string>
  }
  bgm: {
    enabled: boolean
    masterVolume: number
    fadeInDuration: number
    fadeOutDuration: number
    track: {
      fileUrl: string
      startTime: number
      endTime: number
      volume: number
      loop: boolean
    } | null
  }
  output: {
    resolution: "1080x1920" | "720x1280" | "540x960"
    fps: 24 | 30 | 60
    videoBitrate: string
    audioBitrate: string
    format: "mp4"
    outputDir: string
  }
}

export type VideoCompositionStatus =
  | "idle"
  | "preparing"
  | "tts_generating"
  | "subtitle_generating"
  | "compositing"
  | "completed"
  | "error"

export interface VideoComposition {
  id: string
  projectId: string
  episodeId: string
  episode: {
    id: string
    index: number
    title: string
  }
  config: string
  status: VideoCompositionStatus
  outputPath: string | null
  fileSize: number | null
  videoDuration: number | null
  version: number
  errorMessage: string | null
  progress: number
  currentStep: string | null
  createdAt: string
  updatedAt: string
}

export interface TtsVoice {
  id: string
  name: string
  gender: "male" | "female" | "child"
  previewUrl: string
}

export const DEFAULT_VIDEO_COMPOSITION_CONFIG: VideoCompositionConfig = {
  subtitle: {
    enabled: true,
    dialoguePosition: "bottom_center",
    narrationPosition: "top_center",
    fontFamily: "思源黑体",
    fontSize: 36,
    fontColor: "#FFFFFF",
    strokeColor: "#000000",
    strokeWidth: 2,
    backgroundColor: "rgba(0,0,0,0.5)",
    backgroundOpacity: 50,
    borderRadius: 8,
  },
  tts: {
    enabled: false,
    speed: 1.0,
    narrationVoice: "female_gentle",
    characterVoices: {},
  },
  bgm: {
    enabled: true,
    masterVolume: 40,
    fadeInDuration: 2,
    fadeOutDuration: 3,
    track: null,
  },
  output: {
    resolution: "1080x1920",
    fps: 30,
    videoBitrate: "8M",
    audioBitrate: "192k",
    format: "mp4",
    outputDir: "./output",
  },
}

export const TTS_VOICES: TtsVoice[] = [
  { id: "female_gentle", name: "温柔女声", gender: "female", previewUrl: "" },
  { id: "female_lively", name: "活泼女声", gender: "female", previewUrl: "" },
  { id: "female_mature", name: "成熟女声", gender: "female", previewUrl: "" },
  { id: "male_deep", name: "低沉男声", gender: "male", previewUrl: "" },
  { id: "male_sunny", name: "阳光男声", gender: "male", previewUrl: "" },
  { id: "male_magnetic", name: "磁性男声", gender: "male", previewUrl: "" },
  { id: "child", name: "儿童声线", gender: "child", previewUrl: "" },
  { id: "narration", name: "旁白专用", gender: "female", previewUrl: "" },
]

export const BGM_LIBRARY: { category: string; items: { id: string; name: string; duration: string; url: string }[] }[] = [
  {
    category: "温情/感人",
    items: [
      { id: "bgm_piano_gentle", name: "轻柔钢琴曲", duration: "02:30", url: "" },
      { id: "bgm_strings_warm", name: "温柔弦乐", duration: "03:15", url: "" },
      { id: "bgm_piano_touching", name: "感人钢琴", duration: "01:45", url: "" },
    ],
  },
  {
    category: "紧张/悬疑",
    items: [
      { id: "bgm_suspense_1", name: "悬疑低音", duration: "02:00", url: "" },
      { id: "bgm_tension_1", name: "紧张节奏", duration: "01:30", url: "" },
    ],
  },
  {
    category: "激昂/热血",
    items: [
      { id: "bgm_epic_1", name: "史诗热血", duration: "03:00", url: "" },
      { id: "bgm_battle_1", name: "战斗激昂", duration: "02:15", url: "" },
    ],
  },
  {
    category: "轻松/日常",
    items: [
      { id: "bgm_light_1", name: "轻松日常", duration: "02:45", url: "" },
      { id: "bgm_casual_1", name: "休闲小调", duration: "02:00", url: "" },
    ],
  },
  {
    category: "悲伤/离别",
    items: [
      { id: "bgm_sad_1", name: "离别悲歌", duration: "03:30", url: "" },
      { id: "bgm_melancholy_1", name: "忧郁旋律", duration: "02:50", url: "" },
    ],
  },
  {
    category: "浪漫/甜蜜",
    items: [
      { id: "bgm_romantic_1", name: "浪漫钢琴", duration: "02:20", url: "" },
      { id: "bgm_sweet_1", name: "甜蜜小提琴", duration: "03:10", url: "" },
    ],
  },
]
