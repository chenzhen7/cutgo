/**
 * 分集大纲生成 — Prompt 模板（与业务解耦，便于后续在设置页/项目级配置中编辑）
 */

/** 模板中小说原文占位符，生成完整 prompt 时会被替换 */
export const EPISODE_OUTLINE_NOVEL_PLACEHOLDER = "{NOVEL_TEXT}" as const

/**
 * 默认分集大纲生成模板（含占位符 {@link EPISODE_OUTLINE_NOVEL_PLACEHOLDER}）
 * 后续可从数据库或用户设置读取后传入 {@link buildEpisodeOutlinePrompt}
 */
export const DEFAULT_EPISODE_OUTLINE_PROMPT_TEMPLATE = `你是一名资深影视编剧 + 短剧工业化制作专家，擅长将小说内容改编为适合短视频平台的连续短剧内容，并能够适配 AI 自动化生产流程。

请根据我提供的【小说原文】，并结合以下参数配置，完成短剧改编与剧本生成。

## 一、基础参数（必须严格遵守）

* 每集时长：3分钟

---

## 二、分集拆解

请将小说改编为若干集短剧，每一集必须包含：

* 集数
* 标题（强吸引力 / 悬念 / 反转）
* 本集核心剧情（≤100字）
* 本集钩子点（必须有明确"继续观看理由"）

 ### 分集策略要求：

* 剧情均匀推进，避免前期拖沓或后期压缩
* 每集必须包含冲突或情绪变化


---

 ## 六、输出格式
[
  {
  	"episode":1,
    //标题
    "title":"",
    //大纲内容
    "summary": "",
    //核心冲突（可为空）
    "core_conflict": "",
    //黄金钩子（可为空）
    "hook": "",
    //结尾悬念（可为空）
    "cliffhanger": "",
    //关联章节序号（数字数组，对应小说章节序号）
    "chapters":[]
  }
]    

【小说原文】：
${EPISODE_OUTLINE_NOVEL_PLACEHOLDER}

---
严格按照上述 JSON 格式输出，不要包含任何额外说明、注释或 markdown 代码块标记，直接输出 JSON 数组。`

export interface BuildEpisodeOutlinePromptOptions {
  /** 自定义模板；须包含占位符 {@link EPISODE_OUTLINE_NOVEL_PLACEHOLDER}，否则将追加在末尾 */
  template?: string
}

/**
 * 将所选章节合并后的原文注入模板，得到发给 LLM 的完整 user prompt。
 */
export function buildEpisodeOutlinePrompt(
  novelText: string,
  options?: BuildEpisodeOutlinePromptOptions
): string {
  const raw = options?.template?.trim()
    ? options.template
    : DEFAULT_EPISODE_OUTLINE_PROMPT_TEMPLATE

  if (raw.includes(EPISODE_OUTLINE_NOVEL_PLACEHOLDER)) {
    return raw.split(EPISODE_OUTLINE_NOVEL_PLACEHOLDER).join(novelText)
  }

  // 兼容未来用户误删占位符：在末尾追加原文块
  return `${raw}\n\n【小说原文】：\n${novelText}`
}
