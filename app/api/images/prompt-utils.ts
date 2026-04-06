export function buildImagePrompt(
  imageType: string,
  content: string | null | undefined,
  prompt: string | null | undefined,
  refLabels?: string[]
): string {
  let basePrompt: string;

  if (imageType === "multi_grid") {
    basePrompt = content ? `分镜描述：${content}` : "";
  } else if (content) {
    basePrompt = `分镜描述：${content}\n画面提示词：${prompt ?? ""}`;
  } else {
    basePrompt = prompt ?? "";
  }
  if (refLabels && refLabels.length > 0) {
    return `${basePrompt}\n\n参考图说明：${refLabels.join("，")}`
  }
  return basePrompt
}

export function buildMultiGridPrompt(
  basePrompt: string,
  gridPrompts: string[],
  gridLayout?: string | null
): string {
  const promptObj: Record<string, string> = {}
  gridPrompts.forEach((p, i) => {
    promptObj[String(i + 1)] = p
  })

  const jsonBlock = JSON.stringify(promptObj, null, 2)
  const layoutText = gridLayout ? `宫格布局：${gridLayout}\n` : ""

  return `${basePrompt}\n\n保持原图场景和风格不变，拍摄一套多宫格布局的分镜摄影图。保持每张图不重复，并且具有叙事感和连贯性，分镜之间紧挨着、无边框，4k高清画质${layoutText}\n\n以下 JSON 中数字键 "1"、"2"… 依次对应各子画面（建议从左到右、从上到下）：\n\n${jsonBlock}`
}
