"use client"

import { useMemo } from "react"
import { useVideoEditorStore } from "@/store/video-editor-store"
import { cn } from "@/lib/utils"
import { Plus, VideoOff, Clock, Ban } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { Shot } from "@/lib/types"

function parseDuration(dur: string): number {
  const match = dur.match(/(\d+(?:\.\d+)?)\s*s?/)
  return match ? parseFloat(match[1]) : 5
}

interface AssetItem {
  shot: Shot
  isInTimeline: boolean
}

export function AssetLibrary() {
  const { storyboards, activeEpisodeId, videoClips, addVideoClip, duration } = useVideoEditorStore()

  const assets = useMemo<AssetItem[]>(() => {
    const filteredSbs = activeEpisodeId
      ? storyboards.filter((sb) => sb.script?.episode?.id === activeEpisodeId)
      : storyboards

    const shots = filteredSbs
      .flatMap((sb) => sb.shots)
      .sort((a, b) => a.index - b.index)

    return shots.map((shot) => ({
      shot,
      isInTimeline: videoClips.some((c) => c.shotId === shot.id),
    }))
  }, [storyboards, activeEpisodeId, videoClips])

  const handleAddToTimeline = (shot: Shot) => {
    if (!shot.videoUrl) return
    const dur = parseDuration(shot.videoDuration || shot.duration || "5s")
    addVideoClip({
      shotId: shot.id,
      trackId: "video-main",
      startTime: duration,
      duration: dur,
      trimStart: 0,
      trimEnd: 0,
      videoUrl: shot.videoUrl,
      thumbnailUrl: shot.imageUrl,
      label: shot.composition?.slice(0, 20) || `镜头 ${shot.index + 1}`,
      volume: 100,
      speed: 1,
      transition: "none",
      transitionDuration: 0.5,
    })
  }

  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4 min-w-[180px]">
        <VideoOff className="size-6 text-muted-foreground mb-2" />
        <p className="text-xs text-muted-foreground">当前分集暂无分镜</p>
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-col h-full min-w-[180px]">
        <div className="shrink-0 px-3 py-2 border-b flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-foreground whitespace-nowrap">素材库</span>
          <span className="text-xs text-muted-foreground whitespace-nowrap">{assets.length} 个</span>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-2 gap-1.5 p-2">
            {assets.map(({ shot, isInTimeline }) => {
              const hasVideo = !!shot.videoUrl
              const dur = parseDuration(shot.videoDuration || shot.duration || "5s")

              return (
                <Tooltip key={shot.id}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "group relative rounded-md border overflow-hidden transition-colors cursor-pointer",
                        hasVideo
                          ? isInTimeline
                            ? "border-primary/40 bg-primary/5 hover:border-primary/60"
                            : "border-border hover:border-primary/40 bg-card"
                          : "border-border/50 bg-muted/30 opacity-50 cursor-default"
                      )}
                      onClick={() => hasVideo && handleAddToTimeline(shot)}
                    >
                      {/* 缩略图 */}
                      <div className="aspect-video w-full bg-muted flex items-center justify-center overflow-hidden">
                        {shot.imageUrl ? (
                          <img
                            src={shot.imageUrl}
                            alt={`镜头 ${shot.index + 1}`}
                            className="w-full h-full object-cover"
                            draggable={false}
                          />
                        ) : (
                          <VideoOff className="size-4 text-muted-foreground" />
                        )}

                        {/* hover 遮罩 + 添加图标 */}
                        {hasVideo && (
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                            <Plus className="size-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        )}

                        {/* 未生成遮罩 */}
                        {!hasVideo && (
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                            <Ban className="size-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* 底部信息条 */}
                      <div className="px-1.5 py-1 flex items-center justify-between gap-1">
                        <span className="text-[10px] font-medium truncate">
                          #{shot.index + 1}
                        </span>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <Clock className="size-2.5 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">{dur}s</span>
                        </div>
                      </div>

                      {/* 已添加指示条 */}
                      {isInTimeline && hasVideo && (
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" />
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-[200px]">
                    <p className="text-xs font-medium">镜头 {shot.index + 1}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {shot.composition?.slice(0, 50) || "无描述"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {!hasVideo
                        ? "视频未生成，无法添加"
                        : isInTimeline
                          ? "点击再次添加到时间轴末尾"
                          : "点击添加到时间轴"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
