import { getStylePresetDescription } from "@/lib/types"

export function buildImagePrompt(
  content: string | null | undefined,
  refLabels?: string[],
  stylePreset?: string | null
): string {
  let basePrompt = content ? `画面描述：${content}` : ""

  if (stylePreset) {
    const desc = getStylePresetDescription(stylePreset)
    const styleText = `${stylePreset}，${desc}`
    basePrompt = basePrompt ? `${basePrompt}，${styleText}` : styleText
  }

  if (refLabels && refLabels.length > 0) {
    return basePrompt ? `${basePrompt}\n\n参考图说明：${refLabels.join("，")}` : `参考图说明：${refLabels.join("，")}`
  }
  return basePrompt
}

export function buildMultiGridPrompt(
  content: string | null | undefined,
  gridLayout?: string | null,
  refLabels?: string[],
  stylePreset?: string | null
): string {
  const parts: string[] = []

  parts.push(
    `生成一张 ${gridLayout} 的电影分镜脚本，由多个独立的分镜组成，呈网格状排列。保持每张图不重复，保持原图场景和风格不变，并且具有叙事感和连贯性，分镜之间紧挨着、无边框，4k高清画质，无字幕`
  )

  if (stylePreset) {
    const desc = getStylePresetDescription(stylePreset)
    parts.push(`，${stylePreset}，${desc}`)
  }

  if (refLabels && refLabels.length > 0) {
    parts.push(`上传的参考图说明：${refLabels.join("，")}`)
  }

  if (content) {
    parts.push(`分镜内容：${content}`)
  }

  return parts.join("\n\n")
}
