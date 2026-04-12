/**
 * 资产生图 — Prompt 模板（与 API 解耦，便于统一维护与后续配置化）
 */

/** 角色/场景/道具首帧模板共用占位符（注入资产自身的描述或名称） */
export const ASSET_IMAGE_PROMPT_PLACEHOLDER = "{ASSET_PROMPT}" as const

/** @deprecated 请使用 {@link ASSET_IMAGE_PROMPT_PLACEHOLDER} */
export const ASSET_CHARACTER_IMAGE_PROMPT_PLACEHOLDER = ASSET_IMAGE_PROMPT_PLACEHOLDER

function injectAssetImagePrompt(
  assetPrompt: string,
  defaultTemplate: string,
  options: { template?: string } | undefined,
  fallbackHeading: string
): string {
  const trimmed = assetPrompt.trim()
  const raw = options?.template?.trim() ? options.template : defaultTemplate
  if (raw.includes(ASSET_IMAGE_PROMPT_PLACEHOLDER)) {
    return raw.split(ASSET_IMAGE_PROMPT_PLACEHOLDER).join(trimmed)
  }
  return `${raw}\n\n${fallbackHeading}\n${trimmed}`
}

/**
 * 角色资产「首帧」生图默认模板（在资产自身的 prompt/名称 外包一层，约束构图与用途）
 */
export const DEFAULT_ASSET_CHARACTER_IMAGE_PROMPT_TEMPLATE = `
一张全身、单人、正面朝向镜头**的角色立绘参考图（自然站立或轻度 A 字站姿），${ASSET_IMAGE_PROMPT_PLACEHOLDER}
纯色或浅灰干净背景，无复杂场景与多余道具，无文字、水印、Logo;全身入镜、构图居中，比例与解剖合理，面部与服装细节清晰可辨,柔和均匀的工作室光，阴影干净`

export interface BuildAssetCharacterImagePromptOptions {
  /** 自定义模板；建议保留 {ASSET_PROMPT} 占位符以便注入资产描述 */
  template?: string
}

/**
 * 组装角色资产首帧生图完整 prompt（不含项目风格 preset，风格由路由层追加）
 */
export function buildAssetCharacterImagePrompt(
  assetPrompt: string,
  options?: BuildAssetCharacterImagePromptOptions
): string {
  return injectAssetImagePrompt(
    assetPrompt,
    DEFAULT_ASSET_CHARACTER_IMAGE_PROMPT_TEMPLATE,
    options,
    "## 角色设定"
  )
}

/**
 * 场景资产生图默认模板（环境/空间参考，便于分镜与布景一致）
 */
export const DEFAULT_ASSET_SCENE_IMAGE_PROMPT_TEMPLATE = `
请根据下列场景设定生成**一张环境/空间参考图**，作为该剧集中该地点的视觉基准。
${ASSET_IMAGE_PROMPT_PLACEHOLDER};无文字、水印、Logo；画面干净，适合作为后续分镜与合成的背景参考,禁止出现人物,不要出现文字
`

export interface BuildAssetSceneImagePromptOptions {
  /** 自定义模板；建议保留 {ASSET_PROMPT} 占位符 */
  template?: string
}

/**
 * 组装场景资产生图完整 prompt（不含项目风格 preset）
 */
export function buildAssetSceneImagePrompt(
  assetPrompt: string,
  options?: BuildAssetSceneImagePromptOptions
): string {
  return injectAssetImagePrompt(
    assetPrompt,
    DEFAULT_ASSET_SCENE_IMAGE_PROMPT_TEMPLATE,
    options,
    "## 场景设定"
  )
}

/**
 * 道具资产生图默认模板（单品参考，类似产品摄影）
 */
export const DEFAULT_ASSET_PROP_IMAGE_PROMPT_TEMPLATE = `
请根据下列道具设定生成**一张单品道具参考图**，物体清晰完整，适合作为建模或合成引用。
${ASSET_IMAGE_PROMPT_PLACEHOLDER};道具为主体、居中构图，纯色或浅灰简洁背景无杂乱环境抢镜，材质、颜色与关键细节清晰；柔和工作室光，阴影干净，无文字、水印、Logo；单件道具，不要拼图或多件无关物体，禁止出现人物,不要出现文字
`

export interface BuildAssetPropImagePromptOptions {
  /** 自定义模板；建议保留 {ASSET_PROMPT} 占位符 */
  template?: string
}

/**
 * 组装道具资产生图完整 prompt（不含项目风格 preset）
 */
export function buildAssetPropImagePrompt(
  assetPrompt: string,
  options?: BuildAssetPropImagePromptOptions
): string {
  return injectAssetImagePrompt(
    assetPrompt,
    DEFAULT_ASSET_PROP_IMAGE_PROMPT_TEMPLATE,
    options,
    "## 道具设定"
  )
}

/**
 * 角色三视图/参考表 — 基于首帧图做二次生图时的提示词（英文便于模型理解版面约束）
 */
export const ASSET_CHARACTER_TURNAROUND_IMAGE_PROMPT =
  "Create a high-fidelity character reference sheet using only the uploaded reference image. Preserve identity, proportions, and features exactly. Use a clean, neutral background and present the result as a technical model turnaround matching the reference's realism, rendering style, textures, color treatment, and lighting. Layout Two horizontal rows with even spacing. Top: Full-body views-front, left profile (facing left), right profile (facing right), back. Bottom: Facial close-ups-front, left profile, right profile. Requirements Perfect identity consistency. Relaxed neutral A-pose. Consistent scale, alignment, head height, and framing. Accurate anatomy and clean silhouette. Identical lighting across all panels with natural shadows. Sharp, print-ready finish."
