/**
 * API 统一错误码与响应构造
 *
 * 后端 route.ts 使用 `throwCutGoError("KEY", message?)`，由 `withError` 捕获并返回 JSON。
 * 前端通过 api-client.ts 的 ApiError.code 做分支判断，ApiError.message 展示用户提示。
 */

import { NextResponse, type NextRequest } from "next/server"

// ── 类型与错误码常量（前后端共用） ────────────────────────────────────────────

export interface ApiErrorBody {
  /** 机器可读错误码（前端 ApiError.code） */
  error: string
  /** 用户可读提示（前端优先展示该字段） */
  message: string
}

export const API_ERRORS = {
  MISSING_PARAMS: { code: "MISSING_PARAMS", status: 400, defaultMessage: "缺少必要参数" },
  VALIDATION: { code: "VALIDATION_ERROR", status: 400, defaultMessage: "请求参数校验失败" },
  NOT_FOUND: { code: "NOT_FOUND", status: 404, defaultMessage: "资源不存在" },
  CONFLICT: { code: "CONFLICT", status: 409, defaultMessage: "资源名称已存在，请使用不同的名称" },
  LLM_NOT_CONFIGURED: { code: "LLM_NOT_CONFIGURED", status: 422, defaultMessage: "尚未配置语言模型，请先前往设置页面配置 LLM API" },
  LLM_INVALID_RESPONSE: { code: "LLM_INVALID_RESPONSE", status: 500, defaultMessage: "LLM 未返回有效内容，请重试" },
  IMAGE_NOT_CONFIGURED: { code: "IMAGE_NOT_CONFIGURED", status: 422, defaultMessage: "尚未配置生图模型，请先前往设置页面配置图像 API" },
  VIDEO_NOT_CONFIGURED: { code: "VIDEO_NOT_CONFIGURED", status: 422, defaultMessage: "尚未配置视频生成模型，请先前往设置页面配置视频 API" },
  INTERNAL: { code: "INTERNAL_ERROR", status: 500, defaultMessage: "服务器内部错误，请稍后重试" },
} as const

export type ApiErrorKey = keyof typeof API_ERRORS
export type ApiErrorCode = (typeof API_ERRORS)[ApiErrorKey]["code"]

export class CutGoError extends Error {
  code: ApiErrorCode
  status: number

  constructor(code: ApiErrorCode, status: number, message: string) {
    super(message)
    this.name = "CutGoError"
    this.code = code
    this.status = status
  }
}

function jsonErrorResponse(key: ApiErrorKey, message?: string) {
  const { code, status, defaultMessage } = API_ERRORS[key]
  return NextResponse.json<ApiErrorBody>(
    { error: code, message: message ?? defaultMessage },
    { status }
  )
}

export function throwCutGoError(
    key: ApiErrorKey,
    message?: string
): never {
  const { code, status, defaultMessage } = API_ERRORS[key]
  throw new CutGoError(code, status, message ?? defaultMessage)
}
// ── 全局异常兜底 (withError) ────────────────────────────────────────────────

export function withError(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (req: NextRequest, ctx?: any) => Promise<Response> | Response
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (req: NextRequest, ctx?: any) => {
    try {
      return await handler(req, ctx)
    } catch (error: unknown) {
      console.error("[API Error]", req.method, req.nextUrl?.pathname, error)

      if (error instanceof CutGoError) {
        return NextResponse.json<ApiErrorBody>(
          { error: error.code, message: error.message },
          { status: error.status }
        )
      }

      const e = error as { code?: string; message?: string }
      if (e.code === "P2025") {
        return jsonErrorResponse("NOT_FOUND", "记录不存在")
      }
      if (e.code === "P2002") {
        return jsonErrorResponse("CONFLICT", "资源已存在")
      }
      const fallback =
        error instanceof Error && error.message
          ? error.message
          : "服务器内部错误"
      return jsonErrorResponse("INTERNAL", fallback)
    }
  }
}
