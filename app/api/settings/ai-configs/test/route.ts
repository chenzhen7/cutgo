import { NextRequest, NextResponse } from "next/server"
import { getProviderDefaultBaseUrl } from "@/lib/ai/providers"
import { createLLMProviderFromConfig } from "@/lib/ai/llm"
import { createImageProviderFromConfig } from "@/lib/ai/image"
import { throwCutGoError, withError } from "@/lib/api-error"

/**
 * POST /api/settings/ai-configs/test
 * 测试模型配置是否可用（发送一条最小化请求验证 API Key 和 Base URL）
 *
 * Body: { type, provider, model, apiKey, baseUrl }
 */
export const POST = withError(async (req: NextRequest) => {
  const { type, provider, model, apiKey, baseUrl } = await req.json()

  if (!type || !provider || !model) {
    throwCutGoError("MISSING_PARAMS", "type、provider、model 为必填项")
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
})

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
  const resolvedBaseUrl = baseUrl || getProviderDefaultBaseUrl(provider)

  if (!resolvedBaseUrl) {
    throwCutGoError("MISSING_PARAMS", "缺少 Base URL")
  }
  if (!apiKey) {
    throwCutGoError("MISSING_PARAMS", "缺少 API Key")
  }

  const llmProvider = createLLMProviderFromConfig({
    provider,
    model,
    apiKey,
    baseUrl: resolvedBaseUrl,
  })

  if (!llmProvider) {
    throwCutGoError("VALIDATION", `当前暂不支持该 LLM Provider 的在线测试：${provider}`)
  }
  
  console.log("[ai-configs/test][llm] resolvedBaseUrl:", resolvedBaseUrl, "| model:", model , "llmProvider:", llmProvider.id)

  try {
    await Promise.race([
      llmProvider.chat({
        model,
        messages: [{ role: "user", content: "hi" }],
        maxTokens: 10,
        timeoutMs: 1000 * 20
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject("timeout"), 300_000)
      ),
    ])

    return NextResponse.json({ success: true, message: "连接成功" })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (message === "timeout") {
      throwCutGoError("VALIDATION", "连接超时，请检查网络或 Base URL")
    }

    throwCutGoError("VALIDATION", `API 调用失败: ${message.slice(0, 200)}`)
  }
}

/** 测试图像生成接口连通性（仅验证 API Key 有效性） */
async function testImage({
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

  if (provider === "comfyui") {
    const url = baseUrl || "http://127.0.0.1:8188"
    const res = await fetch(`${url.replace(/\/$/, "")}/system_stats`, {
      signal: AbortSignal.timeout(5_000),
    }).catch(() => null)

    if (!res?.ok) {
      throwCutGoError("VALIDATION", "无法连接到 ComfyUI 服务，请确认地址和服务状态")
    }
    return NextResponse.json({ success: true, message: "ComfyUI 连接成功" })
  }

  const resolvedBaseUrl = baseUrl || getProviderDefaultBaseUrl(provider)
  if (!resolvedBaseUrl) {
    throwCutGoError("MISSING_PARAMS", "缺少 Base URL")
  }
  if (!apiKey) {
    throwCutGoError("MISSING_PARAMS", "缺少 API Key")
  }

  const imageProvider = createImageProviderFromConfig({
    provider,
    model,
    apiKey,
    baseUrl: resolvedBaseUrl,
  })

  if (!imageProvider) {
    throwCutGoError("VALIDATION", `当前暂不支持该图片 Provider 的在线测试：${provider}`)
  }

  console.log("[ai-configs/test][image] resolvedBaseUrl:", resolvedBaseUrl, "| model:", model, "imageProvider:", imageProvider.id)

  try {
    const result = await Promise.race([
      imageProvider.generate({
        prompt: "test image",
        width: 512,
        height: 512,
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject("timeout"), 300_000)
      ),
    ])

    const first = Array.isArray(result) ? result[0] : result
    if (!first?.url) {
      throwCutGoError("VALIDATION", "图片生成成功但未返回有效结果")
    }

    return NextResponse.json({ success: true, message: "连接成功" })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (message === "timeout") {
      throwCutGoError("VALIDATION", "连接超时，请检查网络或 Base URL")
    }

    throwCutGoError("VALIDATION", `API 调用失败: ${message.slice(0, 200)}`)
  }
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

  const resolvedBaseUrl = baseUrl || getProviderDefaultBaseUrl(provider)
  if (!resolvedBaseUrl || !apiKey) {
    throwCutGoError("MISSING_PARAMS", "缺少 API Key 或 Base URL")
  }

  const res = await fetch(`${resolvedBaseUrl.replace(/\/$/, "")}/models`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(8_000),
  })

  if (!res.ok) {
    throwCutGoError("VALIDATION", `API Key 验证失败 (${res.status})`)
  }

  return NextResponse.json({ success: true, message: "连接成功" })
}

