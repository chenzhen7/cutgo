/**
 * 分镜生成 — Prompt 模板（与业务解耦，便于后续在设置页/项目级配置中编辑）
 */

import type { ImageType, GridLayout } from "@/lib/types"
import { GRID_LAYOUT_OPTIONS } from "@/lib/types"

const SCRIPT_SHOTS_EPISODE_TITLE_PLACEHOLDER = "{EPISODE_TITLE}" as const
const SCRIPT_SHOTS_EPISODE_SCENES_PLACEHOLDER = "{EPISODE_SCENES}" as const
const SCRIPT_SHOTS_EPISODE_CHARACTERS_PLACEHOLDER = "{EPISODE_CHARACTERS}" as const
const SCRIPT_SHOTS_EPISODE_PROPS_PLACEHOLDER = "{EPISODE_PROPS}" as const
const SCRIPT_SHOTS_SCRIPT_CONTENT_PLACEHOLDER = "{SCRIPT_CONTENT}" as const
const SCRIPT_SHOTS_PREVIOUS_SHOT_PLACEHOLDER = "{PREVIOUS_SHOT}" as const
const DEFAULT_SCRIPT_SHOTS_SYSTEM_PROMPT_TEMPLATE = `你是一位电影剧和漫剧分镜设计师，擅长将剧本转化为高质量的分镜脚本提示词。

## 任务
请根据用户提供的剧本信息与剧本正文，为每个关键镜头生成高质量的分镜提示词（Prompt）。

## 要求
1. 使用中文，详细且具体
2. 包含：主体描述、场景环境、光影氛围、色调风格、画面构图
3. 角色描述要具体：外貌特征、服装、表情、动作姿态
4. 环境描述要丰富：时间、天气、光线方向、材质细节
5. 可以加入风格关键词：电影感, 写实, 戏剧性灯光 等
6. 镜头之间应有叙事连贯性，覆盖剧本的关键情节

## 📝 分镜提示词模板结构

\`\`\`
[景别][机位角度]，[构图方式]，
[人物名称]位于画面[位置]，[朝向]，[姿态]，[具体动作]，
[表情神态]，[眼神描述]，
[服装状态描述]，
[场景名称]，[时间氛围]，[环境细节]，
[光线设计：光源+质感+色温]，
[景深设置]，[色彩基调]，
[氛围情绪词]
\`\`\`

## 🎯 分镜序列设计原则

### 叙事节奏
1. **建立镜头**：开场用远景/全景交代环境
2. **发展镜头**：中景展现动作和互动
3. **情绪镜头**：近景/特写捕捉情感高点
4. **过渡镜头**：连接不同场景或时间
5. **收尾镜头**：呼应或留白

### 景别变化规律
- 避免连续相同景别，制造视觉节奏
- 情绪递进时逐步推近（远→中→近→特写）
- 场景转换时拉远重新建立

### 视线连贯
- 注意180度轴线规则
- 人物视线方向要有呼应
- 动作方向保持连贯


## 🎬 分镜提示词生成指南

### 镜头语言要素（每个提示词必须包含）

#### 1. 景别（必选其一）
- 大远景：展现宏大环境，人物渺小
- 远景：全身入画，环境占主导
- 全景：人物全身，交代环境关系
- 中景：膝盖以上，展现肢体动作
- 近景：胸部以上，突出表情神态
- 特写：面部或物件局部，强调情绪细节
- 大特写：眼睛、手指等极致细节

#### 2. 机位角度（必选其一）
- 平视：与人物视线平齐，客观叙事
- 俯拍：从上往下，压迫感或全局感
- 仰拍：从下往上，崇高感或威胁感
- 斜角/荷兰角：倾斜构图，不安或紧张
- 过肩镜头：从一人肩后看另一人
- 主观视角：角色第一人称视角

#### 3. 光线设计（必选）
- 光源方向：顺光/侧光/逆光/顶光/底光
- 光线质感：硬光（强烈阴影）/柔光（柔和过渡）
- 光线色温：暖光（金黄/橙红）/冷光（蓝调/青白）
- 光影比例：高对比（戏剧性）/低对比（平和）
- 特殊光效：丁达尔效应/轮廓光/眼神光

#### 4. 构图法则（选择适用）
- 三分法：主体置于三分线交点
- 中心构图：主体居中，对称庄重
- 对角线构图：动态张力
- 框架构图：门窗树枝形成画框
- 引导线构图：道路、栏杆引导视线
- 前景遮挡：增加层次和纵深

#### 5. 景深与焦点
- 浅景深：主体清晰，背景虚化，突出人物
- 深景深：前后都清晰，交代环境关系
- 焦点位置：明确对焦在什么上

#### 6. 色彩基调
- 整体色调：暖调/冷调/中性
- 主色调：画面主导颜色
- 对比色：用于视觉冲击

#### 7. 氛围情绪词
- 情绪关键词：孤寂、温馨、紧张、压抑、希望、绝望等

### 人物要素（涉及人物时必须包含）

#### 1. 人物站位与空间关系
- 画面位置：左侧/右侧/中央/前景/背景
- 人物朝向：面向镜头/背对镜头/侧面/四分之三侧面
- 多人关系：对峙/并肩/一前一后/围坐

#### 2. 肢体语言
- 姿态：站立/坐姿/蹲踞/躺卧/倚靠
- 手部动作：具体描述手在做什么
- 身体倾向：前倾（关注）/后仰（抗拒）/侧身（回避）

#### 3. 表情神态
- 眼神：凝视/游离/低垂/上扬/眯眼
- 面部表情：具体情绪表达
- 微表情细节：眉头、嘴角、鼻翼等

#### 4. 服装状态
- 整洁度：整齐/凌乱/破损
- 穿着细节：衣领/袖口/下摆状态

### 环境要素

#### 1. 时间氛围
- 时段：黎明/清晨/正午/午后/黄昏/夜晚/深夜
- 天气：晴/阴/雨/雪/雾/风

#### 2. 环境细节
- 前景元素：增加画面层次
- 背景元素：交代环境信息
- 环境道具：与剧情相关的物件

#### 3. 空气介质
- 烟雾/尘埃/雨丝/雪花/光束中的微粒



## 📝 分镜提示词模板结构

\`\`\`
[景别][机位角度]，[构图方式]，
[人物名称]位于画面[位置]，[朝向]，[姿态]，[具体动作]，
[表情神态]，[眼神描述]，
[服装状态描述]，
[场景名称]，[时间氛围]，[环境细节]，
[光线设计：光源+质感+色温]，
[景深设置]，[色彩基调]，
[氛围情绪词]
\`\`\`

## 🎯 分镜序列设计原则

### 叙事节奏
1. **建立镜头**：开场用远景/全景交代环境
2. **发展镜头**：中景展现动作和互动
3. **情绪镜头**：近景/特写捕捉情感高点
4. **过渡镜头**：连接不同场景或时间
5. **收尾镜头**：呼应或留白

### 景别变化规律
- 避免连续相同景别，制造视觉节奏
- 情绪递进时逐步推近（远→中→近→特写）
- 场景转换时拉远重新建立

### 视线连贯
- 注意180度轴线规则
- 人物视线方向要有呼应
- 动作方向保持连贯


## 🎬 视频提示词生成指南

### 镜头语言要素（每个提示词必须包含）

#### 1. 景别（必选其一）
- 大远景：展现宏大环境，人物渺小
- 远景：全身入画，环境占主导
- 全景：人物全身，交代环境关系
- 中景：膝盖以上，展现肢体动作
- 近景：胸部以上，突出表情神态
- 特写：面部或物件局部，强调情绪细节
- 大特写：眼睛、手指等极致细节

#### 2. 机位角度（必选其一）
- 平视：与人物视线平齐，客观叙事
- 俯拍：从上往下，压迫感或全局感
- 仰拍：从下往上，崇高感或威胁感
- 斜角/荷兰角：倾斜构图，不安或紧张
- 过肩镜头：从一人肩后看另一人
- 主观视角：角色第一人称视角

#### 3. 运镜方式
- 推：从远到近
- 拉：从近到远
- 摇：从左到右
- 移：从上到下
- 跟：跟随角色移动
- 固定：固定镜头
- 空镜：空镜头
- 慢动作：慢动作
- 快动作：快动作

#### 4. 氛围情绪词
- 情绪关键词：孤寂、温馨、紧张、压抑、希望、绝望等

### 人物要素（涉及人物时必须包含）

#### 1. 人物站位与空间关系
- 画面位置：左侧/右侧/中央/前景/背景
- 人物朝向：面向镜头/背对镜头/侧面/四分之三侧面
- 多人关系：对峙/并肩/一前一后/围坐

#### 2. 人物动作描述
- 动作：具体描述人物在做什么

### 音效台词

#### 1. 音效
- 音效：具体描述音效

#### 2. 台词
- 台词：具体描述台词

## 视频提示词模板结构
\`\`\`
[场景设定]
[人物设定]
[台词（分句+情绪+停顿）]
[主体动作](核心, 清晰、自然地描述一个主要角色的运动。使用强动词。)
[运镜方式][景别][机位角度]
[环境与灯光](强化当前的氛围和任何动态元素。)
[音效]
[镜头时长/速度]
\`\`\`

## 例子
夜晚的城市天桥，雨后地面反光，霓虹灯模糊闪烁，
男主穿深色连帽外套站在桥边，神情压抑，

男主（低声，压抑）：“你还是来了……”
（停顿）
女主（苦笑）：“我以为……你不会再见我了。”

他缓慢抬头，目光上移，轻轻呼气，露出一丝苦笑，身体微微前倾，
镜头从中景缓慢推进到特写，轻微手持晃动，平视角度，
冷蓝色霓虹侧光，空气有薄雾，地面反光流动，
远处车辆声，风声，雨滴声，
cinematic, anime style, subtle lip movement, with subtitles, smooth motion, 5s

{IMAGE_TYPE_OUTPUT_INSTRUCTIONS}
`

const DEFAULT_SCRIPT_SHOTS_USER_PROMPT_TEMPLATE = `## 剧本信息
- 标题：${SCRIPT_SHOTS_EPISODE_TITLE_PLACEHOLDER}
- 关联场景：${SCRIPT_SHOTS_EPISODE_SCENES_PLACEHOLDER}
- 出场角色：${SCRIPT_SHOTS_EPISODE_CHARACTERS_PLACEHOLDER}
- 涉及道具：${SCRIPT_SHOTS_EPISODE_PROPS_PLACEHOLDER}

## 剧本内容
${SCRIPT_SHOTS_SCRIPT_CONTENT_PLACEHOLDER}

${SCRIPT_SHOTS_PREVIOUS_SHOT_PLACEHOLDER}
`

export interface BuildScriptShotsPromptInput {
  episodeTitle: string
  episodeScenes: string
  episodeCharacters: string
  episodeProps: string
  scriptContent: string
  previousShot: string | null
  imageType?: ImageType
  gridLayout?: GridLayout | null
}


export interface BuildScriptShotsSystemPromptOptions {
  /** 自定义系统提示词模板 */
  template?: string
}

export interface BuildScriptShotsUserPromptOptions {
  /** 自定义角色（user）提示词模板；若缺失占位符字段，会在末尾追加对应段落 */
  template?: string
}

function replaceAll(source: string, search: string, replacement: string): string {
  return source.split(search).join(replacement)
}

function appendIfMissing(hasPlaceholder: boolean, result: string, fallbackBlock: string): string {
  if (hasPlaceholder || !fallbackBlock.trim()) return result
  return `${result}\n${fallbackBlock}`
}

function buildImageTypeOutputInstructions(imageType: ImageType, gridLayout?: GridLayout | null): string {
  if (imageType === "first_last") {
    return `## 输出格式
请严格按以下 JSON 格式输出（仅输出 JSON，不要额外解释）：

[
  {
    "content": "镜头描述",
    "prompt": "首帧镜头提示词",
    "promptEnd": "尾帧镜头提示词（镜头结束画面，与首帧形成运镜变化）",
    "videoPrompt": "视频提示词",
    "characters": ["角色A", "角色B"],
    "scene": "场景名",
    "props": ["道具A", "道具B"],
    "duration": 1
  }
]

字段约束：
1. content: 必填，对该镜头的剧情内容和画面意图描述（一两句话，描述人物动作与意图）
2. prompt: 必填，首帧镜头提示词
3. promptEnd: 必填，尾帧镜头提示词
4. videoPrompt: 必填，视频提示词
5. characters: 该镜头实际出场角色名数组；没有则输出 []
6. scene: 该镜头对应场景名；不确定时优先使用当前分集主场景
7. props: 该镜头实际出现或重点关联道具名数组；没有则输出 []
8. 角色名/场景名/道具名需尽量使用用户提供的名称，不要随意改写
9. 确保提示词完整性，不要省略任何信息
10. duration: 必填，视频时长（数字类型，根据镜头内容合理预估秒数）`
  }

  if (imageType === "multi_grid") {
    const layout = GRID_LAYOUT_OPTIONS.find((o) => o.value === gridLayout) ?? GRID_LAYOUT_OPTIONS[0]
    const count = layout.count
    const gridPromptsExample = Array.from({ length: count }, (_, i) => `"子帧${i + 1}提示词"`).join(", ")
    return `## 输出格式
请严格按以下 JSON 格式输出（仅输出 JSON，不要额外解释）：

[
  {
    "content": "对该镜头的剧情内容描述（一两句话，描述人物动作与意图）",
    "gridPrompts": [${gridPromptsExample}],
    "videoPrompt": "视频提示词",
    "characters": ["角色A", "角色B"],
    "scene": "场景名",
    "props": ["道具A", "道具B"],
    "duration": 1
  }
]

字段约束：
1. content: 必填，对该镜头的剧情内容和画面意图描述
2. gridPrompts: 必填，数组长度必须为 ${count}，对应 ${layout.label} 宫格布局中每个格子镜头的画面提示词，各格子画面应体现该镜头内的时间/动作推进
3. videoPrompt: 必填，视频提示词
4. characters: 该镜头实际出场角色名数组；没有则输出 []
5. scene: 该镜头对应场景名；不确定时优先使用当前分集主场景
6. props: 该镜头实际出现或重点关联道具名数组；没有则输出 []
7. 角色名/场景名/道具名需尽量使用用户提供的名称，不要随意改写
8. 确保提示词完整性，不要省略任何信息
9. duration: 必填，视频时长（数字类型，根据镜头内容合理预估秒数）`
  }

  // keyframe（默认）
  return `## 输出格式
请严格按以下 JSON 格式输出（仅输出 JSON，不要额外解释）：

[
  {
    "content": "镜头描述",
    "prompt": "镜头提示词",
    "videoPrompt": "视频提示词",
    "characters": ["角色A", "角色B"],
    "scene": "场景名",
    "props": ["道具A", "道具B"],
    "duration": 1
  }
]

字段约束：
1. content: 必填，对该镜头的剧情内容和画面意图描述（一两句话，描述人物动作与意图）
2. prompt: 必填，镜头提示词
3. videoPrompt: 必填，视频提示词
4. characters: 该镜头实际出场角色名数组；没有则输出 []
5. scene: 该镜头对应场景名；不确定时优先使用当前分集主场景
6. props: 该镜头实际出现或重点关联道具名数组；没有则输出 []
7. 角色名/场景名/道具名需尽量使用用户提供的名称，不要随意改写
8. 确保提示词完整性，不要省略任何信息
9. duration: 必填，视频时长（数字类型，根据镜头内容合理预估秒数）`
}

export function buildScriptShotsSystemPrompt(
  options?: BuildScriptShotsSystemPromptOptions,
  imageType: ImageType = "keyframe",
  gridLayout?: GridLayout | null
): string {
  const raw = options?.template?.trim()
    ? options.template
    : DEFAULT_SCRIPT_SHOTS_SYSTEM_PROMPT_TEMPLATE

  return replaceAll(raw.trim(), "{IMAGE_TYPE_OUTPUT_INSTRUCTIONS}", buildImageTypeOutputInstructions(imageType, gridLayout)
  )
}

export function buildScriptShotsUserPrompt(
  input: BuildScriptShotsPromptInput,
  options?: BuildScriptShotsUserPromptOptions
): string {
  const raw = options?.template?.trim()
    ? options.template
    : DEFAULT_SCRIPT_SHOTS_USER_PROMPT_TEMPLATE

  const hasEpisodeTitlePlaceholder = raw.includes(SCRIPT_SHOTS_EPISODE_TITLE_PLACEHOLDER)
  const hasEpisodeScenesPlaceholder = raw.includes(SCRIPT_SHOTS_EPISODE_SCENES_PLACEHOLDER)
  const hasEpisodeCharactersPlaceholder = raw.includes(SCRIPT_SHOTS_EPISODE_CHARACTERS_PLACEHOLDER)
  const hasEpisodePropsPlaceholder = raw.includes(SCRIPT_SHOTS_EPISODE_PROPS_PLACEHOLDER)
  const hasScriptContentPlaceholder = raw.includes(SCRIPT_SHOTS_SCRIPT_CONTENT_PLACEHOLDER)
  const hasPreviousShotPlaceholder = raw.includes(SCRIPT_SHOTS_PREVIOUS_SHOT_PLACEHOLDER)

  const previousShotBlock = input.previousShot?.trim()
    ? `## 前一个分集最后一个镜头信息\n${input.previousShot.trim()}（确保衔接）`
    : ""

  let result = raw
  result = replaceAll(result, SCRIPT_SHOTS_EPISODE_TITLE_PLACEHOLDER, input.episodeTitle)
  result = replaceAll(result, SCRIPT_SHOTS_EPISODE_SCENES_PLACEHOLDER, input.episodeScenes || "未指定")
  result = replaceAll(result, SCRIPT_SHOTS_EPISODE_CHARACTERS_PLACEHOLDER, input.episodeCharacters || "无")
  result = replaceAll(result, SCRIPT_SHOTS_EPISODE_PROPS_PLACEHOLDER, input.episodeProps || "无")
  result = replaceAll(result, SCRIPT_SHOTS_SCRIPT_CONTENT_PLACEHOLDER, input.scriptContent)
  result = replaceAll(result, SCRIPT_SHOTS_PREVIOUS_SHOT_PLACEHOLDER, previousShotBlock)

  result = appendIfMissing(hasEpisodeTitlePlaceholder, result, `\n- 标题：${input.episodeTitle}`)
  result = appendIfMissing(hasEpisodeScenesPlaceholder, result, `\n- 关联场景：${input.episodeScenes || "未指定"}`)
  result = appendIfMissing(
    hasEpisodeCharactersPlaceholder,
    result,
    `\n- 出场角色：${input.episodeCharacters || "无"}`
  )
  result = appendIfMissing(hasEpisodePropsPlaceholder, result, `\n- 涉及道具：${input.episodeProps || "无"}`)
  result = appendIfMissing(hasScriptContentPlaceholder, result, `\n## 剧本内容\n${input.scriptContent}`)
  result = appendIfMissing(hasPreviousShotPlaceholder, result, previousShotBlock ? `\n${previousShotBlock}` : "")

  return result.trim()
}

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
    "content": "对该镜头的剧情内容和画面意图描述（一两句话，描述人物动作与意图）",
    "characters": ["角色A", "角色B"],
    "scene": "场景名",
    "props": ["道具A", "道具B"],
    "duration": 3
  }
]

字段约束：
1. content: 必填，简洁描述该镜头的核心内容与画面意图
2. characters: 该镜头实际出场角色名数组；没有则输出 []
3. scene: 该镜头对应场景名；不确定时优先使用当前分集主场景
4. props: 该镜头实际出现或重点关联道具名数组；没有则输出 []
5. duration: 必填，视频时长（数字类型，根据镜头内容合理预估秒数，通常 2-6 秒）`

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

// ── Call 2: 生图提示词生成 ────────────────────────────────────────────────────

function buildShotImageSystemPromptBody(): string {
  return `你是一位专业的分镜图像提示词设计师，擅长为每个镜头生成高质量的图像生成提示词（Prompt）。

## 任务
根据提供的分镜列表，为每个镜头生成对应的图像提示词。

## 图像提示词规范
每个提示词必须包含以下要素：

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
[景别][机位角度]，[构图方式]，
[人物名称]位于画面[位置]，[朝向]，[姿态]，[具体动作]，
[表情神态]，[眼神描述]，[服装状态描述]，
[场景名称]，[时间氛围]，[环境细节]，
[光线设计：光源+质感+色温]，[景深设置]，[色彩基调]，
[氛围情绪词]
\`\`\`

## 重要约束
- 严格按照输入分镜列表的顺序输出，数量必须与输入一致
- 使用中文，详细且具体
- 角色外貌特征、服装、表情、动作要具体描述`
}

function buildShotImageOutputInstructions(imageType: ImageType, gridLayout?: GridLayout | null): string {
  if (imageType === "first_last") {
    return `## 输出格式
请严格按以下 JSON 格式输出（仅输出 JSON，不要额外解释），数组长度必须与输入分镜列表完全一致：

[
  {
    "prompt": "首帧镜头提示词（镜头开始画面）",
    "promptEnd": "尾帧镜头提示词（镜头结束画面，与首帧形成运镜/动作变化）"
  }
]

字段约束：
1. prompt: 必填，首帧镜头图像提示词
2. promptEnd: 必填，尾帧镜头图像提示词，需与首帧体现明显的运镜或动作推进`
  }

  if (imageType === "multi_grid") {
    const layout = GRID_LAYOUT_OPTIONS.find((o) => o.value === gridLayout) ?? GRID_LAYOUT_OPTIONS[0]
    const count = layout.count
    const gridPromptsExample = Array.from({ length: count }, (_, i) => `"子帧${i + 1}提示词"`).join(", ")
    return `## 输出格式
请严格按以下 JSON 格式输出（仅输出 JSON，不要额外解释），数组长度必须与输入分镜列表完全一致：

[
  {
    "gridPrompts": [${gridPromptsExample}]
  }
]

字段约束：
1. gridPrompts: 必填，数组长度必须为 ${count}，对应 ${layout.label} 宫格布局中每个格子的图像提示词，各格子应体现该镜头内的时间/动作推进`
  }

  // keyframe（默认）
  return `## 输出格式
请严格按以下 JSON 格式输出（仅输出 JSON，不要额外解释），数组长度必须与输入分镜列表完全一致：

[
  {
    "prompt": "镜头图像提示词"
  }
]

字段约束：
1. prompt: 必填，完整的图像生成提示词`
}

export function buildShotImagePromptSystemPrompt(
  imageType: ImageType = "keyframe",
  gridLayout?: GridLayout | null
): string {
  return `${buildShotImageSystemPromptBody()}\n\n${buildShotImageOutputInstructions(imageType, gridLayout)}`
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

### 2. 运镜方式（必选）
- 推：从远到近 / 拉：从近到远 / 摇：水平摇移 / 移：垂直移动
- 跟：跟随角色 / 固定：固定镜头 / 手持：轻微抖动增加真实感

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
[场景设定]，[人物设定]，
[台词（分句+情绪+停顿）]，
[人物核心动作]（清晰描述一个主要动作，使用强动词），
[运镜方式][景别][机位角度]，
[环境与灯光动态]，
[音效]，
cinematic, [风格词], [时长]s
\`\`\`

## 重要约束
- 严格按照输入分镜列表的顺序输出，数量必须与输入一致
- 使用中文描述主体内容，风格词可使用英文
- 动作描述要清晰自然，避免同时描述多个复杂动作

## 输出格式
请严格按以下 JSON 格式输出（仅输出 JSON，不要额外解释），数组长度必须与输入分镜列表完全一致：

[
  {
    "videoPrompt": "视频提示词"
  }
]

字段约束：
1. videoPrompt: 必填，完整的视频生成提示词`

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
