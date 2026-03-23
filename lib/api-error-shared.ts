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

/** 通用参数校验 */
export const ERR_MISSING_PARAMS = "MISSING_PARAMS"
/** 资源不存在 */
export const ERR_NOT_FOUND = "NOT_FOUND"
/** 资源名称冲突 */
export const ERR_CONFLICT = "CONFLICT"
/** LLM 未配置 */
export const ERR_LLM_NOT_CONFIGURED = "LLM_NOT_CONFIGURED"
/** LLM 返回内容无效 */
export const ERR_LLM_INVALID_RESPONSE = "LLM_INVALID_RESPONSE"
/** 外部 AI 服务调用失败 */
export const ERR_AI_CALL_FAILED = "AI_CALL_FAILED"
/** 业务校验不通过 */
export const ERR_VALIDATION = "VALIDATION_ERROR"
/** 服务端内部错误 */
export const ERR_INTERNAL = "INTERNAL_ERROR"
/** 前端本地解析失败或未知错误 */
export const ERR_UNKNOWN = "UNKNOWN_ERROR"
