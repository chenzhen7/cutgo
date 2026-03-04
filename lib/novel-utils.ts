const CHAPTER_PATTERNS = [
  /^第\s*\d+\s*章/,
  /^第\s*[一二三四五六七八九十百千]+\s*章/,
  /^第\s*\d+\s*节/,
  /^第\s*[一二三四五六七八九十百千]+\s*节/,
  /^Chapter\s+\d+/i,
  /^---+$/,
]

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
      currentTitle = trimmed === "---" ? null : trimmed
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
