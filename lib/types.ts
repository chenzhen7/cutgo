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
  source: "paste" | "file"
  fileName: string | null
  synopsis: string | null
  status: "draft" | "analyzed" | "confirmed"
  chapters: Chapter[]
  characters: NovelCharacter[]
  events: PlotEvent[]
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

export interface NovelCharacter {
  id: string
  novelId: string
  name: string
  role: "protagonist" | "supporting" | "extra"
  description: string | null
  firstAppear: string | null
  frequency: number
  relations: string | null
  createdAt: string
  updatedAt: string
}

export interface PlotEvent {
  id: string
  novelId: string
  index: number
  type: "setup" | "rising" | "climax" | "resolution"
  summary: string
  detail: string | null
  emotion: string | null
  sourceRef: string | null
  adaptScore: number | null
  isHighlight: boolean
  createdAt: string
  updatedAt: string
}

// ── Episode Outline Types ──

export interface Episode {
  id: string
  projectId: string
  chapterId: string
  chapter: { id: string; index: number; title: string | null }
  index: number
  title: string
  synopsis: string
  keyConflict: string | null
  cliffhanger: string | null
  duration: string
  scenes: EpisodeScene[]
  createdAt: string
  updatedAt: string
}

export interface EpisodeScene {
  id: string
  episodeId: string
  index: number
  title: string
  summary: string
  duration: string
  characters: string | null
  emotion: string | null
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
    chapterId: string
    chapter: { id: string; index: number; title: string | null }
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
  synopsis?: string
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
  source: "paste" | "file"
  fileName?: string
}

export interface CharacterInput {
  name: string
  role?: "protagonist" | "supporting" | "extra"
  description?: string
  firstAppear?: string
  frequency?: number
  relations?: string
}

export interface EventInput {
  index: number
  type: "setup" | "rising" | "climax" | "resolution"
  summary: string
  detail?: string
  emotion?: string
  sourceRef?: string
  adaptScore?: number
  isHighlight?: boolean
}

// ── Asset Types ──

export interface AssetCharacter {
  id: string
  projectId: string
  name: string
  role: "protagonist" | "supporting" | "extra"
  gender: string | null
  age: string | null
  description: string | null
  appearance: string | null
  personality: string | null
  imageUrl: string | null
  seed: number | null
  locked: boolean
  sourceNovelCharacterId: string | null
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
  timeOfDay: string | null
  weather: string | null
  createdAt: string
  updatedAt: string
}

export interface AssetProp {
  id: string
  projectId: string
  name: string
  description: string | null
  imageUrl: string | null
  category: string | null
  createdAt: string
  updatedAt: string
}

export interface AssetCharacterInput {
  name: string
  role?: "protagonist" | "supporting" | "extra"
  gender?: string
  age?: string
  description?: string
  appearance?: string
  personality?: string
  imageUrl?: string
  seed?: number
  locked?: boolean
  sourceNovelCharacterId?: string
}

export interface AssetSceneInput {
  name: string
  description?: string
  imageUrl?: string
  tags?: string
  timeOfDay?: string
  weather?: string
}

export interface AssetPropInput {
  name: string
  description?: string
  imageUrl?: string
  category?: string
}

export type AssetGenerateStatus = "idle" | "generating" | "completed" | "error"

export interface AssetGenerateResult {
  characters: AssetCharacter[]
  scenes: AssetScene[]
  props: AssetProp[]
  stats: {
    characterCount: number
    sceneCount: number
    propCount: number
  }
}

export type AnalysisStatus = "idle" | "analyzing" | "completed" | "error"

export interface AnalysisResult {
  synopsis: string
  chapters: {
    index: number
    title: string | null
    content: string
    paragraphs: { index: number; content: string }[]
  }[]
  characters: {
    name: string
    role: "protagonist" | "supporting" | "extra"
    description: string
    firstAppear: string
    frequency: number
    relations: { target: string; relation: string }[]
  }[]
  events: {
    index: number
    type: "setup" | "rising" | "climax" | "resolution"
    summary: string
    detail: string
    emotion: string
    sourceRef: string
    adaptScore: number
    isHighlight: boolean
  }[]
  stats: {
    totalWords: number
    chapterCount: number
    characterCount: number
    eventCount: number
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

// ── Storyboard Types ──

export type ShotSize = "extreme_wide" | "wide" | "medium" | "medium_close" | "close" | "extreme_close"
export type CameraMovement = "static" | "push_in" | "pull_out" | "pan" | "tilt" | "tracking" | "orbit" | "crane" | "handheld"
export type CameraAngle = "eye_level" | "high" | "low" | "birds_eye" | "dutch"
export type StoryboardStatus = "draft" | "generated" | "edited"

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
  storyboardId: string
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

export interface Storyboard {
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
  status: StoryboardStatus
  shots: Shot[]
  createdAt: string
  updatedAt: string
}

export type StoryboardGenerateStatus = "idle" | "generating" | "completed" | "error"

export interface StoryboardGenerateProgress {
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

export interface StoryboardGenerateResult {
  storyboards: Storyboard[]
  stats: {
    storyboardCount: number
    totalShots: number
    avgShotsPerScene: number
    generatedScenes: number
    skippedScenes: number
  }
}
