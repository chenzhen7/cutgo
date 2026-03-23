"use client"

import { useState, useMemo, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { BookMarked, Loader2, Sparkles } from "lucide-react"
import type { Chapter } from "@/lib/types"
import { formatChapterOrdinalLabel } from "@/lib/novel-utils"
import { apiFetch } from "@/lib/api-client"

interface ExtractAssetsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  novelId: string
  chapters: Chapter[]
  onSuccess?: (stats: { characterCount: number; sceneCount: number; propCount: number }) => void
}

export function ExtractAssetsDialog({
  open,
  onOpenChange,
  novelId,
  chapters,
  onSuccess,
}: ExtractAssetsDialogProps) {
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([])
  const [extracting, setExtracting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<"skip_existing" | "overwrite">("skip_existing")

  const rows = useMemo(
    () => [...chapters].sort((a, b) => a.index - b.index),
    [chapters]
  )

  useEffect(() => {
    if (!open) return
    setSelectedChapterIds(rows.map((r) => r.id))
    setError(null)
    setMode("skip_existing")
  }, [open, rows])

  const allSelected = useMemo(() => {
    if (!rows.length) return false
    return rows.every((r) => selectedChapterIds.includes(r.id))
  }, [rows, selectedChapterIds])

  const toggleChapter = (chapterId: string) => {
    setSelectedChapterIds((prev) =>
      prev.includes(chapterId) ? prev.filter((id) => id !== chapterId) : [...prev, chapterId]
    )
  }

  const toggleAll = () => {
    setSelectedChapterIds(allSelected ? [] : rows.map((r) => r.id))
  }

  const handleExtract = async () => {
    if (!selectedChapterIds.length) return
    setExtracting(true)
    setError(null)
    try {
      const idSet = new Set(selectedChapterIds)
      const orderedIds = rows.filter((r) => idSet.has(r.id)).map((r) => r.id)
      const data = await apiFetch<{ stats: { characterCount: number; sceneCount: number; propCount: number } }>(
        `/api/novels/${novelId}/extract-assets`,
        { method: "POST", body: { chapterIds: orderedIds, mode } }
      )
      onSuccess?.(data.stats)
      onOpenChange(false)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setExtracting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={extracting ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            提取资产
          </DialogTitle>
          <p className="text-sm text-muted-foreground font-normal pt-1">
            选择章节后，AI 将自动从章节内容中提取角色、场景和道具资产
          </p>
        </DialogHeader>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={toggleAll} disabled={extracting}>
            {allSelected ? "取消全选" : "全选章节"}
          </Button>
        </div>

        <ScrollArea className="max-h-[280px]">
          <div className="flex flex-col gap-1">
            {rows.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">暂无可用章节</p>
            ) : (
              rows.map((chapter) => {
                const checked = selectedChapterIds.includes(chapter.id)
                return (
                  <label
                    key={chapter.id}
                    className="flex items-start gap-3 rounded-md px-3 py-3 hover:bg-muted/50 cursor-pointer transition-colors border border-border/50"
                  >
                    <Checkbox
                      className="mt-0.5"
                      checked={checked}
                      disabled={extracting}
                      onCheckedChange={() => toggleChapter(chapter.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <BookMarked className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="text-sm font-medium truncate min-w-0 flex-1">
                          {formatChapterOrdinalLabel(chapter.index)}
                          {chapter.title?.trim() ? ` ${chapter.title.trim()}` : ""}
                        </span>
                        {chapter.wordCount != null && chapter.wordCount > 0 && (
                          <Badge
                            variant="outline"
                            className="text-[9px] px-1.5 py-0 h-4 shrink-0 text-muted-foreground"
                          >
                            {chapter.wordCount.toLocaleString()} 字
                          </Badge>
                        )}
                      </div>
                    </div>
                  </label>
                )
              })
            )}
          </div>
        </ScrollArea>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>已选 {selectedChapterIds.length} 个章节</span>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <Checkbox
                checked={mode === "overwrite"}
                disabled={extracting}
                onCheckedChange={(v) => setMode(v ? "overwrite" : "skip_existing")}
              />
              <span className="text-xs">覆盖已有资产</span>
            </label>
          </div>
        </div>

        {error && (
          <p className="text-xs text-destructive bg-destructive/5 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={extracting}
          >
            取消
          </Button>
          <Button
            onClick={() => void handleExtract()}
            disabled={selectedChapterIds.length === 0 || extracting}
          >
            {extracting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                提取中...
              </>
            ) : (
              <>
                提取资产
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
