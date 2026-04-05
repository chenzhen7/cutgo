import { NextRequest, NextResponse } from "next/server"
import { getProviderDefaultBaseUrl } from "@/lib/ai/providers"
import { createLLMProviderFromConfig, callLLM } from "@/lib/ai/llm"
import { createImageProviderFromConfig } from "@/lib/ai/image"
import { createVideoProviderFromConfig } from "@/lib/ai/video"
import { throwCutGoError, withError } from "@/lib/api-error"

const TEST_TIMEOUT_MS = 300_000

function withTimeout<T>(promise: Promise<T>, timeoutMs = TEST_TIMEOUT_MS): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error("timeout")), timeoutMs)
    }),
  ])
}

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
    return await testTTS({ provider, apiKey, baseUrl })
  }

  if (type === "video") {
    return await testVideo({ provider, model, apiKey, baseUrl })
  }

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

  console.log("[ai-configs/test][llm] resolvedBaseUrl:", resolvedBaseUrl, "| model:", model, "llmProvider:", llmProvider.id)

  try {
    await withTimeout(
      callLLM({
        model,
        messages: [{ role: "user", content: "hi" }],
        maxTokens: 10,
        timeoutMs: 1000 * 20,
      }, llmProvider)
    )

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
    const result = await withTimeout(
      imageProvider.generate({
        prompt: "apple",
        projectId: "test",
        scope: "asset",
        width: 512,
        height: 512,
      })
    )

    const first = Array.isArray(result) ? result[0] : result
    if (!first?.url) {
      throwCutGoError("VALIDATION", "图片生成成功但未返回有效结果")
    }

    return NextResponse.json({ success: true, message: "连接成功", imageUrl: first.url })
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

/**
 * 测试视频生成接口连通性
 * 通过查询一个不存在的任务 ID 来验证 API Key 是否有效：
 * - 返回 404/任务不存在 → API Key 有效
 * - 返回 401/403 → API Key 无效
 */
async function testVideo({
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

  const videoProvider = createVideoProviderFromConfig({
    provider,
    model,
    apiKey,
    baseUrl: resolvedBaseUrl,
  })

  if (!videoProvider) {
    throwCutGoError("VALIDATION", `当前暂不支持该视频 Provider 的在线测试：${provider}`)
  }

  try {
    // 查询一个不存在的任务 ID，用于验证 API Key 可用性
    // 401/403 → 鉴权失败；404/任务不存在 → 鉴权通过
    await withTimeout(videoProvider.queryTask("test-connectivity-check"), 10_000)
    return NextResponse.json({ success: true, message: "连接成功" })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (message === "timeout") {
      throwCutGoError("VALIDATION", "连接超时，请检查网络或 Base URL")
    }
    // 若错误信息包含"任务不存在"等非鉴权错误，说明 API Key 有效
    const lower = message.toLowerCase()
    if (lower.includes("401") || lower.includes("403") || lower.includes("unauthorized") || lower.includes("forbidden")) {
      throwCutGoError("VALIDATION", `API Key 验证失败: ${message.slice(0, 200)}`)
    }
    // 其他错误（404、任务不存在等）视为连通正常
    return NextResponse.json({ success: true, message: "连接成功（API Key 有效）" })
  }
}

