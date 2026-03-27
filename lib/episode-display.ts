import type { Episode } from "@/lib/types"

/** 全项目分集：按分集 index（与剧本侧持久化顺序一致） */
export function sortEpisodesByChapterAndIndex(episodes: Episode[]): Episode[] {
  return sortEpisodesByGlobalIndex(episodes)
}

/** 全剧分集顺序：按分集 index（与剧本侧拖拽排序写入库中的顺序一致） */
function sortEpisodesByGlobalIndex(episodes: Episode[]): Episode[] {
  return [...episodes].sort((a, b) => {
    const d = a.index - b.index
    if (d !== 0) return d
    return a.createdAt.localeCompare(b.createdAt)
  })
}

/** 按全局顺序得到「第几集」展示序号（从 1 起），与拖拽排序后的分集 index 一致 */
export function buildEpisodeDisplayNumberMap(episodes: Episode[]): Map<string, number> {
  const map = new Map<string, number>()
  episodes.forEach((ep) => map.set(ep.id, ep.index + 1))
  return map
}
