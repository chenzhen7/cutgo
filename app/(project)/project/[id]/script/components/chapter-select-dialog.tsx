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
import { AlertTriangle, Film, BookMarked } from "lucide-react"
import type { Episode, Script } from "@/lib/types"

interface ChapterRow {
  chapterId: string
  chapter: Episode["chapter"]
  label: string
  episodes: Episode[]
  episodeCount: number
  hasAnyScript: boolean
}

interface ChapterSelectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  episodes: Episode[]
  scripts: Script[]
  /** 根据所选章节，展开为该章节下全部分集 ID（章节顺序 → 集顺序） */
  onGenerate: (episodeIds: string[]) => void
}

export function ChapterSelectDialog({
  open,
  onOpenChange,
  episodes,
  scripts,
  onGenerate,
}: ChapterSelectDialogProps) {
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([])

  const scriptEpisodeIds = useMemo(
    () => new Set(scripts.map((s) => s.episodeId)),
    [scripts]
  )

  const rows = useMemo(() => {
    const groups = new Map<
      string,
      { chapter: Episode["chapter"]; episodes: Episode[] }
    >()
    for (const ep of episodes) {
      const key = ep.chapterId
      if (!groups.has(key)) {
        groups.set(key, { chapter: ep.chapter, episodes: [] })
      }
      groups.get(key)!.episodes.push(ep)
    }
    for (const g of groups.values()) {
      g.episodes.sort((a, b) => a.index - b.index)
    }
    const sorted = Array.from(groups.values()).sort(
      (a, b) => a.chapter.index - b.chapter.index
    )

    return sorted.map((g): ChapterRow => {
      const chapterLabel =
        g.chapter.title?.trim() || `第 ${g.chapter.index} 章`
      let hasAnyScript = false
      for (const ep of g.episodes) {
        if (scriptEpisodeIds.has(ep.id)) {
          hasAnyScript = true
          break
        }
      }
      return {
        chapterId: g.chapter.id,
        chapter: g.chapter,
        label: chapterLabel,
        episodes: g.episodes,
        episodeCount: g.episodes.length,
        hasAnyScript,
      }
    })
  }, [episodes, scriptEpisodeIds])

  const episodeCountSelected = useMemo(() => {
    const set = new Set(selectedChapterIds)
    let n = 0
    for (const r of rows) {
      if (set.has(r.chapterId)) n += r.episodeCount
    }
    return n
  }, [rows, selectedChapterIds])

  const hasOverwriteRisk = useMemo(() => {
    const set = new Set(selectedChapterIds)
    for (const r of rows) {
      if (!set.has(r.chapterId)) continue
      if (r.hasAnyScript) return true
    }
    return false
  }, [rows, selectedChapterIds])

  const toggleChapter = (chapterId: string) => {
    setSelectedChapterIds((prev) =>
      prev.includes(chapterId)
        ? prev.filter((x) => x !== chapterId)
        : [...prev, chapterId]
    )
  }

  const selectAllChapters = () =>
    setSelectedChapterIds(rows.map((r) => r.chapterId))

  /** 至少有一集尚未生成剧本的章节 */
  const selectChaptersWithUngenerated = () =>
    setSelectedChapterIds(
      rows
        .filter((r) => {
          if (r.episodeCount === 0) return false
          return r.episodes.some((ep) => !scriptEpisodeIds.has(ep.id))
        })
        .map((r) => r.chapterId)
    )

  const handleGenerate = () => {
    const idSet = new Set(selectedChapterIds)
    const episodeIds: string[] = []
    for (const r of rows) {
      if (!idSet.has(r.chapterId)) continue
      for (const ep of r.episodes) episodeIds.push(ep.id)
    }
    onGenerate(episodeIds)
    setSelectedChapterIds([])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>选择要生成剧本的章节</DialogTitle>
          <p className="text-sm text-muted-foreground font-normal pt-1">
            每个章节下的所有分集将依次生成；每集会使用该章节原文与对应分场信息
          </p>
        </DialogHeader>

        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Button variant="outline" size="sm" onClick={selectAllChapters}>
            全选章节
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={selectChaptersWithUngenerated}
          >
            仅选有未生成集
          </Button>
        </div>

        <ScrollArea className="max-h-[320px]">
          <div className="flex flex-col gap-1">
            {rows.map((row) => {
              const checked = selectedChapterIds.includes(row.chapterId)
              return (
                <label
                  key={row.chapterId}
                  className="flex items-start gap-3 rounded-md px-3 py-3 hover:bg-muted/50 cursor-pointer transition-colors border border-border/50"
                >
                  <Checkbox
                    className="mt-0.5"
                    checked={checked}
                    onCheckedChange={() => toggleChapter(row.chapterId)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <BookMarked className="size-3.5 shrink-0 text-muted-foreground" />
                      <span className="text-sm font-medium truncate min-w-0 flex-1">
                        第{row.chapter.index}章 {row.label}
                      </span>
                      {row.episodeCount > 0 && (
                        <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                          {row.episodeCount} 集
                        </span>
                      )}
                    </div>
                  </div>
                </label>
              )
            })}
          </div>
        </ScrollArea>

        <div className="text-sm text-muted-foreground">
          已选 {selectedChapterIds.length} 个章节
          {episodeCountSelected > 0
            ? `，共 ${episodeCountSelected} 集将生成`
            : null}
        </div>
        {hasOverwriteRisk && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
            <AlertTriangle className="size-3.5 shrink-0" />
            所选章节中已有剧本的分集将被覆盖
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={selectedChapterIds.length === 0}
          >
            <Film className="size-4" />
            生成剧本
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
