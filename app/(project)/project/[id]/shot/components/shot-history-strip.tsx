"use client"

import { useMemo, useState } from "react"
import { History, RotateCcw, X } from "lucide-react"
import { cn, parseJsonArray } from "@/lib/utils"
import type { Shot, ShotImageHistoryItem, ShotVideoHistoryItem } from "@/lib/types"
import { parseShotImageHistory, parseShotVideoHistory } from "@/lib/types"
import { PreviewableImage } from "@/components/ui/previewable-image"
import { Button } from "@/components/ui/button"

interface ShotHistoryStripProps {
  shot: Shot
  activeTab: "image" | "video"
  onRestoreImage?: (item: ShotImageHistoryItem) => void
  onRestoreVideo?: (item: ShotVideoHistoryItem) => void
}

export function ShotHistoryStrip({
  shot,
  activeTab,
  onRestoreImage,
  onRestoreVideo,
}: ShotHistoryStripProps) {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)

  const imageHistory = useMemo(() => parseShotImageHistory(shot.imageHistory), [shot.imageHistory])
  const videoHistory = useMemo(() => parseShotVideoHistory(shot.videoHistory), [shot.videoHistory])

  if (activeTab === "image") {
    if (imageHistory.length === 0) return null

    const previewItem = previewIndex !== null ? imageHistory[previewIndex] : null

    return (
      <div className="shrink-0 border-t px-4 pt-2 pb-3">
        <div className="flex items-center gap-1.5 mb-2">
          <History className="size-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground font-medium">历史画面</span>
          {previewIndex !== null && (
            <span className="text-[10px] text-primary ml-1">
              正在预览 #{imageHistory.length - previewIndex}
            </span>
          )}
        </div>

        {previewItem && (
          <div className="mb-2 rounded-lg border bg-muted/20 p-1.5">
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0 h-16 flex items-center justify-center bg-black/5 rounded overflow-hidden">
                {previewItem.imageType === "first_last" && (previewItem.lastFrameUrl || previewItem.imageUrls) ? (
                  <div className="flex gap-1 h-full">
                    <img
                      src={previewItem.url}
                      alt="历史首帧"
                      className="h-full object-contain rounded"
                    />
                    <img
                      src={previewItem.lastFrameUrl || parseJsonArray(previewItem.imageUrls)[1] || ""}
                      alt="历史尾帧"
                      className="h-full object-contain rounded"
                    />
                  </div>
                ) : (
                  <PreviewableImage
                    src={previewItem.url}
                    alt="历史画面"
                    className="max-h-full max-w-full object-contain rounded"
                  />
                )}
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-[10px] px-2"
                  onClick={() => onRestoreImage?.(previewItem)}
                >
                  <RotateCcw className="size-3 mr-1" />
                  恢复此版本
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[10px] px-2 text-muted-foreground"
                  onClick={() => setPreviewIndex(null)}
                >
                  <X className="size-3 mr-1" />
                  取消
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          {imageHistory.map((item, idx) => {
            const isActive = previewIndex === idx
            return (
              <button
                key={idx}
                onClick={() => setPreviewIndex(isActive ? null : idx)}
                className={cn(
                  "relative shrink-0 w-12 h-12 rounded-md overflow-hidden border transition-all",
                  isActive ? "border-primary ring-1 ring-primary" : "border-border hover:border-muted-foreground/50"
                )}
                title={`生成于 ${new Date(item.createdAt).toLocaleString()}`}
              >
                <img
                  src={item.url}
                  alt={`历史 ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-0 right-0 text-[8px] bg-black/50 text-white px-0.5 rounded-tl">
                  #{imageHistory.length - idx}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  if (activeTab === "video") {
    if (videoHistory.length === 0) return null

    const previewItem = previewIndex !== null ? videoHistory[previewIndex] : null

    return (
      <div className="shrink-0 border-t px-4 pt-2 pb-3">
        <div className="flex items-center gap-1.5 mb-2">
          <History className="size-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground font-medium">历史视频</span>
          {previewIndex !== null && (
            <span className="text-[10px] text-primary ml-1">
              正在预览 #{videoHistory.length - previewIndex}
            </span>
          )}
        </div>

        {previewItem && (
          <div className="mb-2 rounded-lg border bg-muted/20 p-1.5">
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0 h-16 flex items-center justify-center bg-black/5 rounded overflow-hidden">
                <video
                  src={previewItem.url}
                  className="max-h-full max-w-full object-contain rounded"
                  playsInline
                  muted
                />
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-[10px] px-2"
                  onClick={() => onRestoreVideo?.(previewItem)}
                >
                  <RotateCcw className="size-3 mr-1" />
                  恢复此版本
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[10px] px-2 text-muted-foreground"
                  onClick={() => setPreviewIndex(null)}
                >
                  <X className="size-3 mr-1" />
                  取消
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          {videoHistory.map((item, idx) => {
            const isActive = previewIndex === idx
            return (
              <button
                key={idx}
                onClick={() => setPreviewIndex(isActive ? null : idx)}
                className={cn(
                  "relative shrink-0 w-12 h-12 rounded-md overflow-hidden border transition-all flex items-center justify-center bg-black",
                  isActive ? "border-primary ring-1 ring-primary" : "border-border hover:border-muted-foreground/50"
                )}
                title={`生成于 ${new Date(item.createdAt).toLocaleString()}`}
              >
                <video
                  src={item.url}
                  className="w-full h-full object-cover opacity-80"
                  muted
                />
                <span className="absolute bottom-0 right-0 text-[8px] bg-black/50 text-white px-0.5 rounded-tl">
                  #{videoHistory.length - idx}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return null
}
