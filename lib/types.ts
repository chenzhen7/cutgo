export interface Project {
  id: string
  name: string
  description: string | null
  tags: string | null
  coverUrl: string | null
  aspectRatio: string
  resolution: string
  /** 视觉风格名称（中文，与 STYLE_PRESETS 的 label 一致；自定义时为用户填写文案） */
  stylePreset: string | null
  globalNegPrompt: string | null
  styleRefUrl: string | null
  status: string
  createdAt: string
  updatedAt: string
}


// ── Episode（可按小说章节创建，或由剧本页按所选章节生成）──

export interface Episode {
  id: string
  projectId: string
  /** 本集直接存储的小说原文 */
  rawText: string | null
  /** 原文字数 */
  wordCount: number | null
  index: number
  title: string
  outline: string | null
  goldenHook: string | null
  keyConflict: string | null
  cliffhanger: string | null
  duration: string
  /** JSON 字符串数组：本集涉及的角色资产 id 列表 */
  characters: string | null
  /** JSON 字符串数组：本集涉及的场景资产 id 列表 */
  scenes: string | null
  /** JSON 字符串数组：本集涉及的道具资产 id 列表 */
  props: string | null
  /** 剧本正文，不为空说明该分集存在剧本 */
  script: string
  /** 默认镜头类型 */
  shotType: string
  createdAt: string
  updatedAt: string
}

// ── Script Types（Script 已合并入 Episode，以下为兼容层）──

/** @deprecated 使用 Episode 代替，script 内容存于 episode.script */
export type Script = Episode

export type ScriptGenerateStatus = "idle" | "generating" | "completed" | "error"

export interface ScriptGenerateProgress {
  current: number
  total: number
  currentEpisodeTitle: string
}

export interface ScriptGenerateResult {
  episodes: Episode[]
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

// ── Asset Types ──

export interface AssetCharacter {
  id: string
  projectId: string
  name: string
  role: "protagonist" | "supporting" | "extra"
  gender: string | null
  prompt: string | null
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
  prompt: string | null
  imageUrl: string | null
  tags: string | null
  createdAt: string
  updatedAt: string
}

export interface AssetProp {
  id: string
  projectId: string
  name: string
  prompt: string | null
  imageUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface AssetCharacterInput {
  name: string
  role?: "protagonist" | "supporting" | "extra"
  gender?: string
  prompt?: string
  imageUrl?: string
  seed?: number
  locked?: boolean
}

export interface AssetSceneInput {
  name: string
  prompt?: string
  imageUrl?: string
  tags?: string
}

export interface AssetPropInput {
  name: string
  prompt?: string
  imageUrl?: string
}

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
  aspectRatio: string
  resolution: string
}

export interface UpdateProjectInput {
  name?: string
  description?: string
  tags?: string
  coverUrl?: string
  aspectRatio?: string
  resolution?: string
  stylePreset?: string
  globalNegPrompt?: string
  styleRefUrl?: string
  status?: string
}

export const PLATFORM_PRESETS = [
  { label: "抖音/TikTok", value: "douyin", aspectRatio: "9:16", resolution: "1080x1920" },
  { label: "YouTube/横屏", value: "youtube", aspectRatio: "16:9", resolution: "1920x1080" },
] as const

export const STYLE_PRESET_CATEGORIES = [
  { label: "全部", value: "all" },
  { label: "写实都市", value: "realistic" },
  { label: "古装玄幻", value: "fantasy" },
  { label: "科幻未来", value: "scifi" },
  { label: "动漫插画", value: "anime" },
  { label: "艺术风格", value: "art" },
] as const

export type StylePresetCategory = (typeof STYLE_PRESET_CATEGORIES)[number]["value"]

export type StylePresetItem = {
  label: string
  description: string
  category: StylePresetCategory
}

/** 根据中文名称取预设说明（自定义风格无预设时返回 "" */
export function getStylePresetDescription(label: string): string {
  return STYLE_PRESETS.find((s) => s.label === label)?.description || ""
}

export const STYLE_PRESETS: StylePresetItem[] = [
  // 写实都市
  {
    label: "都市霸总",
    description:
      "现代都市高质感写实，冷色调或香槟金点缀，西装革履、豪车豪宅，强调权力感与精致布光，适合霸总题材。",
    category: "realistic",
  },
  {
    label: "现代都市",
    description: "当代城市生活写实风，自然光与街景霓虹并存，生活化场景与真实材质，偏纪实感。",
    category: "realistic",
  },
  {
    label: "商战职场",
    description: "写字楼、会议室、数据大屏等职场场景，利落剪裁与中性配色，画面干练、偏电影感。",
    category: "realistic",
  },
  {
    label: "豪门世家",
    description: "奢华别墅、宴会、珠宝与礼服，暖金与深色木饰面，强调阶层与仪式感。",
    category: "realistic",
  },
  {
    label: "甜宠恋爱",
    description: "明亮柔和色调、浅景深与温馨小场景，人物表情细腻，整体轻盈浪漫。",
    category: "realistic",
  },
  {
    label: "悬疑犯罪",
    description: "低饱和、强对比光影，雨夜、巷弄、警局等冷峻场景，压抑紧张的氛围。",
    category: "realistic",
  },
  // 古装玄幻
  {
    label: "古装仙侠",
    description: "飘逸汉服、仙山云海、法术光效，唯美空灵，偏东方仙侠影视剧视觉。",
    category: "fantasy",
  },
  {
    label: "武侠江湖",
    description: "江湖客栈、竹林刀光、尘土与雨水，动作感强，偏写实武侠片质感。",
    category: "fantasy",
  },
  {
    label: "东方玄幻",
    description: "异世界与东方元素融合，奇兽、秘境、符文，想象力强但仍带东方审美。",
    category: "fantasy",
  },
  {
    label: "宫廷权谋",
    description: "宫殿、朝服、烛火与暗涌，庄重构图与厚重色彩，强调权谋张力。",
    category: "fantasy",
  },
  {
    label: "神话传说",
    description: "神祇、祥瑞、古典纹样与史诗尺度场景，庄严华丽、偏神话大片。",
    category: "fantasy",
  },
  {
    label: "西方奇幻",
    description: "城堡、精灵、龙与魔法，偏欧美奇幻影视与插画的中高幻想调性。",
    category: "fantasy",
  },
  // 科幻未来
  {
    label: "硬核科幻",
    description: "科学细节可信、飞船与空间站、冷金属与仪表光，偏《太空漫游》式写实科幻。",
    category: "scifi",
  },
  {
    label: "赛博朋克",
    description: "霓虹雨夜、义体与全息广告，高反差与粉青配色，密集都市与未来贫民窟对比。",
    category: "scifi",
  },
  {
    label: "星际太空",
    description: "星云、舰队、异星地表与舱内舷窗，宏大尺度与深邃宇宙感。",
    category: "scifi",
  },
  {
    label: "末世废土",
    description: "黄沙、残骸、简易装备与匮乏感，低饱和、风沙与锈迹材质为主。",
    category: "scifi",
  },
  {
    label: "蒸汽朋克",
    description: "黄铜齿轮、维多利亚服装与蒸汽机械，暖棕与铜绿，复古未来感。",
    category: "scifi",
  },
  {
    label: "生化危机",
    description: "实验室、防护服、变异与警戒红光，惊悚紧张，偏生物恐怖题材视觉。",
    category: "scifi",
  },
  // 动漫插画
  {
    label: "日漫风",
    description: "赛璐璐或现代日本动画上色，清晰线稿、大眼睛与夸张表情，二次元典型观感。",
    category: "anime",
  },
  {
    label: "美漫风格",
    description: "粗线轮廓、高饱和配色与肌肉块面感，类似超级英雄漫画与动态分格。",
    category: "anime",
  },
  {
    label: "国漫风格",
    description: "国产网络动画常见画风，介于日漫与国风设定之间，线条干净、配色偏亮丽。",
    category: "anime",
  },
  {
    label: "像素风格",
    description: "低分辨率像素块、有限色板与复古游戏感，可带 dither 与 8/16bit 质感。",
    category: "anime",
  },
  {
    label: "chibi 萌系",
    description: "二头身大头小身、圆润线条与可爱配色，偏 Q 版与萌系周边视觉。",
    category: "anime",
  },
  {
    label: "黑白漫画",
    description: "纯黑白网点与速度线，强明暗对比，典型日式或港式漫画印刷感。",
    category: "anime",
  },
  // 艺术风格
  {
    label: "水墨风",
    description: "宣纸晕染、留白与飞白笔触，山水人物皆可，强调东方写意与气韵。",
    category: "art",
  },
  {
    label: "油画质感",
    description: "厚涂笔触、古典明暗与油画肌理，偏传统架上绘画观感。",
    category: "art",
  },
  {
    label: "水彩插画",
    description: "透明叠色、水痕与柔和边缘，清新或梦幻的插画绘本感。",
    category: "art",
  },
  {
    label: "复古胶片",
    description: "颗粒、褪色与漏光，模拟胶片色温与暗角，怀旧电影或老照片气质。",
    category: "art",
  },
  {
    label: "扁平插画",
    description: "少透视、大块面色与简洁图形，适合 UI 与矢量风商业插画。",
    category: "art",
  },
  {
    label: "暗黑哥特",
    description: "教堂、烛台、乌鸦与颓废蕾丝，暗紫黑红与宗教符号，神秘阴郁。",
    category: "art",
  },
]

export const DEFAULT_NEGATIVE_PROMPTS =
  "bad anatomy, text, watermark, low quality, blurry, deformed, extra limbs, disfigured"

// ── Script Shot Plan Types ──

export type ScriptShotPlanStatus = "draft" | "generated" | "edited"

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
  episodeId: string
  index: number
  content: string | null
  prompt: string
  negativePrompt: string | null
  duration: number
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
  videoDuration: number | null
  videoTaskId: string | null
  createdAt: string
  updatedAt: string
}

export type VideoStatus = "idle" | "generating" | "completed" | "error"

export interface ScriptShotPlan {
  id: string
  projectId: string
  episodeId: string
  episode: {
    id: string
    index: number
    title: string
    script: string
    shotType: string
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
  content?: string
  prompt: string
  negativePrompt?: string
  duration?: number
  imageType?: ImageType | null
  imageUrl?: string | null
  imageUrls?: string | null
  promptEnd?: string | null
  gridLayout?: GridLayout | null
  gridPrompts?: string | null
  scriptLineIds?: string | null
  dialogueText?: string | null
  actionNote?: string | null
  characterIds?: string | null
  sceneId?: string | null
  propIds?: string | null
  videoUrl?: string | null
  videoStatus?: VideoStatus | null
  videoPrompt?: string | null
  videoDuration?: number | null
  videoTaskId?: string | null
  insertAfter?: string
}

export interface ScriptShotGenerateResult {
  scriptShotPlans: ScriptShotPlan[]
  stats: {
    episodeCount: number
    totalShots: number
    avgShotsPerEpisode: number
    generatedEpisodes: number
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

export type AiTaskType =
  | "llm_outline"
  | "llm_extract_assets"
  | "llm_script"
  | "llm_shot"
  | "image_generate"
  | "shot_video_generate"
  | "video_generate"
  | "tts_generate"

export type AiTaskStatus = "queued" | "running" | "succeeded" | "failed" | "cancelled"

export interface AiTask {
  id: string
  projectId: string
  episodeId: string | null
  shotId: string | null
  videoCompositionId: string | null
  targetInfo: string
  taskType: AiTaskType
  status: AiTaskStatus
  model: string | null
  errorCode: string | null
  errorMessage: string | null
  retryCount: number
  maxRetries: number
  startedAt: string | null
  finishedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface AiTaskListResponse {
  items: AiTask[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
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
