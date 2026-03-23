/**
 * 资产提取 — Prompt 模板（与业务解耦，便于后续在设置页/项目级配置中编辑）
 */

/** 模板中章节内容占位符，生成完整 prompt 时会被替换 */
export const EXTRACT_ASSETS_CHAPTERS_PLACEHOLDER = "{CHAPTERS_TEXT}" as const

/**
 * 默认资产提取模板（含占位符 {@link EXTRACT_ASSETS_CHAPTERS_PLACEHOLDER}）
 * 后续可从数据库或用户设置读取后传入 {@link buildExtractAssetsPrompt}
 */
export const DEFAULT_EXTRACT_ASSETS_PROMPT_TEMPLATE = `你是一位专业的短剧制作资产管理专家。请根据以下小说章节内容，提取并整理出该项目所需的全部资产。

## 小说章节内容
${EXTRACT_ASSETS_CHAPTERS_PLACEHOLDER}

## 任务
请从以上内容中提取三类资产：

### 1. 角色（characters）
- 提取所有在章节中出现的角色（包括主角、配角、龙套）
- 每个角色包含：名字、角色类型（protagonist/supporting/extra）、性别、角色描述、角色外貌、性格描述

### 2. 场景（scenes）
- 提取所有在章节中出现的地点/环境
- 合并相同或相似的场景，使用最常用的名称
- 每个场景包含：名称、环境描述、标签（逗号分隔）

### 3. 道具（props）
- 提取在剧情中有重要作用的道具/物品
- 每个道具包含：名称、描述

## 输出格式
请严格按以下 JSON 格式输出，不要包含任何额外说明、注释或 markdown 代码块标记：

{
  "characters": [
    {
      "name": "角色名",
      "role": "protagonist",
      "gender": "female",
      "description": "角色简介（包含外貌特征、身份背景等）",
      "personality": "性格描述"
    }
  ],
  "scenes": [
    {
      "name": "场景名",
      "description": "场景环境描述",
      "tags": "室内,现代,豪华"
    }
  ],
  "props": [
    {
      "name": "道具名",
      "description": "道具描述"
    }
  ]
}
`

export interface BuildExtractAssetsPromptOptions {
  /** 自定义模板；须包含占位符 {@link EXTRACT_ASSETS_CHAPTERS_PLACEHOLDER}，否则将追加在末尾 */
  template?: string
}

/**
 * 将章节内容注入模板，得到发给 LLM 的完整 user prompt。
 */
export function buildExtractAssetsPrompt(
  chaptersText: string,
  options?: BuildExtractAssetsPromptOptions
): string {
  const raw = options?.template?.trim()
    ? options.template
    : DEFAULT_EXTRACT_ASSETS_PROMPT_TEMPLATE

  if (raw.includes(EXTRACT_ASSETS_CHAPTERS_PLACEHOLDER)) {
    return raw.split(EXTRACT_ASSETS_CHAPTERS_PLACEHOLDER).join(chaptersText)
  }

  // 兼容用户误删占位符：在末尾追加章节内容块
  return `${raw}\n\n## 小说章节内容\n${chaptersText}`
}
