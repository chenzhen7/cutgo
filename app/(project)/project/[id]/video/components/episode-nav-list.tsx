"use client"

import { useVideoStore } from "@/store/video-store"
import { EpisodeNavItem } from "./episode-nav-item"
import type { Episode } from "@/lib/types"

interface EpisodeNavListProps {
  episodes: Episode[]
}

export function EpisodeNavList({ episodes }: EpisodeNavListProps) {
  const { activeEpisodeId, setActiveEpisodeId, episodeTaskStatus, episodeLatestTask } = useVideoStore()

  return (
    <div className="flex flex-col gap-1 p-2">
      {episodes.map((ep) => (
        <EpisodeNavItem
          key={ep.id}
          episode={{ id: ep.id, index: ep.index, title: ep.title }}
          task={episodeLatestTask(ep.id)}
          status={episodeTaskStatus(ep.id)}
          isActive={activeEpisodeId === ep.id}
          onClick={() => setActiveEpisodeId(ep.id)}
        />
      ))}
    </div>
  )
}
