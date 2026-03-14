"use client"

import { useVideoStore } from "@/store/video-store"
import { EpisodeProgressItem } from "./episode-progress-item"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Episode } from "@/lib/types"

interface CompositionProgressPanelProps {
  episodes: Episode[]
}

export function CompositionProgressPanel({ episodes }: CompositionProgressPanelProps) {
  const { episodeTaskStatus, episodeLatestTask, cancelComposition } = useVideoStore()

  const activeEpisodes = episodes.filter((ep) => {
    const s = episodeTaskStatus(ep.id)
    return s === "preparing" || s === "tts_generating" || s === "subtitle_generating" || s === "compositing"
  })

  if (activeEpisodes.length === 0) return null

  const currentEp = activeEpisodes[0]
  const currentTask = episodeLatestTask(currentEp.id)

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2 pt-3">
        <CardTitle className="text-sm font-medium">合成进度</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 pb-3">
        {episodes.map((ep) => {
          const status = episodeTaskStatus(ep.id)
          const task = episodeLatestTask(ep.id)
          return (
            <EpisodeProgressItem
              key={ep.id}
              episode={{ id: ep.id, index: ep.index, title: ep.title }}
              task={task}
              status={status}
              onCancel={cancelComposition}
            />
          )
        })}
      </CardContent>
    </Card>
  )
}
