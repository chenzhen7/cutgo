/**
 * API 统一错误码与 HTTP 状态码定义
 *
 * 使用规范：
 *   - 所有 route.ts 通过 `apiError` 或快捷方法返回错误响应
 *   - 前端通过 `error` 字段（机器可读码）做分支判断，通过 `message` 字段展示用户提示
 */

import { NextRequest, NextResponse } from "next/server"
import {
  API_ERROR_BY_CODE,
  API_ERRORS,
  type ApiErrorCode,
  type ApiErrorBody,
} from "./api-error-shared"

export { API_ERRORS } from "./api-error-shared"

// ── 响应构造函数 ────────────────────────────────────────────────────────────

/**
 * 构造标准错误响应。
 *
 * @example
 * return apiError(API_ERRORS.NOT_FOUND.code, API_ERRORS.NOT_FOUND.status, "小说不存在")
 * return apiError(API_ERRORS.LLM_NOT_CONFIGURED.code, API_ERRORS.LLM_NOT_CONFIGURED.status)
 */
export function apiError(
  code: ApiErrorCode | string,
  status: number,
  message?: string
): NextResponse<ApiErrorBody> {
  const definition = API_ERROR_BY_CODE[code as ApiErrorCode]
  const body: ApiErrorBody = {
    error: code,
    message: message ?? definition?.defaultMessage ?? code,
  }
  return NextResponse.json(body, { status })
}

// ── 快捷方法 ────────────────────────────────────────────────────────────────

export const badRequest = (message?: string) =>
  apiError(API_ERRORS.MISSING_PARAMS.code, API_ERRORS.MISSING_PARAMS.status, message)

export const validationError = (message: string) =>
  apiError(API_ERRORS.VALIDATION.code, API_ERRORS.VALIDATION.status, message)

export const notFound = (message?: string) =>
  apiError(API_ERRORS.NOT_FOUND.code, API_ERRORS.NOT_FOUND.status, message)

export const conflict = (message: string) =>
  apiError(API_ERRORS.CONFLICT.code, API_ERRORS.CONFLICT.status, message)

export const llmNotConfigured = () =>
  apiError(API_ERRORS.LLM_NOT_CONFIGURED.code, API_ERRORS.LLM_NOT_CONFIGURED.status)

export const llmInvalidResponse = (message?: string) =>
  apiError(API_ERRORS.LLM_INVALID_RESPONSE.code, API_ERRORS.LLM_INVALID_RESPONSE.status, message)

export const internalError = (message?: string) =>
  apiError(API_ERRORS.INTERNAL.code, API_ERRORS.INTERNAL.status, message)

// ── 路由级统一异常处理 ────────────────────────────────────────────────────────

type AnyRouteContext = unknown

export type AppRouteHandler<TContext = AnyRouteContext> = (
  request: NextRequest,
  context?: TContext
) => Promise<NextResponse> | NextResponse

export class ApiRouteError extends Error {
  readonly code: string
  readonly status: number
  readonly detail?: string

  constructor(code: string, status: number, message?: string) {
    super(message ?? code)
    this.name = "ApiRouteError"
    this.code = code
    this.status = status
    this.detail = message
  }
}

export const routeError = {
  badRequest(message?: string): never {
    throw new ApiRouteError(API_ERRORS.MISSING_PARAMS.code, API_ERRORS.MISSING_PARAMS.status, message)
  },
  validation(message: string): never {
    throw new ApiRouteError(API_ERRORS.VALIDATION.code, API_ERRORS.VALIDATION.status, message)
  },
  notFound(message?: string): never {
    throw new ApiRouteError(API_ERRORS.NOT_FOUND.code, API_ERRORS.NOT_FOUND.status, message)
  },
  conflict(message: string): never {
    throw new ApiRouteError(API_ERRORS.CONFLICT.code, API_ERRORS.CONFLICT.status, message)
  },
  llmNotConfigured(): never {
    throw new ApiRouteError(API_ERRORS.LLM_NOT_CONFIGURED.code, API_ERRORS.LLM_NOT_CONFIGURED.status)
  },
  llmInvalidResponse(message?: string): never {
    throw new ApiRouteError(
      API_ERRORS.LLM_INVALID_RESPONSE.code,
      API_ERRORS.LLM_INVALID_RESPONSE.status,
      message
    )
  },
  internal(message?: string): never {
    throw new ApiRouteError(API_ERRORS.INTERNAL.code, API_ERRORS.INTERNAL.status, message)
  },
}

export function withApiError<TContext = AnyRouteContext>(
  handler: AppRouteHandler<TContext>
): AppRouteHandler<TContext> {
  return async (request: NextRequest, context?: TContext) => {
    try {
      return await handler(request, context)
    } catch (err) {
      if (err instanceof ApiRouteError) {
        return apiError(err.code, err.status, err.detail)
      }

      if (err instanceof SyntaxError) {
        return badRequest("请求体 JSON 格式错误")
      }

      if (err instanceof Error && err.message === API_ERRORS.LLM_NOT_CONFIGURED.code) {
        return llmNotConfigured()
      }

      console.error("Unhandled route error:", err)
      return internalError()
    }
  }
}

