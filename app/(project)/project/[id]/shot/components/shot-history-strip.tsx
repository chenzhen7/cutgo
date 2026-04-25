"use client"

import { useMemo } from "react"
import { History } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Shot, ShotImageHistoryItem, ShotVideoHistoryItem } from "@/lib/types"
import { parseShotImageHistory, parseShotVideoHistory } from "@/lib/types"

interface ShotHistoryStripProps {
  shot: Shot
  activeTab: "image" | "video"
}

export function ShotHistoryStrip({
  shot,
  activeTab,
}: ShotHistoryStripProps) {
  const imageHistory = useMemo(() => parseShotImageHistory(shot.imageHistory), [shot.imageHistory])
  const videoHistory = useMemo(() => parseShotVideoHistory(shot.videoHistory), [shot.videoHistory])

  if (activeTab === "image") {
    if (imageHistory.length === 0) return null

    return (
      <div className="shrink-0 border-t px-4 pt-2 pb-3">
        <div className="flex items-center gap-1.5 mb-2">
          <History className="size-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground font-medium">历史画面</span>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          {imageHistory.map((item, idx) => (
            <div
              key={idx}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("application/cutgo-history-image", JSON.stringify(item))
                e.dataTransfer.effectAllowed = "copy"
              }}
              className={cn(
                "relative shrink-0 w-12 h-12 rounded-md overflow-hidden border transition-all cursor-grab active:cursor-grabbing",
                "border-border hover:border-muted-foreground/50"
              )}
              title={`生成于 ${new Date(item.createdAt).toLocaleString()}，拖至预览区恢复`}
            >
              <img
                src={item.url}
                alt={`历史 ${idx + 1}`}
                className="w-full h-full object-cover pointer-events-none"
              />
              <span className="absolute bottom-0 right-0 text-[8px] bg-black/50 text-white px-0.5 rounded-tl">
                #{imageHistory.length - idx}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (activeTab === "video") {
    if (videoHistory.length === 0) return null

    return (
      <div className="shrink-0 border-t px-4 pt-2 pb-3">
        <div className="flex items-center gap-1.5 mb-2">
          <History className="size-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground font-medium">历史视频</span>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          {videoHistory.map((item, idx) => (
            <div
              key={idx}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("application/cutgo-history-video", JSON.stringify(item))
                e.dataTransfer.effectAllowed = "copy"
              }}
              className={cn(
                "relative shrink-0 w-12 h-12 rounded-md overflow-hidden border transition-all cursor-grab active:cursor-grabbing flex items-center justify-center bg-black",
                "border-border hover:border-muted-foreground/50"
              )}
              title={`生成于 ${new Date(item.createdAt).toLocaleString()}，拖至预览区恢复`}
            >
              <video
                src={item.url}
                className="w-full h-full object-cover opacity-80 pointer-events-none"
                muted
              />
              <span className="absolute bottom-0 right-0 text-[8px] bg-black/50 text-white px-0.5 rounded-tl">
                #{videoHistory.length - idx}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return null
}
