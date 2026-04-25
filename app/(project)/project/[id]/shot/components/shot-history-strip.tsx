"use client"

import { useMemo, type ReactNode } from "react"
import { History } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Shot } from "@/lib/types"
import { parseShotImageHistory, parseShotVideoHistory } from "@/lib/types"

interface ShotHistoryStripProps {
  shot: Shot
  activeTab: "image" | "video"
}

interface HistoryListProps {
  label: string
  items: { url: string; createdAt: string }[]
  dragType: string
  itemClassName?: string
  children: (item: { url: string; createdAt: string }) => ReactNode
}

function HistoryList({ label, items, dragType, itemClassName, children }: HistoryListProps) {
  if (items.length === 0) return null

  return (
    <div className="shrink-0 border-t px-4 pt-2 pb-3">
      <div className="flex items-center gap-1.5 mb-2">
        <History className="size-3 text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
        {items.map((item, idx) => (
          <div
            key={idx}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData(dragType, JSON.stringify(item))
              e.dataTransfer.effectAllowed = "copy"
            }}
            className={cn(
              "relative shrink-0 w-12 h-12 rounded-md overflow-hidden border transition-all cursor-grab active:cursor-grabbing",
              "border-border hover:border-muted-foreground/50",
              itemClassName
            )}
            title={`生成于 ${new Date(item.createdAt).toLocaleString()}，拖至预览区恢复`}
          >
            {children(item)}
            <span className="absolute bottom-0 right-0 text-[8px] bg-black/50 text-white px-0.5 rounded-tl">
              #{items.length - idx}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ShotHistoryStrip({
  shot,
  activeTab,
}: ShotHistoryStripProps) {
  const imageHistory = useMemo(() => parseShotImageHistory(shot.imageHistory), [shot.imageHistory])
  const videoHistory = useMemo(() => parseShotVideoHistory(shot.videoHistory), [shot.videoHistory])

  if (activeTab === "image") {
    return (
      <HistoryList label="历史画面" items={imageHistory} dragType="application/cutgo-history-image">
        {(item) => (
          <img
            src={item.url}
            alt=""
            className="w-full h-full object-cover pointer-events-none"
          />
        )}
      </HistoryList>
    )
  }

  if (activeTab === "video") {
    return (
      <HistoryList
        label="历史视频"
        items={videoHistory}
        dragType="application/cutgo-history-video"
        itemClassName="flex items-center justify-center bg-black"
      >
        {(item) => (
          <video
            src={item.url}
            className="w-full h-full object-cover opacity-80 pointer-events-none"
            muted
          />
        )}
      </HistoryList>
    )
  }

  return null
}
