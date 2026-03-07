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
  status: "draft" | "generated" | "edited"
  scenes: ScriptSceneData[]
  createdAt: string
  updatedAt: string
}

export interface ScriptSceneData {
  id: string
  scriptId: string
  index: number
  title: string
  description: string | null
  duration: string
  emotion: string | null
  bgm: string | null
  location: string | null
  characters: string | null
  props: string | null
  lines: ScriptLineData[]
  createdAt: string
  updatedAt: string
}

export interface ScriptLineData {
  id: string
  sceneId: string
  index: number
  type: "dialogue" | "narration" | "action" | "transition"
  character: string | null
  emotion: string | null
  content: string
  duration: string | null
  parenthetical: string | null
  createdAt: string
  updatedAt: string
}

export type ScriptGenerateStatus = "idle" | "generating" | "completed" | "error"

export interface ScriptGenerateProgress {
  current: number
  total: number
  currentEpisodeTitle: string
}

export interface ScriptSceneInput {
  title: string
  description?: string
  duration?: string
  emotion?: string
  bgm?: string
  location?: string
  characters?: string
  props?: string
}

export interface ScriptLineInput {
  type: "dialogue" | "narration" | "action" | "transition"
  character?: string
  emotion?: string
  content: string
  duration?: string
  parenthetical?: string
  insertAfter?: string
}

export interface ScriptGenerateResult {
  scripts: Script[]
  stats: {
    scriptCount: number
    totalScenes: number
    totalLines: number
    totalDuration: string
    characterCount: number
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
