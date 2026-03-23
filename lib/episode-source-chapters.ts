/**
 * 解析分集关联的所有章节 ID（chapterIds 为 JSON 数组字符串，可为 null）。
 */
export function parseSourceChapterIds(ep: {
  chapterIds: string | null | undefined
}): string[] {
  if (ep.chapterIds == null || ep.chapterIds === "") return []
  try {
    const arr = JSON.parse(ep.chapterIds) as unknown
    if (Array.isArray(arr) && arr.length > 0) {
      const ids = arr.filter((x): x is string => typeof x === "string" && x.length > 0)
      if (ids.length > 0) return ids
    }
  } catch {
    /* fall through */
  }
  return []
}

/** 将请求体中的 chapterIds 规范化为入库值：无章节为 null */
export function normalizeChapterIdsFromBody(chapterIds: unknown): string | null {
  if (chapterIds === null || chapterIds === undefined) return null
  if (Array.isArray(chapterIds)) {
    const ids = chapterIds.filter((x): x is string => typeof x === "string" && x.length > 0)
    return ids.length ? JSON.stringify(ids) : null
  }
  if (typeof chapterIds === "string") {
    const t = chapterIds.trim()
    if (!t || t === "[]" || t === "null") return null
    try {
      const arr = JSON.parse(t) as unknown
      if (!Array.isArray(arr)) return null
      const ids = arr.filter((x): x is string => typeof x === "string" && x.length > 0)
      return ids.length ? JSON.stringify(ids) : null
    } catch {
      return null
    }
  }
  return null
}
