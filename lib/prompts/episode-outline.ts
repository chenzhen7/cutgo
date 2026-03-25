/**
 * 分集大纲生成 — Prompt 模板（与业务解耦，便于后续在设置页/项目级配置中编辑）
 */

/** 模板中小说原文占位符，生成完整 prompt 时会被替换 */
export const EPISODE_OUTLINE_NOVEL_PLACEHOLDER = "{NOVEL_TEXT}" as const

/** 模板中资产列表占位符，生成完整 prompt 时会被替换；若项目无资产则省略该段落 */
export const EPISODE_OUTLINE_ASSETS_PLACEHOLDER = "{ASSETS_LIST}" as const

/**
 * 默认分集大纲生成模板（含占位符 {@link EPISODE_OUTLINE_NOVEL_PLACEHOLDER} 和 {@link EPISODE_OUTLINE_ASSETS_PLACEHOLDER}）
 * 后续可从数据库或用户设置读取后传入 {@link buildEpisodeOutlinePrompt}
 */
export const DEFAULT_EPISODE_OUTLINE_PROMPT_TEMPLATE = `你是一名资深影视编剧 + 短剧工业化制作专家，擅长将我提供的小说内容改编为适合短视频平台的连续短剧内容，并能够适配 AI 自动化生产流程。

请根据我提供的【小说原文】，并结合以下参数配置，完成短剧改编与剧本生成。

## 一、基础参数（必须严格遵守）

* 每集时长：3分钟

---

## 二、分集拆解

请将我提供的小说原文多个章节进行拆分为若干集短剧，每一集必须包含：

* 集数
* 标题（由悬念或情节构成的强吸引力标题）
* 黄金钩子（本集开头的核心吸睛剧情，吸引观众留存）
* 核心冲突（本集剧情发展的矛盾核心点）
* 本集详细大纲（主要故事情节）
* 结尾悬念（也就是"钩子点"，提供观众看下一集的强力理由）

 ### 分集策略要求：

* 剧情均匀推进，避免前期拖沓或后期压缩
* 每集必须包含至少一个情绪高点或核心冲突点

---

${EPISODE_OUTLINE_ASSETS_PLACEHOLDER}

---

 ## 输出格式
  /** 字段说明：title 为集标题；goldenHook 为黄金钩子；core_conflict 为核心冲突；summary 为详细大纲；cliffhanger 为结尾悬念；chapters 为关联章节编号；characters 为本集出场的角色名称列表（从资产列表中选取）；scenes 为本集涉及的场景名称列表（从资产列表中选取）；props 为本集涉及的道具名称列表（从资产列表中选取）。 */

[
  {
    "episode": 1,
    "title": "",
    "goldenHook": "",
    "core_conflict": "",
    "summary": "",
    "cliffhanger": "",
    "chapters": [3,4,5],
    "characters": ["角色A", "角色B"],
    "scenes": ["场景A"],
    "props": ["道具A"]
  }
]
---
严格按照上述 JSON 格式输出，不要包含任何额外说明、注释或 markdown 代码块标记，直接输出 JSON 数组。

【小说原文】：
${EPISODE_OUTLINE_NOVEL_PLACEHOLDER}

`

export interface AssetItem {
  id: string
  name: string
}

export interface AssetsSummary {
  characters: AssetItem[]
  scenes: AssetItem[]
  props: AssetItem[]
}

export interface BuildEpisodeOutlinePromptOptions {
  /** 自定义模板；须包含占位符 {@link EPISODE_OUTLINE_NOVEL_PLACEHOLDER}，否则将追加在末尾 */
  template?: string
  /** 项目资产列表；有值时注入到 prompt，引导 AI 关联每集所用资产 */
  assets?: AssetsSummary
}

/**
 * 将资产列表序列化为 prompt 中的资产说明段落。
 * prompt 中给 AI 看的是名称，服务端持久化时再将名称映射回 ID。
 * 当项目无任何资产时返回空字符串（该段落将被省略）。
 */
function buildAssetsSection(assets: AssetsSummary): string {
  const hasAny =
    assets.characters.length > 0 || assets.scenes.length > 0 || assets.props.length > 0
  if (!hasAny) return ""

  const lines: string[] = [
    "## 三、资产关联（必须严格遵守）",
    "",
    "项目已提取以下资产，请在每集大纲中根据剧情内容，从下列资产名称中选取本集实际出现的资产，并填入输出 JSON 对应字段中。",
    "**只能使用下列资产名称，不得自行编造新名称。**",
    "",
  ]

  if (assets.characters.length > 0) {
    lines.push(`**角色（characters）**：${assets.characters.map((a) => a.name).join("、")}`)
  }
  if (assets.scenes.length > 0) {
    lines.push(`**场景（scenes）**：${assets.scenes.map((a) => a.name).join("、")}`)
  }
  if (assets.props.length > 0) {
    lines.push(`**道具（props）**：${assets.props.map((a) => a.name).join("、")}`)
  }

  return lines.join("\n")
}

/**
 * 将所选章节合并后的原文注入模板，得到发给 LLM 的完整 user prompt。
 */
export function buildEpisodeOutlinePrompt(
  novelText: string,
  options?: BuildEpisodeOutlinePromptOptions
): string {
  const raw = options?.template?.trim() ? options.template : DEFAULT_EPISODE_OUTLINE_PROMPT_TEMPLATE

  const assetsSection = options?.assets ? buildAssetsSection(options.assets) : ""

  let result = raw

  // 替换资产列表占位符
  if (result.includes(EPISODE_OUTLINE_ASSETS_PLACEHOLDER)) {
    result = result.split(EPISODE_OUTLINE_ASSETS_PLACEHOLDER).join(assetsSection)
  }

  // 替换小说原文占位符
  if (result.includes(EPISODE_OUTLINE_NOVEL_PLACEHOLDER)) {
    return result.split(EPISODE_OUTLINE_NOVEL_PLACEHOLDER).join(novelText)
  }

  // 兼容未来用户误删占位符：在末尾追加原文块
  return `${result}\n\n【小说原文】：\n${novelText}`
}
