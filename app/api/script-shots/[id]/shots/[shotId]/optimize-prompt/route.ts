import { NextRequest, NextResponse } from "next/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; shotId: string }> }
) {
  await params
  const { currentPrompt, style, emphasis } = await request.json()

  const apiKey = process.env.OPENAI_API_KEY
  const baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini"

  if (!apiKey) {
    return NextResponse.json({
      optimizedPrompt: currentPrompt + ", high quality, masterpiece, best quality, cinematic lighting, detailed",
      negativePrompt: "blurry, low quality, distorted face, extra limbs, watermark, text",
    })
  }

  const prompt = `你是一位 AI 图像生成 Prompt 专家。请优化以下分镜提示词 Prompt，使其更适合 AI 图像生成模型（如 Stable Diffusion、Midjourney）。

当前 Prompt：
${currentPrompt}

${style ? `视觉风格偏好：${style}` : ""}
${emphasis ? `重点强调：${emphasis}` : ""}

要求：
1. 保持原始分镜内容不变
2. 添加更多细节描述（光影、氛围、材质、色调）
3. 优化关键词顺序和权重
4. 生成合适的负面提示词
5. 保持英文输出

请严格按以下 JSON 格式输出：
{
  "optimizedPrompt": "优化后的英文 Prompt",
  "negativePrompt": "英文负面提示词"
}`

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    })

    if (!response.ok) {
      return NextResponse.json({
        optimizedPrompt: currentPrompt + ", high quality, masterpiece, cinematic lighting",
        negativePrompt: "blurry, low quality, distorted face, extra limbs, watermark",
      })
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) {
      return NextResponse.json({
        optimizedPrompt: currentPrompt,
        negativePrompt: "blurry, low quality, distorted",
      })
    }

    const parsed = JSON.parse(content)
    return NextResponse.json({
      optimizedPrompt: parsed.optimizedPrompt || currentPrompt,
      negativePrompt: parsed.negativePrompt || "blurry, low quality",
    })
  } catch {
    return NextResponse.json({
      optimizedPrompt: currentPrompt + ", high quality, masterpiece",
      negativePrompt: "blurry, low quality, distorted face",
    })
  }
}
