import type { Episode } from "@/lib/types"

/** 全项目分集：先按章节顺序，再按分集 index（与导航/持久化顺序一致） */
export function sortEpisodesByChapterAndIndex(episodes: Episode[]): Episode[] {
  return [...episodes].sort((a, b) => {
    const c = a.chapter.index - b.chapter.index
    if (c !== 0) return c
    return a.index - b.index
  })
}

/** 按上述顺序得到「第几集」展示序号（从 1 起），不依赖分集自身的 index 字段作为展示值 */
export function buildEpisodeDisplayNumberMap(episodes: Episode[]): Map<string, number> {
  const sorted = sortEpisodesByChapterAndIndex(episodes)
  const map = new Map<string, number>()
  sorted.forEach((ep, i) => map.set(ep.id, i + 1))
  return map
}
