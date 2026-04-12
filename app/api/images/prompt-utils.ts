export function buildImagePrompt(
  content: string | null | undefined,
  prompt: string | null | undefined,
  refLabels?: string[],
  stylePreset?: string | null
): string {
  let basePrompt: string;

  if (content) {
    basePrompt = `分镜描述：${content}\n画面提示词：${prompt ?? ""}`;
  } else {
    basePrompt = prompt ?? "";
  }
  
  if (stylePreset) {
    basePrompt = basePrompt ? `${basePrompt}\n视觉风格：${stylePreset}` : `视觉风格：${stylePreset}`;
  }

  if (refLabels && refLabels.length > 0) {
    return basePrompt ? `${basePrompt}\n\n参考图说明：${refLabels.join("，")}` : `参考图说明：${refLabels.join("，")}`
  }
  return basePrompt
}

export function buildMultiGridPrompt(
  content: string | null | undefined,
  gridPrompts: string[],
  gridLayout?: string | null,
  refLabels?: string[],
  stylePreset?: string | null
): string {
  const promptObj: Record<string, string> = {}

  gridPrompts.forEach((p, i) => {
    promptObj[String(i + 1)] = p
  })

  const jsonBlock = JSON.stringify(promptObj, null, 2)
  const gridSum = gridPrompts.length

  const parts: string[] = []

  // 1. 要求放在最上面
  parts.push(`生成一张 ${gridLayout} 的电影分镜脚本,由 ${gridSum} 个独立的分镜组成,呈网格状排列。保持每张图不重复,保持原图场景和风格不变,并且具有叙事感和连贯性，分镜之间紧挨着、无边框，4k高清画质`)

  // 2. 参考图说明
  if (refLabels && refLabels.length > 0) {
    parts.push(`上传的参考图说明：${refLabels.join("，")}`)
  }

  // 3. 画面描述
  if (content) {
    parts.push(`画面描述了：${content}`)
  }

  // 4. 视觉风格
  if (stylePreset) {
    parts.push(`视觉风格：${stylePreset}`)
  }

  // 5. 多宫格json
  parts.push(`以下 JSON 按序号顺序依次对应各个格子（建议从左到右、从上到下）：\n${jsonBlock}`)

  return parts.join("\n\n")
}
