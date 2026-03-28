/**
 * 分镜生成 — Prompt 模板（与业务解耦，便于后续在设置页/项目级配置中编辑）
 */

export const SCRIPT_SHOTS_EPISODE_TITLE_PLACEHOLDER = "{EPISODE_TITLE}" as const
export const SCRIPT_SHOTS_EPISODE_SCENES_PLACEHOLDER = "{EPISODE_SCENES}" as const
export const SCRIPT_SHOTS_EPISODE_CHARACTERS_PLACEHOLDER = "{EPISODE_CHARACTERS}" as const
export const SCRIPT_SHOTS_EPISODE_PROPS_PLACEHOLDER = "{EPISODE_PROPS}" as const
export const SCRIPT_SHOTS_SCRIPT_CONTENT_PLACEHOLDER = "{SCRIPT_CONTENT}" as const
export const SCRIPT_SHOTS_ASSET_CHARACTERS_PLACEHOLDER = "{ASSET_CHARACTERS}" as const
export const SCRIPT_SHOTS_ASSET_SCENES_PLACEHOLDER = "{ASSET_SCENES}" as const
export const SCRIPT_SHOTS_PLATFORM_PLACEHOLDER = "{PLATFORM}" as const
export const SCRIPT_SHOTS_ASPECT_RATIO_PLACEHOLDER = "{ASPECT_RATIO}" as const
export const SCRIPT_SHOTS_STYLE_PRESET_PLACEHOLDER = "{STYLE_PRESET}" as const
export const SCRIPT_SHOTS_GLOBAL_NEG_PROMPT_PLACEHOLDER = "{GLOBAL_NEG_PROMPT}" as const
export const SCRIPT_SHOTS_PREVIOUS_SHOT_PLACEHOLDER = "{PREVIOUS_SHOT}" as const

export const DEFAULT_SCRIPT_SHOTS_PROMPT_TEMPLATE = `你是一位资深分镜师和 AI 图像生成 Prompt 专家，擅长将剧本转化为高质量的画面描述提示词。

## 任务
请基于以下剧本内容，为每个关键画面生成高质量的图像生成提示词（Prompt）。

## 剧本信息
- 标题：${SCRIPT_SHOTS_EPISODE_TITLE_PLACEHOLDER}
- 关联场景：${SCRIPT_SHOTS_EPISODE_SCENES_PLACEHOLDER}
- 出场角色：${SCRIPT_SHOTS_EPISODE_CHARACTERS_PLACEHOLDER}
- 涉及道具：${SCRIPT_SHOTS_EPISODE_PROPS_PLACEHOLDER}

## 剧本内容
${SCRIPT_SHOTS_SCRIPT_CONTENT_PLACEHOLDER}

## 角色资产（用于画面 Prompt 中的角色设定描述）
${SCRIPT_SHOTS_ASSET_CHARACTERS_PLACEHOLDER}

## 场景资产（用于画面 Prompt 中的环境描述）
${SCRIPT_SHOTS_ASSET_SCENES_PLACEHOLDER}

## 全局参数
- 目标平台：${SCRIPT_SHOTS_PLATFORM_PLACEHOLDER}
- 画幅比例：${SCRIPT_SHOTS_ASPECT_RATIO_PLACEHOLDER}
- 视觉风格：${SCRIPT_SHOTS_STYLE_PRESET_PLACEHOLDER}
- 全局负面提示词：${SCRIPT_SHOTS_GLOBAL_NEG_PROMPT_PLACEHOLDER}

${SCRIPT_SHOTS_PREVIOUS_SHOT_PLACEHOLDER}

## 要求
1. 将剧本内容转化为具体的画面序列，通常一个剧本拆分为 4-12 个画面
2. 每个画面需包含：
   - composition：画面描述（中文，简洁描述这个画面表现的内容和氛围）
   - prompt：英文图像生成提示词（用于 AI 图像生成模型）
   - negativePrompt：英文负面提示词
   - dialogueText：该画面期间的台词/旁白文本（如有）
   - actionNote：动作/情节备注（如有）
3. prompt 编写指南：
   - 使用英文，详细且具体
   - 包含：主体描述、场景环境、光影氛围、色调风格、画面构图
   - 角色描述要具体：外貌特征、服装、表情、动作姿态
   - 环境描述要丰富：时间、天气、光线方向、材质细节
   - 可以加入风格关键词：cinematic, photorealistic, dramatic lighting 等
   - 画幅比例 ${SCRIPT_SHOTS_ASPECT_RATIO_PLACEHOLDER} 的构图特点要体现在 prompt 中
4. 画面之间应有叙事连贯性，覆盖剧本的关键情节

## 输出格式
请严格按以下 JSON 格式输出：

{
  "shots": [
    {
      "composition": "画面中文描述",
      "prompt": "English image generation prompt...",
      "negativePrompt": "blurry, low quality...",
      "dialogueText": "台词文本",
      "actionNote": "动作备注"
    }
  ]
}

注意：不要在 shots 中包含 index 字段，系统会自动计算编号。`

export interface BuildScriptShotsPromptInput {
  episodeTitle: string
  episodeScenes: string
  episodeCharacters: string
  episodeProps: string
  scriptContent: string
  assetCharacters: string
  assetScenes: string
  platform: string
  aspectRatio: string
  stylePreset: string | null
  globalNegPrompt: string | null
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
  const hasAssetCharactersPlaceholder = raw.includes(SCRIPT_SHOTS_ASSET_CHARACTERS_PLACEHOLDER)
  const hasAssetScenesPlaceholder = raw.includes(SCRIPT_SHOTS_ASSET_SCENES_PLACEHOLDER)
  const hasPlatformPlaceholder = raw.includes(SCRIPT_SHOTS_PLATFORM_PLACEHOLDER)
  const hasAspectRatioPlaceholder = raw.includes(SCRIPT_SHOTS_ASPECT_RATIO_PLACEHOLDER)
  const hasStylePresetPlaceholder = raw.includes(SCRIPT_SHOTS_STYLE_PRESET_PLACEHOLDER)
  const hasGlobalNegPromptPlaceholder = raw.includes(SCRIPT_SHOTS_GLOBAL_NEG_PROMPT_PLACEHOLDER)
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
  result = replaceAll(result, SCRIPT_SHOTS_ASSET_CHARACTERS_PLACEHOLDER, input.assetCharacters || "无")
  result = replaceAll(result, SCRIPT_SHOTS_ASSET_SCENES_PLACEHOLDER, input.assetScenes || "无")
  result = replaceAll(result, SCRIPT_SHOTS_PLATFORM_PLACEHOLDER, input.platform)
  result = replaceAll(result, SCRIPT_SHOTS_ASPECT_RATIO_PLACEHOLDER, input.aspectRatio)
  result = replaceAll(result, SCRIPT_SHOTS_STYLE_PRESET_PLACEHOLDER, input.stylePreset || "电影感")
  result = replaceAll(
    result,
    SCRIPT_SHOTS_GLOBAL_NEG_PROMPT_PLACEHOLDER,
    input.globalNegPrompt || "blurry, low quality, distorted"
  )
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
  result = appendIfMissing(
    hasAssetCharactersPlaceholder,
    result,
    `\n## 角色资产（用于画面 Prompt 中的角色设定描述）\n${input.assetCharacters || "无"}`
  )
  result = appendIfMissing(
    hasAssetScenesPlaceholder,
    result,
    `\n## 场景资产（用于画面 Prompt 中的环境描述）\n${input.assetScenes || "无"}`
  )
  result = appendIfMissing(hasPlatformPlaceholder, result, `\n- 目标平台：${input.platform}`)
  result = appendIfMissing(hasAspectRatioPlaceholder, result, `\n- 画幅比例：${input.aspectRatio}`)
  result = appendIfMissing(hasStylePresetPlaceholder, result, `\n- 视觉风格：${input.stylePreset || "电影感"}`)
  result = appendIfMissing(
    hasGlobalNegPromptPlaceholder,
    result,
    `\n- 全局负面提示词：${input.globalNegPrompt || "blurry, low quality, distorted"}`
  )
  result = appendIfMissing(hasPreviousShotPlaceholder, result, previousShotBlock ? `\n${previousShotBlock}` : "")

  return result.trim()
}
