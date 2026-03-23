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
  ERR_AI_CALL_FAILED,
  ERR_CONFLICT,
  ERR_INTERNAL,
  ERR_LLM_INVALID_RESPONSE,
  ERR_LLM_NOT_CONFIGURED,
  ERR_MISSING_PARAMS,
  ERR_NOT_FOUND,
  ERR_VALIDATION,
  type ApiErrorCode,
  type ApiErrorBody,
} from "./api-error-shared"

export {
  ERR_AI_CALL_FAILED,
  ERR_CONFLICT,
  ERR_INTERNAL,
  ERR_LLM_INVALID_RESPONSE,
  ERR_LLM_NOT_CONFIGURED,
  ERR_MISSING_PARAMS,
  ERR_NOT_FOUND,
  ERR_VALIDATION,
} from "./api-error-shared"

// ── HTTP 状态码常量 ─────────────────────────────────────────────────────────

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: API_ERRORS.MISSING_PARAMS.status,
  NOT_FOUND: API_ERRORS.NOT_FOUND.status,
  CONFLICT: API_ERRORS.CONFLICT.status,
  UNPROCESSABLE: API_ERRORS.LLM_NOT_CONFIGURED.status,
  INTERNAL_ERROR: API_ERRORS.INTERNAL.status,
} as const

// ── 响应构造函数 ────────────────────────────────────────────────────────────

/**
 * 构造标准错误响应。
 *
 * @example
 * return apiError(ERR_NOT_FOUND, HTTP_STATUS.NOT_FOUND, "小说不存在")
 * return apiError(ERR_LLM_NOT_CONFIGURED, HTTP_STATUS.UNPROCESSABLE)
 */
export function apiError(
  code: ApiErrorCode | string,
  status: number,
  message?: string,
  detail?: string
): NextResponse<ApiErrorBody> {
  const definition = API_ERROR_BY_CODE[code as ApiErrorCode]
  const body: ApiErrorBody = {
    error: code,
    message: message ?? definition?.defaultMessage ?? code,
  }
  if (detail) body.detail = detail
  return NextResponse.json(body, { status })
}

// ── 快捷方法 ────────────────────────────────────────────────────────────────

export const badRequest = (message?: string, detail?: string) =>
  apiError(ERR_MISSING_PARAMS, HTTP_STATUS.BAD_REQUEST, message, detail)

export const validationError = (message: string, detail?: string) =>
  apiError(ERR_VALIDATION, HTTP_STATUS.BAD_REQUEST, message, detail)

export const notFound = (message?: string) =>
  apiError(ERR_NOT_FOUND, HTTP_STATUS.NOT_FOUND, message)

export const conflict = (message: string) =>
  apiError(ERR_CONFLICT, HTTP_STATUS.CONFLICT, message)

export const llmNotConfigured = () =>
  apiError(ERR_LLM_NOT_CONFIGURED, HTTP_STATUS.UNPROCESSABLE)

export const llmInvalidResponse = (detail?: string) =>
  apiError(ERR_LLM_INVALID_RESPONSE, HTTP_STATUS.INTERNAL_ERROR, undefined, detail)

export const internalError = (message?: string, detail?: string) =>
  apiError(ERR_INTERNAL, HTTP_STATUS.INTERNAL_ERROR, message, detail)
