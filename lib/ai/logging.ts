export function logAIEvent(
  type: "llm" | "image",
  action: "request" | "response",
  payload: any
) {
  // 递归截断超过 1000 字符的字符串
  const truncateStrings = (obj: any): any => {
    if (typeof obj === "string") {
      return obj.length > 3000 ? obj.substring(0, 3000) + "... [truncated]" : obj;
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
    
    console.log(logPrefix, JSON.stringify(truncatedPayload, null, 2));
  } catch (err) {
    console.error(`[AI ${type.toUpperCase()} ${action.toUpperCase()}] Error logging event:`, err);
  }
}
