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
import type { Chapter, Episode, Script } from "@/lib/types"

interface ChapterRow {
  chapterId: string
  chapter: Episode["chapter"]
  label: string
  episodes: Episode[]
  episodeCount: number
  hasAnyScript: boolean
}

function chapterHasUngeneratedScript(
  episodes: Episode[],
  scriptEpisodeIds: Set<string>
): boolean {
  if (episodes.length === 0) return false
  return episodes.some((ep) => !scriptEpisodeIds.has(ep.id))
}

interface ChapterSelectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 小说章节（含尚无分集的章节）；为空时仅按分集数据推导章节 */
  chapters?: Chapter[]
  episodes: Episode[]
  scripts: Script[]
  /** 按列表顺序传递所选章节 ID；无分集章节由页面先创建分集再生成 */
  onGenerate: (chapterIdsOrdered: string[]) => void | Promise<void>
}

export function ChapterSelectDialog({
  open,
  onOpenChange,
  chapters = [],
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
    const byChapter = new Map<string, Episode[]>()
    for (const ep of episodes) {
      if (!byChapter.has(ep.chapterId)) byChapter.set(ep.chapterId, [])
      byChapter.get(ep.chapterId)!.push(ep)
    }
    for (const list of byChapter.values()) {
      list.sort((a, b) => a.index - b.index)
    }

    const toRow = (chapter: Episode["chapter"], eps: Episode[]): ChapterRow => {
      const label = chapter.title?.trim() || `第 ${chapter.index} 章`
      let hasAnyScript = false
      for (const ep of eps) {
        if (scriptEpisodeIds.has(ep.id)) {
          hasAnyScript = true
          break
        }
      }
      return {
        chapterId: chapter.id,
        chapter,
        label,
        episodes: eps,
        episodeCount: eps.length,
        hasAnyScript,
      }
    }

    if (!chapters.length) {
      return Array.from(byChapter.values())
        .map((eps) => toRow(eps[0].chapter, eps))
        .sort((a, b) => a.chapter.index - b.chapter.index)
    }

    const novelIds = new Set(chapters.map((c) => c.id))
    const ordered: ChapterRow[] = []
    for (const ch of [...chapters].sort((a, b) => a.index - b.index)) {
      const eps = byChapter.get(ch.id) ?? []
      ordered.push(
        toRow({ id: ch.id, index: ch.index, title: ch.title }, eps)
      )
    }
    for (const [cid, eps] of byChapter) {
      if (!novelIds.has(cid) && eps.length > 0) {
        ordered.push(toRow(eps[0].chapter, eps))
      }
    }
    return ordered
  }, [chapters, episodes, scriptEpisodeIds])

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
        .filter((r) => chapterHasUngeneratedScript(r.episodes, scriptEpisodeIds))
        .map((r) => r.chapterId)
    )

  const handleGenerate = async () => {
    const idSet = new Set(selectedChapterIds)
    const orderedChapterIds = rows
      .filter((r) => idSet.has(r.chapterId))
      .map((r) => r.chapterId)
    try {
      await onGenerate(orderedChapterIds)
      setSelectedChapterIds([])
      onOpenChange(false)
    } catch {
      /* 创建分集等失败由页面 toast，保持弹窗 */
    }
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
            仅选未生成剧本的章节
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
            onClick={() => void handleGenerate()}
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
