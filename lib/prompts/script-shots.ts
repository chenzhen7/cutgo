/**
 * 分镜生成 — Prompt 模板（与业务解耦，便于后续在设置页/项目级配置中编辑）
 */

export const SCRIPT_SHOTS_EPISODE_TITLE_PLACEHOLDER = "{EPISODE_TITLE}" as const
export const SCRIPT_SHOTS_EPISODE_SCENES_PLACEHOLDER = "{EPISODE_SCENES}" as const
export const SCRIPT_SHOTS_EPISODE_CHARACTERS_PLACEHOLDER = "{EPISODE_CHARACTERS}" as const
export const SCRIPT_SHOTS_EPISODE_PROPS_PLACEHOLDER = "{EPISODE_PROPS}" as const
export const SCRIPT_SHOTS_SCRIPT_CONTENT_PLACEHOLDER = "{SCRIPT_CONTENT}" as const
export const SCRIPT_SHOTS_PREVIOUS_SHOT_PLACEHOLDER = "{PREVIOUS_SHOT}" as const

export const DEFAULT_SCRIPT_SHOTS_PROMPT_TEMPLATE = `你是一位资深分镜师和 AI 图像生成 Prompt 专家，擅长将剧本转化为高质量的分镜提示词。

## 任务
请基于以下剧本内容，为每个关键镜头生成高质量的分镜提示词（Prompt）。

## 剧本信息
- 标题：${SCRIPT_SHOTS_EPISODE_TITLE_PLACEHOLDER}
- 关联场景：${SCRIPT_SHOTS_EPISODE_SCENES_PLACEHOLDER}
- 出场角色：${SCRIPT_SHOTS_EPISODE_CHARACTERS_PLACEHOLDER}
- 涉及道具：${SCRIPT_SHOTS_EPISODE_PROPS_PLACEHOLDER}

## 剧本内容
${SCRIPT_SHOTS_SCRIPT_CONTENT_PLACEHOLDER}

${SCRIPT_SHOTS_PREVIOUS_SHOT_PLACEHOLDER}

## 要求
1. 将剧本内容转化为具体的镜头序列，通常一个剧本拆分为 4-12 个镜头
2. 每个镜头需包含：
   - prompt：英文分镜提示词（用于 AI 图像生成模型）
   - negativePrompt：英文负面提示词
   - dialogueText：该镜头期间的台词/旁白文本（如有）
   - actionNote：动作/情节备注（如有）
3. prompt 编写指南：
   - 使用英文，详细且具体
   - 包含：主体描述、场景环境、光影氛围、色调风格、画面构图
   - 角色描述要具体：外貌特征、服装、表情、动作姿态
   - 环境描述要丰富：时间、天气、光线方向、材质细节
   - 可以加入风格关键词：cinematic, photorealistic, dramatic lighting 等
4. 镜头之间应有叙事连贯性，覆盖剧本的关键情节

## 输出格式
请严格按以下 JSON 格式输出：

{
  "shots": [
    {
      "prompt": "English storyboard prompt...",
      "negativePrompt": "blurry, low quality...",
      "dialogueText": "台词文本",
      "actionNote": "动作备注"
    }
  ]
}
`

export interface BuildScriptShotsPromptInput {
  episodeTitle: string
  episodeScenes: string
  episodeCharacters: string
  episodeProps: string
  scriptContent: string
  previousShot: string | null
}

export interface BuildScriptShotsPromptOptions {
  /** 自定义模板；若缺失占位符字段，会在末尾追加对应段落 */
  template?: string
}

function replaceAll(source: string, search: string, replacement: string): string {
  return source.split(search).join(replacement)
}

function appendIfMissing(hasPlaceholder: boolean, result: string, fallbackBlock: string): string {
  if (hasPlaceholder || !fallbackBlock.trim()) return result
  return `${result}\n${fallbackBlock}`
}

export function buildScriptShotsPrompt(
  input: BuildScriptShotsPromptInput,
  options?: BuildScriptShotsPromptOptions
): string {
  const raw = options?.template?.trim()
    ? options.template
    : DEFAULT_SCRIPT_SHOTS_PROMPT_TEMPLATE

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
