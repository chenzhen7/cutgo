"use client"

import { useState, useMemo } from "react"
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
import { BookMarked, FileText, Loader2, Sparkles } from "lucide-react"
import type { Chapter, Episode, Script } from "@/lib/types"

interface EpisodeOutlineDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  chapters?: Chapter[]
  episodes: Episode[]
  scripts: Script[]
  onGenerate: (episodeIds: string[]) => void | Promise<void>
}

export function EpisodeOutlineDialog({
  open,
  onOpenChange,
  chapters = [],
  episodes,
  scripts,
  onGenerate,
}: EpisodeOutlineDialogProps) {
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([])
  const [generating, setGenerating] = useState(false)

  const scriptEpisodeIds = useMemo(
    () => new Set(scripts.map((s) => s.episodeId)),
    [scripts]
  )

  interface ChapterRow {
    chapterId: string
    chapterIndex: number
    chapterTitle: string | null
    label: string
    episodes: Episode[]
    hasOutline: boolean
  }

  const rows = useMemo((): ChapterRow[] => {
    const byChapter = new Map<string, Episode[]>()
    for (const ep of episodes) {
      if (!byChapter.has(ep.chapterId)) byChapter.set(ep.chapterId, [])
      byChapter.get(ep.chapterId)!.push(ep)
    }

    if (!chapters.length) {
      return Array.from(byChapter.values())
        .map((eps) => {
          const first = eps[0]
          const sorted = [...eps].sort((a, b) => a.index - b.index)
          return {
            chapterId: first.chapterId,
            chapterIndex: first.chapter.index,
            chapterTitle: first.chapter.title,
            label: first.chapter.title?.trim() || `第 ${first.chapter.index} 章`,
            episodes: sorted,
            hasOutline: sorted.some((ep) => !!ep.outline?.trim()),
          }
        })
        .sort((a, b) => a.chapterIndex - b.chapterIndex)
    }

    const novelIds = new Set(chapters.map((c) => c.id))
    const ordered: ChapterRow[] = []

    for (const ch of [...chapters].sort((a, b) => a.index - b.index)) {
      const eps = (byChapter.get(ch.id) ?? []).sort((a, b) => a.index - b.index)
      ordered.push({
        chapterId: ch.id,
        chapterIndex: ch.index,
        chapterTitle: ch.title,
        label: ch.title?.trim() || `第 ${ch.index} 章`,
        episodes: eps,
        hasOutline: eps.some((ep) => !!ep.outline?.trim()),
      })
    }

    for (const [cid, eps] of byChapter) {
      if (!novelIds.has(cid) && eps.length > 0) {
        const sorted = [...eps].sort((a, b) => a.index - b.index)
        const first = sorted[0]
        ordered.push({
          chapterId: cid,
          chapterIndex: first.chapter.index,
          chapterTitle: first.chapter.title,
          label: first.chapter.title?.trim() || `第 ${first.chapter.index} 章`,
          episodes: sorted,
          hasOutline: sorted.some((ep) => !!ep.outline?.trim()),
        })
      }
    }

    return ordered
  }, [chapters, episodes])

  const allSelected = useMemo(() => {
    const allIds = rows.map((r) => r.chapterId)
    if (!allIds.length) return false
    return allIds.every((id) => selectedChapterIds.includes(id))
  }, [rows, selectedChapterIds])

  const totalEpisodesSelected = useMemo(() => {
    const set = new Set(selectedChapterIds)
    return rows
      .filter((r) => set.has(r.chapterId))
      .reduce((n, r) => n + r.episodes.length, 0)
  }, [rows, selectedChapterIds])

  const hasOverwriteRisk = useMemo(() => {
    const set = new Set(selectedChapterIds)
    return rows.some((r) => set.has(r.chapterId) && r.hasOutline)
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

  const selectWithoutOutline = () => {
    setSelectedChapterIds(
      rows.filter((r) => !r.hasOutline).map((r) => r.chapterId)
    )
  }

  const handleGenerate = async () => {
    const set = new Set(selectedChapterIds)
    const episodeIds = rows
      .filter((r) => set.has(r.chapterId))
      .flatMap((r) => r.episodes.map((ep) => ep.id))

    if (!episodeIds.length) return
    setGenerating(true)
    try {
      await onGenerate(episodeIds)
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
            <Sparkles className="size-4 text-primary" />
            生成分集大纲
          </DialogTitle>
          <p className="text-sm text-muted-foreground font-normal pt-1">
            选择章节，AI 将为该章节下的所有分集生成大纲内容
          </p>
        </DialogHeader>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={toggleAll} disabled={generating}>
            {allSelected ? "取消全选" : "全选章节"}
          </Button>
          <Button variant="outline" size="sm" onClick={selectWithoutOutline} disabled={generating}>
            仅选未生成的章节
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
                          第{row.chapterIndex}章 {row.label}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {row.episodes.length > 0 && (
                            <span className="text-xs text-muted-foreground tabular-nums">
                              {row.episodes.length} 集
                            </span>
                          )}
                          {row.hasOutline && (
                            <Badge
                              variant="secondary"
                              className="text-[9px] px-1.5 py-0 h-4 gap-0.5"
                            >
                              <FileText className="size-2.5" />
                              已有大纲
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
          {totalEpisodesSelected > 0
            ? `，共 ${totalEpisodesSelected} 集将生成大纲`
            : null}
        </div>
        {hasOverwriteRisk && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            所选章节中已有大纲的分集将被覆盖
          </p>
        )}

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
                <Sparkles className="size-4" />
                生成大纲
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
