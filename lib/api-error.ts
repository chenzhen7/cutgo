/**
 * API 统一错误码与 HTTP 状态码定义
 *
 * 使用规范：
 *   - 所有 route.ts 通过 `apiError` 或快捷方法返回错误响应
 *   - 前端通过 `error` 字段（机器可读码）做分支判断，通过 `message` 字段展示用户提示
 */

import { NextResponse } from "next/server"
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
