---
description: Enforce unified AI model provider usage in API code; avoid direct env var reads, raw fetch calls, or raw generate calls for LLM and Image requests.
globs:
  - "app/api/**/*.ts"
  - "lib/ai/**/*.ts"
  - "lib/api-error*.ts"
alwaysApply: false
---

# AI 模型调用规范

所有 API 路由调用 AI 模型时，**必须**使用项目封装的统一入口，**禁止**直接读取环境变量并裸调，或直接调用 Provider 底层接口。

## 1. LLM 调用规范

使用统一入口 `callLLM()`，**禁止**裸调 `fetch`。

### 正确用法

```ts
import { callLLM } from "@/lib/ai/llm"
import { throwCutGoError, withError } from "@/lib/api-error"

// callLLM 内部已处理未配置时的抛错
const result = await callLLM({
  messages: [{ role: "user", content: prompt }],
})

// 结果处理
const text = result.content
```

### 禁止写法

```ts
// ❌ 禁止：直接读取环境变量 + 裸 fetch
const apiKey = process.env.OPENAI_API_KEY
const baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"
const model = process.env.OPENAI_MODEL || "gpt-4o-mini"

const response = await fetch(`${baseUrl}/chat/completions`, {
  method: "POST",
  headers: { Authorization: `Bearer ${apiKey}` },
  body: JSON.stringify({ model, messages }),
})
```

### LLM 未配置的错误处理

- 统一调用路径：使用 `callLLM()`，当 LLM 未配置时它会直接抛出 `throwCutGoError("LLM_NOT_CONFIGURED")`
- 若业务层需要兜底 `catch`（例如 JSON 解析），应优先透传 `CutGoError`，避免把 `LLM_NOT_CONFIGURED` 包装成其他错误

```ts
import { callLLM } from "@/lib/ai/llm"
import { CutGoError, throwCutGoError, withError } from "@/lib/api-error"

try {
  const result = await callLLM({
    messages: [{ role: "user", content: prompt }],
  })
  const text = result.content
} catch (err) {
  if (err instanceof CutGoError) {
    throw err
  }
  throwCutGoError("LLM_INVALID_RESPONSE", (err as Error).message)
}
```

### LLM 返回内容解析

解析前去掉可能的 markdown 代码块包裹，并用 `try/catch` 保护：

```ts
function parseLLMJson<T>(raw: string): T {
  let text = raw.trim()
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim()
  return JSON.parse(text) as T
}
```

## 2. 图像生成调用规范

业务路由中**必须**使用项目封装的统一入口 `callImage()`，**禁止**在 `getImageProvider()` 之后裸调 `provider.generate()`。

### 正确用法

```ts
import { callImage } from "@/lib/ai/image"

// callImage 内部已处理日志上报和未配置时的抛错
const result = await callImage({
  prompt,
  projectId,
  scope: "shot",
  aspectRatio,
  resolution
})
```

### 禁止写法

```ts
// ❌ 禁止：直接获取 provider 后裸调 generate，丢失了日志监控和统一异常处理
import { getImageProvider } from "@/lib/ai/image"

const provider = await getImageProvider()
const result = await provider.generate({ ... })
```

## Provider 支持情况

`getLLMProvider()` / `createLLMProviderFromConfig()` 用于底层获取 Provider，`callLLM()` 自动适配。
`getImageProvider()` / `createImageProviderFromConfig()` 用于底层获取 Provider，`callImage()` 自动适配。
