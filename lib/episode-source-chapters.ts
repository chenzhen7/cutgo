/**
 * 分集与小说章节：一集可涵盖多章（sourceChapterIds），chapterId 为锚点/首章
 */

export function parseSourceChapterIds(ep: {
  chapterId: string
  sourceChapterIds?: string | null
}): string[] {
  if (ep.sourceChapterIds) {
    try {
      const arr = JSON.parse(ep.sourceChapterIds) as unknown
      if (Array.isArray(arr) && arr.length > 0) {
        const ids = arr.filter((x): x is string => typeof x === "string" && x.length > 0)
        if (ids.length > 0) return ids
      }
    } catch {
      /* fall through */
    }
  }
  return [ep.chapterId]
}
