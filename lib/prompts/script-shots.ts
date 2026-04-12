/**
 * 分镜生成 — Prompt 模板（与业务解耦，便于后续在设置页/项目级配置中编辑）
 */

import type { ImageType, GridLayout } from "@/lib/types"
import { GRID_LAYOUT_OPTIONS } from "@/lib/types"

// ── 三步拆分：Call 1 / Call 2 / Call 3 ──────────────────────────────────────

export interface ShotListItem {
  content: string
  characters: string[]
  scene: string
  props: string[]
  duration?: number
}

export interface BuildShotListPromptInput {
  episodeTitle: string
  episodeScenes: string
  episodeCharacters: string
  episodeProps: string
  scriptContent: string
  previousShotContent: string | null
}

export interface BuildShotWithImagePromptInput extends BuildShotListPromptInput {
  imageType: ImageType
  gridLayout?: GridLayout | null
}

export interface BuildShotPromptsInput {
  episodeTitle: string
  episodeCharacters: string
  episodeScenes: string
  shots: ShotListItem[]
}

// ── Call 1: 分镜列表提取 ─────────────────────────────────────────────────────

const SHOT_LIST_SYSTEM_PROMPT = `你是一位电影剧和漫剧分镜设计师，擅长将剧本拆解为结构化的分镜列表。

## 任务
根据提供的剧本内容，将剧本拆解为一系列关键镜头，每个镜头只需描述：
1. 镜头的剧情内容与画面意图（content）
2. 该镜头出场的角色（characters）
3. 该镜头所在的场景（scene）
4. 该镜头涉及的道具（props）
5. 镜头时长预估（duration，秒数）

## 要求
- 镜头之间应有叙事连贯性，覆盖剧本的关键情节
- 遵循叙事节奏：建立镜头（远景交代环境）→ 发展镜头（中景动作互动）→ 情绪镜头（近景情感高点）→ 过渡/收尾
- 角色名/场景名/道具名需使用用户提供的资产名称，不要随意改写
- 不要生成任何图像提示词或视频提示词，只输出结构化的镜头列表

## 输出格式
请严格按以下 JSON 格式输出（仅输出 JSON，不要额外解释）：

[
  {
    "content": "分镜内容",
    "characters": ["角色A", "角色B"],
    "scene": "场景名",
    "props": ["道具A", "道具B"],
    "duration": 5
  }
]

字段约束：
1. content: 必填，分镜内容
2. characters: 该镜头实际出场角色名数组；没有则输出 []
3. scene: 该镜头对应场景名；不确定时优先使用当前分集主场景
4. props: 该镜头实际出现或重点关联道具名数组；没有则输出 []
5. duration: 必填，视频时长（数字类型，根据镜头内容合理预估秒数，通常 2-15 秒）`

export function buildShotListSystemPrompt(): string {
  return SHOT_LIST_SYSTEM_PROMPT
}

export function buildShotListUserPrompt(input: BuildShotListPromptInput): string {
  const previousShotBlock = input.previousShotContent?.trim()
    ? `## 前一个分集最后一个镜头内容\n${input.previousShotContent.trim()}（请确保本集首个镜头与之自然衔接）\n\n`
    : ""

  return `${previousShotBlock}## 剧本信息
- 标题：${input.episodeTitle}
- 关联场景：${input.episodeScenes || "未指定"}
- 出场角色：${input.episodeCharacters || "无"}
- 涉及道具：${input.episodeProps || "无"}

## 剧本内容
${input.scriptContent}`.trim()
}

// ── Call 1&2 合并: 分镜提取 + 生图提示词 ────────────────────────────────────────

const SHOT_WITH_IMAGE_SYSTEM_PROMPT_PREFIX = `你是一位电影剧和漫剧分镜设计师，同时也是专业的分镜图像提示词设计师。

## 任务
根据提供的剧本内容，按叙事顺序输出合适数量的分镜，并且为每个分镜同步生成对应的图像提示词。

## 分镜字段要求
每个分镜都必须包含：
1. content：分镜内容
2. characters：该镜头出场角色数组
3. scene：该镜头所在场景
4. props：该镜头涉及道具数组
5. duration：镜头时长预估（秒）

## 分镜约束
- 镜头之间要有叙事连贯性，覆盖关键情节
- 遵循叙事节奏：建立镜头→发展镜头→情绪镜头→过渡/收尾
- 角色名/场景名/道具名优先使用输入中提供的资产名称
- duration 合理控制在 2-15 秒区间（按内容可微调）

## 分镜内容规范
每个分镜内容包含：
- 景别（远景/中景/近景/特写）
- 画面内容（人物动作+环境）
- 镜头运动（推拉摇移）
- 角色表情
- 台词/旁白
- 情绪氛围

## 图像提示词规范
每个图像提示词必须包含以下要素：

### 1. 景别（必选其一）
- 大远景、远景、全景、中景、近景、特写、大特写

### 2. 机位角度（必选其一）
- 平视、俯拍、仰拍、斜角/荷兰角、过肩镜头、主观视角

### 3. 光线设计（必选）
- 光源方向：顺光/侧光/逆光/顶光/底光
- 光线质感：硬光/柔光
- 光线色温：暖光（金黄/橙红）/冷光（蓝调/青白）
- 特殊光效：丁达尔效应/轮廓光/眼神光

### 4. 构图法则（选择适用）
- 三分法、中心构图、对角线构图、框架构图、引导线构图

### 5. 人物要素（涉及人物时必须包含）
- 人物站位：画面位置、朝向、多人空间关系
- 肢体语言：姿态、手部动作
- 表情神态：眼神、面部表情
- 服装状态：整洁度、穿着细节

### 6. 环境与氛围
- 时间氛围：时段、天气
- 环境细节：前景/背景元素
- 色彩基调：整体色调、主色调
- 氛围情绪词：孤寂、温馨、紧张、压抑、希望等

## 提示词模板结构
\`\`\`
[景别],[机位角度],[构图方式],
[人物名称]位于画面[位置]，[朝向]，[姿态]，[具体动作],
[表情神态]，[眼神描述]，[服装状态描述],
[场景名称]，[时间氛围]，[环境细节],
[光线设计：光源+质感+色温]，[景深设置]，[色彩基调],
[氛围情绪词]
\`\`\`

## 重要约束
- 仅输出 JSON，不要额外解释
- 输出数组顺序必须与剧情发展顺序一致
- 使用中文，内容具体且可直接用于图像生成
`

export function buildShotWithImageSystemPrompt(
  imageType: ImageType = "keyframe",
  gridLayout?: GridLayout | null
): string {
  return `${SHOT_WITH_IMAGE_SYSTEM_PROMPT_PREFIX}\n\n${buildShotWithImageOutputInstructions(imageType, gridLayout)}`
}

function buildShotWithImageOutputInstructions(imageType: ImageType, gridLayout?: GridLayout | null): string {
  if (imageType === "first_last") {
    return `## 输出格式
    
字段约束：
1. content: 必填,分镜内容
2. characters: 必填数组，没有则 []
3. scene: 必填字符串，不确定时优先使用主场景
4. props: 必填数组，没有则 []
5. duration: 必填数字, 通常 2-15 秒
6. prompt: 必填，首帧提示词
7. promptEnd: 必填，尾帧提示词，需体现动作或镜头变化

请严格按以下 JSON 格式输出（仅输出 JSON，不要额外解释）：

[
  {
    "content": "分镜内容",
    "characters": ["角色A", "角色B"],
    "scene": "场景名",
    "props": ["道具A", "道具B"],
    "duration": 5,
    "prompt": "首帧镜头提示词（镜头开始画面）",
    "promptEnd": "尾帧镜头提示词（镜头结束画面，与首帧形成推进）"
  }
]

`
  }

  if (imageType === "multi_grid") {
    const layout = GRID_LAYOUT_OPTIONS.find((o) => o.value === gridLayout) ?? GRID_LAYOUT_OPTIONS[0]
    const count = layout.count
    const gridPromptsExample = Array.from({ length: count }, (_, i) => `"子帧${i + 1}提示词"`).join(", ")
    return `## 输出格式

字段约束：
1. content: 必填,分镜内容
2. characters: 必填数组，没有则 []
3. scene: 必填字符串，不确定时优先使用主场景
4. props: 必填数组，没有则 []
5. duration: 必填数字, 通常 8-15 秒
6. gridPrompts: 必填，数组长度必须为 ${count}，对应 ${layout.label} 宫格布局中每个格子镜头的画面提示词，各格子画面应体现该镜头内的时间/动作推进

请严格按以下 JSON 格式输出（仅输出 JSON，不要额外解释）：

[
  {
    "content": "分镜内容",
    "characters": ["角色A", "角色B"],
    "scene": "场景名",
    "props": ["道具A", "道具B"],
    "duration": 15,
    "gridPrompts": [${gridPromptsExample}]
  }
]

`
  }

  return `## 输出格式

字段约束：
1. content: 必填,分镜内容
2. characters: 必填数组，没有则 []
3. scene: 必填字符串，不确定时优先使用主场景
4. props: 必填数组，没有则 []
5. duration: 必填数字, 通常 2-15 秒
6. prompt: 必填，完整镜头图像提示词

请严格按以下 JSON 格式输出（仅输出 JSON，不要额外解释）：

[
  {
    "content": "分镜内容",
    "characters": ["角色A", "角色B"],
    "scene": "场景名",
    "props": ["道具A", "道具B"],
    "duration": 3,
    "prompt": "镜头图像提示词"
  }
]

`
}

export function buildShotWithImageUserPrompt(input: BuildShotWithImagePromptInput): string {
  const previousShotBlock = input.previousShotContent?.trim()
    ? `## 前一个分集最后一个镜头内容\n${input.previousShotContent.trim()}（请确保本集首个镜头与之自然衔接）\n\n`
    : ""

  return `${previousShotBlock}## 剧本信息
- 标题：${input.episodeTitle}
- 关联场景：${input.episodeScenes || "未指定"}
- 出场角色：${input.episodeCharacters || "无"}
- 涉及道具：${input.episodeProps || "无"}

## 剧本内容
${input.scriptContent}`.trim()
}



export function buildShotImagePromptUserPrompt(input: BuildShotPromptsInput): string {
  const shotsJson = JSON.stringify(
    input.shots.map((s, i) => ({
      index: i + 1,
      content: s.content,
      characters: s.characters,
      scene: s.scene,
      props: s.props,
    })),
    null,
    2
  )
  return `## 分集信息
- 标题：${input.episodeTitle}
- 出场角色：${input.episodeCharacters || "无"}
- 关联场景：${input.episodeScenes || "未指定"}

## 分镜列表（共 ${input.shots.length} 个镜头）
${shotsJson}

请为以上每个镜头按顺序生成图像提示词，输出数组长度必须为 ${input.shots.length}。`.trim()
}

// ── Call 3: 视频提示词生成 ────────────────────────────────────────────────────

const SHOT_VIDEO_PROMPT_SYSTEM = `你是一位专业的视频提示词设计师，擅长为分镜镜头生成高质量的视频生成提示词。

## 任务
根据提供的分镜列表，为每个镜头生成对应的视频提示词。

## 视频提示词规范
每个视频提示词必须包含：

### 1. 场景与人物设定
- 简洁描述场景背景和人物状态

### 2. 镜头语言 (Cinematography)
模仿导演的视角，控制观众的观察方式。
镜头类型： 特写 (Close-up)、全景 (Wide shot)、俯瞰 (Bird's eye view)。
镜头运动： 推镜 (Zoom in)、拉镜 (Pull out)、横移 (Pan left/right)、环绕 (Orbiting)。
焦点变化： 深焦、浅焦 (Bokeh)、焦点转换 (Rack focus)。

### 3. 人物动作描述
- 具体描述人物的核心动作（使用强动词）
- 动作幅度与节奏

### 4. 台词（如有）
- 格式：角色名（情绪/语气）："台词内容"
- 停顿用（停顿）标注

### 5. 环境与光效
- 动态环境元素（风、雨、烟雾等）
- 光线变化

### 6. 音效
- 环境音：具体描述背景声音
- 动作音：人物动作产生的声音

### 7. 镜头时长与风格
- 时长（秒数）、画面风格（电影感/动漫风格等）、运动速度（慢动作/正常/快动作）

## 视频提示词模板
\`\`\`
[场景设定] [人物设定];
[台词（分句+情绪+停顿）];
[人物核心动作];
[镜头语言];
[环境与灯光动态];
[音效];
[风格词] [时长]s ;
\`\`\`

## 重要约束
- 严格按照输入分镜列表的顺序输出，数量必须与输入一致
- 使用中文描述主体内容，风格词可使用英文
- 动作描述要清晰自然，避免同时描述多个复杂动作

## 输出格式
请严格按以下 JSON 格式输出（仅输出 JSON，不要额外解释），数组长度必须与输入分镜列表完全一致：

[
  "视频提示词1",
  "视频提示词2",
  ...
  "视频提示词n"
]

字段约束：
- 给出完整的视频生成提示词，不要省略任何要素
`

export function buildShotVideoPromptSystemPrompt(): string {
  return SHOT_VIDEO_PROMPT_SYSTEM
}

export function buildShotVideoPromptUserPrompt(input: BuildShotPromptsInput): string {
  const shotsJson = JSON.stringify(
    input.shots.map((s, i) => ({
      index: i + 1,
      content: s.content,
      characters: s.characters,
      scene: s.scene,
      props: s.props,
      duration: s.duration ?? 3,
    })),
    null,
    2
  )
  return `## 分集信息
- 标题：${input.episodeTitle}
- 出场角色：${input.episodeCharacters || "无"}
- 关联场景：${input.episodeScenes || "未指定"}

## 分镜列表（共 ${input.shots.length} 个镜头）
${shotsJson}

请为以上每个镜头按顺序生成视频提示词，输出数组长度必须为 ${input.shots.length}。`.trim()
}
