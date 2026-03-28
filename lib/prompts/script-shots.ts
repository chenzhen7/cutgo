/**
 * 分镜生成 — Prompt 模板（与业务解耦，便于后续在设置页/项目级配置中编辑）
 */

const SCRIPT_SHOTS_EPISODE_TITLE_PLACEHOLDER = "{EPISODE_TITLE}" as const
const SCRIPT_SHOTS_EPISODE_SCENES_PLACEHOLDER = "{EPISODE_SCENES}" as const
const SCRIPT_SHOTS_EPISODE_CHARACTERS_PLACEHOLDER = "{EPISODE_CHARACTERS}" as const
const SCRIPT_SHOTS_EPISODE_PROPS_PLACEHOLDER = "{EPISODE_PROPS}" as const
const SCRIPT_SHOTS_SCRIPT_CONTENT_PLACEHOLDER = "{SCRIPT_CONTENT}" as const
const SCRIPT_SHOTS_PREVIOUS_SHOT_PLACEHOLDER = "{PREVIOUS_SHOT}" as const

const DEFAULT_SCRIPT_SHOTS_SYSTEM_PROMPT_TEMPLATE = `你是一位资深分镜师和 AI 图像生成 Prompt 专家，擅长将剧本转化为高质量的分镜提示词。

## 任务
请根据用户提供的剧本信息与剧本正文，为每个关键镜头生成高质量的分镜提示词（Prompt）。

## 要求
1. 使用中文，详细且具体
2. 包含：主体描述、场景环境、光影氛围、色调风格、画面构图
3. 角色描述要具体：外貌特征、服装、表情、动作姿态
4. 环境描述要丰富：时间、天气、光线方向、材质细节
5. 可以加入风格关键词：电影感, 写实, 戏剧性灯光 等
6. 镜头之间应有叙事连贯性，覆盖剧本的关键情节

## 📝 提示词模板结构

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


## 🎬 电影分镜提示词生成规则

### 镜头数量
- 默认每个片段4个镜头，但以用户指定为准
- 用户可能要求4格、6格、12格等任意数量

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


## 输出格式
请严格按以下 JSON 格式输出（仅输出 JSON，不要额外解释）：

[
  {
    "shot": "镜头描述文本",
    "characters": ["角色A", "角色B"],
    "scene": "场景名",
    "props": ["道具A", "道具B"]
  }
]

字段约束：
1. shot： 必填，字符串
2. characters：该镜头实际出场角色名数组；没有则输出 []
3. scene：该镜头对应场景名；不确定时优先使用当前分集主场景
4. props：该镜头实际出现或重点关联道具名数组；没有则输出 []
5. 角色名/场景名/道具名需尽量使用用户提供的名称，不要随意改写

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



export function buildScriptShotsSystemPrompt(options?: BuildScriptShotsSystemPromptOptions): string {
  const raw = options?.template?.trim()
    ? options.template
    : DEFAULT_SCRIPT_SHOTS_SYSTEM_PROMPT_TEMPLATE
  return raw.trim()
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
