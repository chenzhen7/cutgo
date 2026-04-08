export function logAIEvent(
  type: "llm" | "image" | "video",
  action: "request" | "response",
  payload: any
) {
  // 递归处理字符串，仅截断 base64 等巨长字符串，其他全量打印
  const truncateStrings = (obj: any): any => {
    if (typeof obj === "string") {
      // 判断是否是 base64 data URI
      if (obj.startsWith("data:") && obj.includes("base64,")) {
        return obj.substring(0, 50) + "... [base64 data truncated]";
      }
      // 判断是否是纯 base64 字符串（极长且只包含 base64 字符及换行，不含普通标点空格）
      if (obj.length > 1000 && /^[a-zA-Z0-9+/=\n\r]+$/.test(obj)) {
        return obj.substring(0, 50) + "... [base64 string truncated]";
      }
      // 其他字符串全部打印
      return obj;
    }
    if (Array.isArray(obj)) {
      return obj.map(truncateStrings);
    }
    if (obj !== null && typeof obj === "object") {
      // 保留特殊对象（如 Date, Buffer 等）的原始值，避免被转换为普通对象
      if (obj instanceof Date || obj instanceof Uint8Array || (typeof Buffer !== 'undefined' && Buffer.isBuffer(obj))) {
        return obj;
      }
      const newObj: any = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          newObj[key] = truncateStrings(obj[key]);
        }
      }
      return newObj;
    }
    return obj;
  };

  try {
    const truncatedPayload = truncateStrings(payload);
    const timestamp = new Date().toISOString();
    const logPrefix = `[${timestamp}] [AI ${type.toUpperCase()} ${action.toUpperCase()}]`;

    const logString = JSON.stringify(truncatedPayload, null, 2).replace(/\\n/g, '\n');
    console.log(logPrefix, '\n' + logString);
  } catch (err) {
    console.error(`[AI ${type.toUpperCase()} ${action.toUpperCase()}] Error logging event:`, err);
  }
}
