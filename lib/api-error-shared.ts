/**
 * 前后端共享的 API 错误结构与错误码常量。
 * 仅包含纯类型与常量，不依赖 Next.js 运行时对象。
 */

export interface ApiErrorBody {
  /** 机器可读错误码 */
  error: string
  /** 用户可读提示（前端优先展示该字段） */
  message: string
  /** 附加调试信息 */
  detail?: string
}

/**
 * 统一错误定义（类似 Java 枚举携带字段）：
 * - code: 机器可读错误码
 * - status: HTTP 状态码（仅后端 route 使用）
 * - defaultMessage: 默认用户提示
 */
export const API_ERRORS = {
  MISSING_PARAMS: {
    code: "MISSING_PARAMS",
    status: 400,
    defaultMessage: "缺少必要参数",
  },
  NOT_FOUND: {
    code: "NOT_FOUND",
    status: 404,
    defaultMessage: "资源不存在",
  },
  CONFLICT: {
    code: "CONFLICT",
    status: 409,
    defaultMessage: "资源名称已存在，请使用不同的名称",
  },
  LLM_NOT_CONFIGURED: {
    code: "LLM_NOT_CONFIGURED",
    status: 422,
    defaultMessage: "尚未配置语言模型，请先前往设置页面配置 LLM API",
  },
  LLM_INVALID_RESPONSE: {
    code: "LLM_INVALID_RESPONSE",
    status: 500,
    defaultMessage: "LLM 未返回有效内容，请重试",
  },
  AI_CALL_FAILED: {
    code: "AI_CALL_FAILED",
    status: 500,
    defaultMessage: "AI 服务调用失败，请稍后重试",
  },
  VALIDATION: {
    code: "VALIDATION_ERROR",
    status: 400,
    defaultMessage: "请求参数校验失败",
  },
  INTERNAL: {
    code: "INTERNAL_ERROR",
    status: 500,
    defaultMessage: "服务器内部错误，请稍后重试",
  },
  UNKNOWN: {
    code: "UNKNOWN_ERROR",
    status: 500,
    defaultMessage: "未知错误",
  },
} as const

export type ApiErrorKey = keyof typeof API_ERRORS
export type ApiErrorCode = (typeof API_ERRORS)[ApiErrorKey]["code"]
export type ApiErrorDefinition = (typeof API_ERRORS)[ApiErrorKey]

export const API_ERROR_BY_CODE: Record<ApiErrorCode, ApiErrorDefinition> = Object.values(
  API_ERRORS
).reduce(
  (acc, item) => {
    acc[item.code] = item
    return acc
  },
  {} as Record<ApiErrorCode, ApiErrorDefinition>
)
