/**
 * 资产提取 — Prompt 模板（与业务解耦，便于后续在设置页/项目级配置中编辑）
 */

/** 模板中章节内容占位符，生成完整 prompt 时会被替换 */
export const EXTRACT_ASSETS_CHAPTERS_PLACEHOLDER = "{CHAPTERS_TEXT}" as const

/**
 * 默认资产提取系统提示词模板
 */
export const DEFAULT_EXTRACT_ASSETS_SYSTEM_PROMPT_TEMPLATE = `你是一位专业的短剧制作资产管理专家。请根据以下小说章节内容，提取并整理出该项目所需的全部资产。

## 任务
请从以上内容中提取三类资产：

## 1. 角色（characters）
1. 角色筛选标准：
- 提取所有在章节中出现的角色（包括主角、配角、龙套）提取并整理角色形象，并生成可用于AI绘画模型的高质量提示词（Prompt）。
- 每个角色包含：名字、角色类型（protagonist/supporting/extra）、性别、角色描述、性格描述

2. 每个角色需要以下视觉信息（即使原文没有也要合理推测）：
- 外貌特征（脸型、五官、发型、发色、肤色）
- 身材体型、服装（款式、颜色、材质）
- 气质（如冷酷、温柔、邪魅等）
- 身份/职业
- 辨识特征（伤疤、饰品、武器等）
- 着装描述
- 场景
不要照抄原文，要转化为视觉语言，避免抽象描述（如“很强大”要转为视觉表达）

## 2. 场景（scenes）
1. 场景筛选标准：
- 提取所有在章节中出现的地点/环境,并为每一个地点/环境生成可用于AI绘图提示词
- 合并相同或相似的场景，使用最常用的名称

2. 每个场景需补全以下视觉信息（即使原文没有也要合理推测）：
- 时间
- 环境细节
- 氛围情绪
- 关键视觉元素。
不要照抄原文，要转化为视觉语言

## 3. 道具（props）

1. 道具筛选标准：
- 提取在剧情中有重要作用的道具/物品，并为每一个道具生成可用于AI绘图提示词。
- 必须是具体可视的物体（如武器、饰品、书籍、工具、器具等）
- 忽略抽象概念（如情绪、气氛、能力）
- 忽略人体（除非是“装备的一部分”，如盔甲）

2. 每个道具需补全以下视觉信息（即使原文没有也要合理推测）：
- 材质
- 风格
- 颜色
- 细节装饰
- 状态

3. 提示词结构建议：
主体 + 材质 + 风格 + 细节 + 光影 + 背景 + 质量词

## 输出格式
请严格按以下 JSON 格式输出，不要包含任何额外说明、注释或 markdown 代码块标记：

{
  "characters": [
    {
      "name": "角色名",
      "role": "protagonist",
      "gender": "female",
      "prompt": "角色描述（外貌特征，用于生成角色立绘）"
    }
  ],
  "scenes": [
    {
      "name": "场景名",
      "prompt": "场景描述（环境描述，用于生成场景图片）",
      "tags": "室内,现代,豪华"
    }
  ],
  "props": [
    {
      "name": "道具名",
      "prompt": "道具描述（道具描述，用于生成道具图片）"
    }
  ]
}
`

/**
 * 默认资产提取用户提示词模板
 */
export const DEFAULT_EXTRACT_ASSETS_USER_PROMPT_TEMPLATE = `
## 小说章节内容
${EXTRACT_ASSETS_CHAPTERS_PLACEHOLDER}
`

export interface BuildExtractAssetsSystemPromptOptions {
  /** 自定义系统提示词模板 */
  template?: string
}

export interface BuildExtractAssetsUserPromptOptions {
  /** 自定义用户提示词模板；须包含占位符，否则将追加在末尾 */
  template?: string
}

/**
 * 构建系统提示词
 */
export function buildExtractAssetsSystemPrompt(
  options?: BuildExtractAssetsSystemPromptOptions
): string {
  const raw = options?.template?.trim()
    ? options.template
    : DEFAULT_EXTRACT_ASSETS_SYSTEM_PROMPT_TEMPLATE
  return raw.trim()
}

/**
 * 将章节内容注入模板，得到发给 LLM 的完整 user prompt。
 */
export function buildExtractAssetsUserPrompt(
  chaptersText: string,
  options?: BuildExtractAssetsUserPromptOptions
): string {
  const raw = options?.template?.trim()
    ? options.template
    : DEFAULT_EXTRACT_ASSETS_USER_PROMPT_TEMPLATE

  if (raw.includes(EXTRACT_ASSETS_CHAPTERS_PLACEHOLDER)) {
    return raw.split(EXTRACT_ASSETS_CHAPTERS_PLACEHOLDER).join(chaptersText)
  }

  // 兼容用户误删占位符：在末尾追加章节内容块
  return `${raw}\n\n## 小说章节内容\n${chaptersText}`
}

/**
 * @deprecated 请改用 buildExtractAssetsSystemPrompt 和 buildExtractAssetsUserPrompt
 */
export function buildExtractAssetsPrompt(
  chaptersText: string,
  options?: any
): string {
  return (
    buildExtractAssetsSystemPrompt() +
    "\n\n" +
    buildExtractAssetsUserPrompt(chaptersText, options)
  )
}
