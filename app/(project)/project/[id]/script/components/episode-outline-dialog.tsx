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
import { BookMarked, Loader2, ListOrdered } from "lucide-react"
import type { Chapter, Episode } from "@/lib/types"
import { parseSourceChapterIds } from "@/lib/episode-source-chapters"
import { formatChapterOrdinalLabel } from "@/lib/novel-utils"

interface EpisodeOutlineDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  chapters?: Chapter[]
  episodes: Episode[]
  onGenerate: (chapterIdsOrdered: string[]) => void | Promise<void>
}

export function EpisodeOutlineDialog({
  open,
  onOpenChange,
  chapters = [],
  episodes,
  onGenerate,
}: EpisodeOutlineDialogProps) {
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([])
  const [generating, setGenerating] = useState(false)

  interface ChapterRow {
    chapterId: string
    chapterIndex: number
    chapterTitle: string | null
    hasEpisode: boolean
  }

  const rows = useMemo((): ChapterRow[] => {
    const touchCount = new Map<string, Set<string>>()
    for (const ep of episodes) {
      for (const cid of parseSourceChapterIds(ep)) {
        if (!touchCount.has(cid)) touchCount.set(cid, new Set())
        touchCount.get(cid)!.add(ep.id)
      }
    }

    return [...chapters]
      .sort((a, b) => a.index - b.index)
      .map((ch) => {
        const ids = touchCount.get(ch.id)
        return {
          chapterId: ch.id,
          chapterIndex: ch.index,
          chapterTitle: ch.title,
          hasEpisode: (ids?.size ?? 0) > 0,
        }
      })
  }, [chapters, episodes])

  useEffect(() => {
    if (!open) return
    setSelectedChapterIds(
      rows.filter((r) => !r.hasEpisode).map((r) => r.chapterId)
    )
  }, [open, rows])

  const allSelected = useMemo(() => {
    const allIds = rows.map((r) => r.chapterId)
    if (!allIds.length) return false
    return allIds.every((id) => selectedChapterIds.includes(id))
  }, [rows, selectedChapterIds])

  const toggleChapter = (chapterId: string) => {
    setSelectedChapterIds((prev) =>
      prev.includes(chapterId)
        ? prev.filter((id) => id !== chapterId)
        : [...prev, chapterId]
    )
  }

  const toggleAll = () => {
    const allIds = rows.map((r) => r.chapterId)
    setSelectedChapterIds(allSelected ? [] : allIds)
  }

  const selectChaptersWithoutEpisode = () => {
    setSelectedChapterIds(rows.filter((r) => !r.hasEpisode).map((r) => r.chapterId))
  }

  const handleGenerate = async () => {
    const idSet = new Set(selectedChapterIds)
    const orderedChapterIds = rows
      .filter((r) => idSet.has(r.chapterId))
      .map((r) => r.chapterId)
    if (!orderedChapterIds.length) return
    setGenerating(true)
    try {
      await onGenerate(orderedChapterIds)
      setSelectedChapterIds([])
      onOpenChange(false)
    } catch {
      // error handled by parent toast
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={generating ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListOrdered className="size-4 text-primary" />
            生成分集大纲
          </DialogTitle>
          <p className="text-sm text-muted-foreground font-normal pt-1">
            按章节选择：将为本集涵盖所选章节的分集生成大纲；一集可涵盖多章，已创建分集的章节会标记
          </p>
        </DialogHeader>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={toggleAll} disabled={generating}>
            {allSelected ? "取消全选" : "全选章节"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={selectChaptersWithoutEpisode}
            disabled={generating}
          >
            仅选尚无分集的章节
          </Button>
        </div>

        <ScrollArea className="max-h-[320px]">
          <div className="flex flex-col gap-1">
            {rows.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">暂无可用章节</p>
            ) : (
              rows.map((row) => {
                const checked = selectedChapterIds.includes(row.chapterId)
                return (
                  <label
                    key={row.chapterId}
                    className="flex items-start gap-3 rounded-md px-3 py-3 hover:bg-muted/50 cursor-pointer transition-colors border border-border/50"
                  >
                    <Checkbox
                      className="mt-0.5"
                      checked={checked}
                      disabled={generating}
                      onCheckedChange={() => toggleChapter(row.chapterId)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <BookMarked className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="text-sm font-medium truncate min-w-0 flex-1">
                          {formatChapterOrdinalLabel(row.chapterIndex)}
                          {row.chapterTitle?.trim()
                            ? ` ${row.chapterTitle.trim()}`
                            : ""}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {row.hasEpisode && (
                            <Badge
                              variant="default"
                              className="text-[9px] px-1.5 py-0 h-4 gap-0.5 bg-primary/15 text-primary border-0"
                            >
                              已有分集
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </label>
                )
              })
            )}
          </div>
        </ScrollArea>

        <div className="text-sm text-muted-foreground">
          已选 {selectedChapterIds.length} 个章节
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={generating}
          >
            取消
          </Button>
          <Button
            onClick={() => void handleGenerate()}
            disabled={selectedChapterIds.length === 0 || generating}
          >
            {generating ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <ListOrdered className="size-4" />
                生成大纲
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
