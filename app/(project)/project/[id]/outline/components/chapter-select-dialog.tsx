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
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CheckCircle2, Circle, AlertTriangle } from "lucide-react"
import type { Chapter, Episode } from "@/lib/types"

interface ChapterSelectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  chapters: Chapter[]
  episodes: Episode[]
  onGenerate: (chapterIds: string[]) => void
}

export function ChapterSelectDialog({
  open,
  onOpenChange,
  chapters,
  episodes,
  onGenerate,
}: ChapterSelectDialogProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const selectedChapters = chapters.filter((ch) => ch.selected)

  const chapterEpisodeCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const ep of episodes) {
      map.set(ep.chapterId, (map.get(ep.chapterId) || 0) + 1)
    }
    return map
  }, [episodes])

  const hasExistingSelected = selectedIds.some((id) => chapterEpisodeCounts.has(id))

  const toggleChapter = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const selectAll = () => setSelectedIds(selectedChapters.map((ch) => ch.id))
  const selectUngenerated = () =>
    setSelectedIds(
      selectedChapters.filter((ch) => !chapterEpisodeCounts.has(ch.id)).map((ch) => ch.id)
    )

  const handleGenerate = () => {
    onGenerate(selectedIds)
    setSelectedIds([])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>选择要生成大纲的章节</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 mb-3">
          <Button variant="outline" size="sm" onClick={selectAll}>
            全选
          </Button>
          <Button variant="outline" size="sm" onClick={selectUngenerated}>
            仅选未生成
          </Button>
        </div>

        <ScrollArea className="max-h-[320px]">
          <div className="flex flex-col gap-1">
            {selectedChapters.map((ch) => {
              const count = chapterEpisodeCounts.get(ch.id) || 0
              const hasEpisodes = count > 0
              const isChecked = selectedIds.includes(ch.id)

              return (
                <label
                  key={ch.id}
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => toggleChapter(ch.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">
                        {ch.title || `第${ch.index + 1}章`}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({ch.wordCount.toLocaleString()}字)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {hasEpisodes ? (
                      <Badge variant="secondary" className="gap-1 text-xs">
                        <CheckCircle2 className="size-3 text-green-500" />
                        已生成 {count}集
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-xs opacity-60">
                        <Circle className="size-3" />
                        未生成
                      </Badge>
                    )}
                  </div>
                </label>
              )
            })}
          </div>
        </ScrollArea>

        <div className="text-sm text-muted-foreground">
          已选 {selectedIds.length} 个章节
        </div>
        {hasExistingSelected && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
            <AlertTriangle className="size-3.5" />
            已生成的章节重新生成将覆盖现有大纲
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleGenerate} disabled={selectedIds.length === 0}>
            生成选中章节
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
