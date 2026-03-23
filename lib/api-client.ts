/**
 * 前端统一 fetch 封装
 *
 * 与后端 `api-error-shared.ts` 约定对齐：
 *   - 错误响应体格式为 { error: string, message: string, detail?: string }
 *   - error 字段为机器可读错误码，用于分支判断
 *   - message 字段为用户可读提示，优先用于展示
 */

import { ERR_UNKNOWN, type ApiErrorBody } from "./api-error-shared"

/** 带机器可读 code 的前端错误类 */
export class ApiError extends Error {
  readonly code: string
  readonly detail?: string
  readonly status: number

  constructor(body: ApiErrorBody, status: number) {
    super(body.message)
    this.name = "ApiError"
    this.code = body.error
    this.detail = body.detail
    this.status = status
  }
}

type RequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

interface RequestOptions {
  method?: RequestMethod
  body?: unknown
  headers?: Record<string, string>
  signal?: AbortSignal
}

/**
 * 解析响应中的错误体，对非 JSON 响应降级处理
 */
async function parseErrorBody(res: Response): Promise<ApiErrorBody> {
  try {
    const body = await res.json()
    if (body && typeof body.error === "string") {
      return {
        error: body.error as string,
        message: (body.message as string) || (body.error as string),
        detail: body.detail as string | undefined,
      }
    }
    return { error: ERR_UNKNOWN, message: `请求失败（${res.status}）` }
  } catch {
    return { error: ERR_UNKNOWN, message: `请求失败（${res.status}）` }
  }
}

/**
 * 统一 fetch 方法，自动注入 JSON 头并在 !res.ok 时抛出 ApiError。
 *
 * @example
 * const data = await apiFetch<Project[]>("/api/projects")
 * const project = await apiFetch<Project>("/api/projects", { method: "POST", body: { name } })
 */
export async function apiFetch<T = unknown>(
  url: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, headers = {}, signal } = options

  const init: RequestInit = {
    method,
    signal,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
  }

  if (body !== undefined) {
    init.body = JSON.stringify(body)
  }

  const res = await fetch(url, init)

  if (!res.ok) {
    const errorBody = await parseErrorBody(res)
    throw new ApiError(errorBody, res.status)
  }

  // 204 No Content 或空响应
  const contentType = res.headers.get("content-type")
  if (res.status === 204 || !contentType?.includes("application/json")) {
    return undefined as T
  }

  return res.json() as Promise<T>
}

/**
 * 静默 fetch：失败时返回 null 而不是抛出，适合非关键数据加载（如轮询、侧边栏）
 */
export async function apiFetchSilent<T = unknown>(
  url: string,
  options?: RequestOptions
): Promise<T | null> {
  try {
    return await apiFetch<T>(url, options)
  } catch {
    return null
  }
}
