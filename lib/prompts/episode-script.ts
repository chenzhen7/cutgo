/**
 * 分集剧本生成 — Prompt 模板（与业务解耦，便于后续在设置页/项目级配置中编辑）
 */

export const EPISODE_SCRIPT_TITLE_PLACEHOLDER = "{EPISODE_TITLE}" as const
export const EPISODE_SCRIPT_OUTLINE_PLACEHOLDER = "{EPISODE_OUTLINE}" as const
export const EPISODE_SCRIPT_KEY_CONFLICT_PLACEHOLDER = "{KEY_CONFLICT}" as const
export const EPISODE_SCRIPT_CLIFFHANGER_PLACEHOLDER = "{CLIFFHANGER}" as const
export const EPISODE_SCRIPT_CHAPTER_CONTENT_PLACEHOLDER = "{CHAPTER_CONTENT}" as const
export const EPISODE_SCRIPT_CHARACTERS_PLACEHOLDER = "{CHARACTERS}" as const
export const EPISODE_SCRIPT_SCENES_INFO_PLACEHOLDER = "{SCENES_INFO}" as const
export const EPISODE_SCRIPT_PROPS_INFO_PLACEHOLDER = "{PROPS_INFO}" as const
export const EPISODE_SCRIPT_PREVIOUS_CONTENT_PLACEHOLDER = "{PREVIOUS_CONTENT}" as const
export const EPISODE_SCRIPT_PROJECT_DURATION_PLACEHOLDER = "{PROJECT_DURATION}" as const

export const DEFAULT_EPISODE_SCRIPT_PROMPT_TEMPLATE = `你是一位资深短剧编剧，擅长将分集梗概转化为高质量的竖屏短剧剧本。

## 任务
请基于以下分集信息，生成该集的完整剧本文本。

## 当前分集信息
- 集标题：${EPISODE_SCRIPT_TITLE_PLACEHOLDER}
- 剧情摘要：${EPISODE_SCRIPT_OUTLINE_PLACEHOLDER}
- 核心冲突：${EPISODE_SCRIPT_KEY_CONFLICT_PLACEHOLDER}
- 结尾钩子：${EPISODE_SCRIPT_CLIFFHANGER_PLACEHOLDER}

## 来源章节原文（供参考，提取对白和描写素材）
${EPISODE_SCRIPT_CHAPTER_CONTENT_PLACEHOLDER}

## 全局上下文
- 角色列表（含性格描述）：${EPISODE_SCRIPT_CHARACTERS_PLACEHOLDER}
- 场景库（可选地点）：${EPISODE_SCRIPT_SCENES_INFO_PLACEHOLDER}
- 道具库：${EPISODE_SCRIPT_PROPS_INFO_PLACEHOLDER}
${EPISODE_SCRIPT_PREVIOUS_CONTENT_PLACEHOLDER}

## 目标参数
- 每集时长：${EPISODE_SCRIPT_PROJECT_DURATION_PLACEHOLDER}

## 要求
1. 生成完整的剧本文本，包含对白、旁白、动作描写和转场指示
2. 使用标准剧本格式：
   - 场景标题用【场景N：标题】标记
   - 对白格式：角色名（情绪/动作指示）："台词内容"
   - 旁白格式：（旁白）内容
   - 动作描写格式：[动作描写内容]
   - 转场格式：——转场描述——
3. 对白要求：
   - 符合角色性格和身份
   - 口语化、自然，避免书面语
   - 有情感张力，推动冲突
   - 每句台词控制在 15 字以内（适合字幕展示）
4. 旁白要求：简洁有力，每句不超过 20 字
5. 动作描写要有画面感，便于后续分镜设计
6. 结尾场景必须体现 cliffhanger，制造悬念
7. 所有场景的内容之和应覆盖目标时长

## 输出格式
直接输出剧本纯文本，不要包含 JSON 或 markdown 代码块。`

export interface BuildEpisodeScriptPromptInput {
  episodeTitle: string
  episodeSynopsis: string
  keyConflict?: string | null
  cliffhanger?: string | null
  chapterContent: string
  novelSynopsis?: string | null
  characters?: string
  previousContent?: string | null
  duration: string
  scenesInfo?: string
  propsInfo?: string
}

export interface BuildEpisodeScriptPromptOptions {
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

export function buildEpisodeScriptPrompt(
  input: BuildEpisodeScriptPromptInput,
  options?: BuildEpisodeScriptPromptOptions
): string {
  const raw = options?.template?.trim()
    ? options.template
    : DEFAULT_EPISODE_SCRIPT_PROMPT_TEMPLATE

  const hasTitlePlaceholder = raw.includes(EPISODE_SCRIPT_TITLE_PLACEHOLDER)
  const hasOutlinePlaceholder = raw.includes(EPISODE_SCRIPT_OUTLINE_PLACEHOLDER)
  const hasKeyConflictPlaceholder = raw.includes(EPISODE_SCRIPT_KEY_CONFLICT_PLACEHOLDER)
  const hasCliffhangerPlaceholder = raw.includes(EPISODE_SCRIPT_CLIFFHANGER_PLACEHOLDER)
  const hasChapterContentPlaceholder = raw.includes(EPISODE_SCRIPT_CHAPTER_CONTENT_PLACEHOLDER)
  const hasCharactersPlaceholder = raw.includes(EPISODE_SCRIPT_CHARACTERS_PLACEHOLDER)
  const hasScenesInfoPlaceholder = raw.includes(EPISODE_SCRIPT_SCENES_INFO_PLACEHOLDER)
  const hasPropsInfoPlaceholder = raw.includes(EPISODE_SCRIPT_PROPS_INFO_PLACEHOLDER)
  const hasPreviousContentPlaceholder = raw.includes(EPISODE_SCRIPT_PREVIOUS_CONTENT_PLACEHOLDER)
  const hasProjectDurationPlaceholder = raw.includes(EPISODE_SCRIPT_PROJECT_DURATION_PLACEHOLDER)

  const previousContentBlock = input.previousContent?.trim()
    ? `- 前一集剧本末尾：\n${input.previousContent.trim()}`
    : ""

  let result = raw
  result = replaceAll(result, EPISODE_SCRIPT_TITLE_PLACEHOLDER, input.episodeTitle)
  result = replaceAll(result, EPISODE_SCRIPT_OUTLINE_PLACEHOLDER, input.episodeSynopsis)
  result = replaceAll(result, EPISODE_SCRIPT_KEY_CONFLICT_PLACEHOLDER, input.keyConflict || "无")
  result = replaceAll(result, EPISODE_SCRIPT_CLIFFHANGER_PLACEHOLDER, input.cliffhanger || "无")
  result = replaceAll(result, EPISODE_SCRIPT_CHAPTER_CONTENT_PLACEHOLDER, input.chapterContent)
  result = replaceAll(result, EPISODE_SCRIPT_CHARACTERS_PLACEHOLDER, input.characters || "无")
  result = replaceAll(result, EPISODE_SCRIPT_SCENES_INFO_PLACEHOLDER, input.scenesInfo || "无")
  result = replaceAll(result, EPISODE_SCRIPT_PROPS_INFO_PLACEHOLDER, input.propsInfo || "无")
  result = replaceAll(result, EPISODE_SCRIPT_PREVIOUS_CONTENT_PLACEHOLDER, previousContentBlock)
  result = replaceAll(result, EPISODE_SCRIPT_PROJECT_DURATION_PLACEHOLDER, input.duration)

  result = appendIfMissing(hasTitlePlaceholder, result, `\n- 集标题：${input.episodeTitle}`)
  result = appendIfMissing(hasOutlinePlaceholder, result, `\n- 剧情摘要：${input.episodeSynopsis}`)
  result = appendIfMissing(hasKeyConflictPlaceholder, result, `\n- 核心冲突：${input.keyConflict || "无"}`)
  result = appendIfMissing(hasCliffhangerPlaceholder, result, `\n- 结尾钩子：${input.cliffhanger || "无"}`)
  result = appendIfMissing(hasChapterContentPlaceholder, result, `\n## 来源章节原文\n${input.chapterContent}`)
  result = appendIfMissing(hasCharactersPlaceholder, result, `\n- 角色列表：${input.characters || "无"}`)
  result = appendIfMissing(hasScenesInfoPlaceholder, result, `\n- 场景库：${input.scenesInfo || "无"}`)
  result = appendIfMissing(hasPropsInfoPlaceholder, result, `\n- 道具库：${input.propsInfo || "无"}`)
  result = appendIfMissing(hasPreviousContentPlaceholder, result, previousContentBlock ? `\n${previousContentBlock}` : "")
  result = appendIfMissing(hasProjectDurationPlaceholder, result, `\n- 每集时长：${input.duration}`)

  return result.trim()
}
