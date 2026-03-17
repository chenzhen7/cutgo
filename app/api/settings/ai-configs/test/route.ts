import { NextResponse } from "next/server"

/**
 * POST /api/settings/ai-configs/test
 * 测试模型配置是否可用（发送一条最小化请求验证 API Key 和 Base URL）
 *
 * Body: { type, provider, model, apiKey, baseUrl }
 */
export async function POST(req: Request) {
  try {
    const { type, provider, model, apiKey, baseUrl } = await req.json()

    if (!type || !provider || !model) {
      return NextResponse.json(
        { error: "type、provider、model 为必填项" },
        { status: 400 }
      )
    }

    if (type === "llm") {
      return await testLLM({ provider, model, apiKey, baseUrl })
    }

    if (type === "image") {
      return await testImage({ provider, model, apiKey, baseUrl })
    }

    if (type === "tts") {
      return await testTTS({ provider, model, apiKey, baseUrl })
    }

    // video 等暂不支持在线测试
    return NextResponse.json({
      success: true,
      message: "该类型暂不支持在线测试，配置已保存",
    })
  } catch (error) {
    console.error("[ai-configs/test POST]", error)
    return NextResponse.json({ error: "测试请求失败" }, { status: 500 })
  }
}

/** 测试 LLM（OpenAI 兼容接口）连通性 */
async function testLLM({
  provider,
  model,
  apiKey,
  baseUrl,
}: {
  provider: string
  model: string
  apiKey: string
  baseUrl: string
}) {
  const resolvedBaseUrl = baseUrl || defaultBaseUrl(provider)
  if (!resolvedBaseUrl) {
    return NextResponse.json({ error: "缺少 Base URL" }, { status: 400 })
  }
  if (!apiKey) {
    return NextResponse.json({ error: "缺少 API Key" }, { status: 400 })
  }

  const endpoint = `${resolvedBaseUrl.replace(/\/$/, "")}/chat/completions`

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: "hi" }],
      max_tokens: 1,
    }),
    signal: AbortSignal.timeout(10_000),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    return NextResponse.json(
      { error: `API 返回错误 ${res.status}: ${text.slice(0, 200)}` },
      { status: 400 }
    )
  }

  return NextResponse.json({ success: true, message: "连接成功" })
}

/** 测试图像生成接口连通性（仅验证 API Key 有效性） */
async function testImage({
  provider,
  apiKey,
  baseUrl,
}: {
  provider: string
  model: string
  apiKey: string
  baseUrl: string
}) {
  if (provider === "comfyui") {
    const url = baseUrl || "http://127.0.0.1:8188"
    const res = await fetch(`${url.replace(/\/$/, "")}/system_stats`, {
      signal: AbortSignal.timeout(5_000),
    }).catch(() => null)

    if (!res?.ok) {
      return NextResponse.json(
        { error: "无法连接到 ComfyUI 服务，请确认地址和服务状态" },
        { status: 400 }
      )
    }
    return NextResponse.json({ success: true, message: "ComfyUI 连接成功" })
  }

  // OpenAI / 其他兼容接口：尝试获取模型列表
  const resolvedBaseUrl = baseUrl || defaultBaseUrl(provider)
  if (!resolvedBaseUrl || !apiKey) {
    return NextResponse.json({ error: "缺少 API Key 或 Base URL" }, { status: 400 })
  }

  const res = await fetch(`${resolvedBaseUrl.replace(/\/$/, "")}/models`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(8_000),
  })

  if (!res.ok) {
    return NextResponse.json(
      { error: `API Key 验证失败 (${res.status})` },
      { status: 400 }
    )
  }

  return NextResponse.json({ success: true, message: "连接成功" })
}

/** 测试 TTS 接口连通性 */
async function testTTS({
  provider,
  apiKey,
  baseUrl,
}: {
  provider: string
  model: string
  apiKey: string
  baseUrl: string
}) {
  if (provider === "edge-tts") {
    return NextResponse.json({ success: true, message: "Edge TTS 无需 API Key，可直接使用" })
  }

  const resolvedBaseUrl = baseUrl || defaultBaseUrl(provider)
  if (!resolvedBaseUrl || !apiKey) {
    return NextResponse.json({ error: "缺少 API Key 或 Base URL" }, { status: 400 })
  }

  const res = await fetch(`${resolvedBaseUrl.replace(/\/$/, "")}/models`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(8_000),
  })

  if (!res.ok) {
    return NextResponse.json(
      { error: `API Key 验证失败 (${res.status})` },
      { status: 400 }
    )
  }

  return NextResponse.json({ success: true, message: "连接成功" })
}

function defaultBaseUrl(provider: string): string {
  switch (provider) {
    case "openai":
      return "https://api.openai.com/v1"
    case "anthropic":
      return "https://api.anthropic.com/v1"
    case "deepseek":
      return "https://api.deepseek.com/v1"
    case "qwen":
      return "https://dashscope.aliyuncs.com/compatible-mode/v1"
    case "minimax":
      return "https://api.minimax.chat/v1"
    case "elevenlabs":
      return "https://api.elevenlabs.io/v1"
    default:
      return ""
  }
}
