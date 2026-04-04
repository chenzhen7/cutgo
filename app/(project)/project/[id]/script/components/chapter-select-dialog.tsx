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
import { AlertTriangle, Film, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { Episode } from "@/lib/types"
import { buildEpisodeDisplayNumberMap } from "@/lib/episode-display"

interface ChapterSelectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  episodes: Episode[]
  /** 按列表顺序传递所选分集 ID */
  onGenerate: (episodeIdsOrdered: string[]) => void | Promise<void>
}

export function ChapterSelectDialog({
  open,
  onOpenChange,
  episodes,
  onGenerate,
}: ChapterSelectDialogProps) {
  const [selectedEpisodeIds, setSelectedEpisodeIds] = useState<string[]>([])

  const sortedEpisodes = useMemo(
    () => [...episodes].sort((a, b) => a.index - b.index),
    [episodes]
  )

  const episodeDisplayMap = useMemo(
    () => buildEpisodeDisplayNumberMap(sortedEpisodes),
    [sortedEpisodes]
  )

  const allSelected = useMemo(() => {
    if (!sortedEpisodes.length) return false
    const set = new Set(selectedEpisodeIds)
    return sortedEpisodes.every((ep) => set.has(ep.id))
  }, [sortedEpisodes, selectedEpisodeIds])

  const hasOverwriteRisk = useMemo(() => {
    const set = new Set(selectedEpisodeIds)
    return sortedEpisodes.some((ep) => set.has(ep.id) && !!ep.script)
  }, [sortedEpisodes, selectedEpisodeIds])

  const toggleEpisode = (episodeId: string) => {
    setSelectedEpisodeIds((prev) =>
      prev.includes(episodeId)
        ? prev.filter((x) => x !== episodeId)
        : [...prev, episodeId]
    )
  }

  const toggleSelectAll = () => {
    const allIds = sortedEpisodes.map((ep) => ep.id)
    const set = new Set(selectedEpisodeIds)
    const everySelected = allIds.every((id) => set.has(id))
    setSelectedEpisodeIds(everySelected ? [] : allIds)
  }

  const selectUngenerated = () => {
    setSelectedEpisodeIds(
      sortedEpisodes
        .filter((ep) => !ep.script)
        .map((ep) => ep.id)
    )
  }

  const handleGenerate = async () => {
    const set = new Set(selectedEpisodeIds)
    const orderedIds = sortedEpisodes
      .filter((ep) => set.has(ep.id))
      .map((ep) => ep.id)
    if (orderedIds.length === 0) return

    setSelectedEpisodeIds([])
    onOpenChange(false)

    try {
      await onGenerate(orderedIds)
    } catch {
      /* 失败由页面 toast 处理；弹窗已关闭 */
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] !flex !flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>选择要生成剧本的分集</DialogTitle>
          <p className="text-sm text-muted-foreground font-normal pt-1">
            已选分集将依次生成剧本；每集会使用对应的大纲与原文内容
          </p>
        </DialogHeader>

        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Button variant="outline" size="sm" onClick={toggleSelectAll}>
            {allSelected ? "取消全选" : "全选分集"}
          </Button>
          <Button variant="outline" size="sm" onClick={selectUngenerated}>
            仅选未生成剧本的分集
          </Button>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="flex flex-col gap-1">
            {sortedEpisodes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">暂无分集</p>
            ) : (
              sortedEpisodes.map((ep) => {
                const checked = selectedEpisodeIds.includes(ep.id)
                const hasScript = !!ep.script
                const displayNum = episodeDisplayMap.get(ep.id) ?? 1
                return (
                  <label
                    key={ep.id}
                    className="flex items-start gap-3 rounded-md px-3 py-2.5 hover:bg-muted/50 cursor-pointer transition-colors border border-border/50"
                  >
                    <Checkbox
                      className="mt-0.5"
                      checked={checked}
                      onCheckedChange={() => toggleEpisode(ep.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[11px] text-muted-foreground shrink-0">
                          第{displayNum}集
                        </span>
                        <span className="text-sm font-medium truncate min-w-0 flex-1">
                          {ep.title}
                        </span>
                        {hasScript && (
                          <Badge
                            variant="secondary"
                            className="text-[9px] px-1.5 py-0 h-4 gap-0.5 shrink-0"
                          >
                            <FileText className="size-2.5" />
                            已生成
                          </Badge>
                        )}
                      </div>
                      {ep.outline?.trim() && (
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                          {ep.outline}
                        </p>
                      )}
                    </div>
                  </label>
                )
              })
            )}
          </div>
        </ScrollArea>

        <div className="text-sm text-muted-foreground">
          已选 {selectedEpisodeIds.length} 集
        </div>
        {hasOverwriteRisk && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
            <AlertTriangle className="size-3.5 shrink-0" />
            所选分集中已有剧本的将被覆盖
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={() => void handleGenerate()}
            disabled={selectedEpisodeIds.length === 0}
          >
            <Film className="size-4" />
            生成剧本
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
