const MAX_FIELD_LENGTH = 300
const MASKED_VALUE = "***"
const SENSITIVE_KEYS = ["apiKey", "authorization", "token", "secret", "password"]

type LogStage = "request" | "response" | "error"

interface TruncateContext {
  seen: WeakSet<object>
}

function isSensitiveKey(key: string): boolean {
  const lowerKey = key.toLowerCase()
  return SENSITIVE_KEYS.some((item) => lowerKey.includes(item.toLowerCase()))
}

function truncateString(value: string): string {
  if (value.length <= MAX_FIELD_LENGTH) return value
  return `${value.slice(0, MAX_FIELD_LENGTH)}...(truncated, len=${value.length})`
}

function normalizeValue(value: unknown, context: TruncateContext): unknown {
  if (typeof value === "string") {
    return truncateString(value)
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeValue(item, context))
  }

  if (value && typeof value === "object") {
    const objectValue = value as Record<string, unknown>
    if (context.seen.has(objectValue)) {
      return "[Circular]"
    }
    context.seen.add(objectValue)

    const output: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(objectValue)) {
      if (isSensitiveKey(key)) {
        output[key] = MASKED_VALUE
        continue
      }
      output[key] = normalizeValue(item, context)
    }
    return output
  }

  return value
}

function normalizePayload(payload: unknown): unknown {
  return normalizeValue(payload, { seen: new WeakSet<object>() })
}

export function logAIEvent(scope: "llm" | "image", stage: LogStage, payload: unknown): void {
  const now = new Date().toISOString()
  const normalizedPayload = normalizePayload(payload)

  console.log(`[AI][${scope.toUpperCase()}][${stage.toUpperCase()}] ${now}`)
  console.log(JSON.stringify(normalizedPayload, null, 2))
}
