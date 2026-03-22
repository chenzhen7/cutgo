const CHAPTER_PATTERNS = [
  /^第\s*\d+\s*章/,
  /^第\s*[一二三四五六七八九十百千]+\s*章/,
  /^第\s*\d+\s*节/,
  /^第\s*[一二三四五六七八九十百千]+\s*节/,
  /^Chapter\s+\d+/i,
  /^---+$/,
]

/**
 * 从章节标题行去掉「第N章」「第N节」「Chapter N」等前缀，仅保留正文标题。
 * 去前缀后无内容时返回 null。
 */
export function stripChapterHeadingPrefix(line: string): string | null {
  const t = line.trim()
  if (!t || t === "---") return null

  const restAfter = (s: string) => {
    const r = s.trim().replace(/^[\s\u3000]+/, "")
    return r.length > 0 ? r : null
  }

  let m = t.match(/^第\s*\d+\s*章\s*(.*)$/u)
  if (m) return restAfter(m[1] ?? "")

  m = t.match(/^第\s*[一二三四五六七八九十百千]+\s*章\s*(.*)$/u)
  if (m) return restAfter(m[1] ?? "")

  m = t.match(/^第\s*\d+\s*节\s*(.*)$/u)
  if (m) return restAfter(m[1] ?? "")

  m = t.match(/^第\s*[一二三四五六七八九十百千]+\s*节\s*(.*)$/u)
  if (m) return restAfter(m[1] ?? "")

  m = t.match(/^Chapter\s+\d+\s*(.*)$/iu)
  if (m) return restAfter(m[1] ?? "")

  return null
}

/** 库内章节 index 从 0 起时，用于 UI 展示「第N章」 */
export function formatChapterOrdinalLabel(index: number): string {
  return `第${index + 1}章`
}

export interface DetectedChapter {
  index: number
  title: string | null
  content: string
  wordCount: number
}

export function detectChapters(text: string): DetectedChapter[] {
  const lines = text.split("\n")
  const chapters: DetectedChapter[] = []
  let currentTitle: string | null = null
  let currentLines: string[] = []
  let chapterIndex = 0

  function pushChapter() {
    const content = currentLines.join("\n").trim()
    if (content) {
      chapters.push({
        index: chapterIndex++,
        title: currentTitle,
        content,
        wordCount: countWords(content),
      })
    }
  }

  for (const line of lines) {
    const trimmed = line.trim()
    const isChapterHeading = CHAPTER_PATTERNS.some((p) => p.test(trimmed))

    if (isChapterHeading) {
      pushChapter()
      if (trimmed === "---") {
        currentTitle = null
      } else {
        currentTitle = stripChapterHeadingPrefix(trimmed)
      }
      currentLines = []
    } else {
      currentLines.push(line)
    }
  }
  pushChapter()

  return chapters
}

export function splitParagraphs(text: string) {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
}

export function countWords(text: string): number {
  const cleaned = text.replace(/\s+/g, "")
  return cleaned.length
}

export function hasChapterStructure(text: string): boolean {
  const lines = text.split("\n")
  return lines.some((line) =>
    CHAPTER_PATTERNS.some((p) => p.test(line.trim()))
  )
}
