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
import { FileText, Loader2, Sparkles } from "lucide-react"
import type { Episode, Script } from "@/lib/types"
import { buildEpisodeDisplayNumberMap } from "@/lib/episode-display"

interface EpisodeOutlineDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  episodes: Episode[]
  scripts: Script[]
  onGenerate: (episodeIds: string[]) => void | Promise<void>
}

export function EpisodeOutlineDialog({
  open,
  onOpenChange,
  episodes,
  scripts,
  onGenerate,
}: EpisodeOutlineDialogProps) {
  const [selectedEpisodeIds, setSelectedEpisodeIds] = useState<string[]>([])
  const [generating, setGenerating] = useState(false)

  const scriptEpisodeIds = useMemo(
    () => new Set(scripts.map((s) => s.episodeId)),
    [scripts]
  )

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
    return sortedEpisodes.some(
      (ep) => set.has(ep.id) && !!ep.outline?.trim()
    )
  }, [sortedEpisodes, selectedEpisodeIds])

  const toggleEpisode = (episodeId: string) => {
    setSelectedEpisodeIds((prev) =>
      prev.includes(episodeId)
        ? prev.filter((id) => id !== episodeId)
        : [...prev, episodeId]
    )
  }

  const toggleAll = () => {
    const allIds = sortedEpisodes.map((ep) => ep.id)
    setSelectedEpisodeIds(allSelected ? [] : allIds)
  }

  const selectWithoutOutline = () => {
    setSelectedEpisodeIds(
      sortedEpisodes
        .filter((ep) => !ep.outline?.trim())
        .map((ep) => ep.id)
    )
  }

  const handleGenerate = async () => {
    const set = new Set(selectedEpisodeIds)
    const episodeIds = sortedEpisodes
      .filter((ep) => set.has(ep.id))
      .map((ep) => ep.id)

    if (!episodeIds.length) return
    setGenerating(true)
    try {
      await onGenerate(episodeIds)
      setSelectedEpisodeIds([])
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
            选择分集，AI 将为所选分集生成大纲内容
          </p>
        </DialogHeader>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={toggleAll} disabled={generating}>
            {allSelected ? "取消全选" : "全选分集"}
          </Button>
          <Button variant="outline" size="sm" onClick={selectWithoutOutline} disabled={generating}>
            仅选未生成的分集
          </Button>
        </div>

        <ScrollArea className="max-h-[320px]">
          <div className="flex flex-col gap-1">
            {sortedEpisodes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">暂无分集</p>
            ) : (
              sortedEpisodes.map((ep) => {
                const checked = selectedEpisodeIds.includes(ep.id)
                const hasOutline = !!ep.outline?.trim()
                const displayNum = episodeDisplayMap.get(ep.id) ?? 1
                return (
                  <label
                    key={ep.id}
                    className="flex items-start gap-3 rounded-md px-3 py-2.5 hover:bg-muted/50 cursor-pointer transition-colors border border-border/50"
                  >
                    <Checkbox
                      className="mt-0.5"
                      checked={checked}
                      disabled={generating}
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
                        {hasOutline && (
                          <Badge
                            variant="secondary"
                            className="text-[9px] px-1.5 py-0 h-4 gap-0.5 shrink-0"
                          >
                            <FileText className="size-2.5" />
                            已有大纲
                          </Badge>
                        )}
                      </div>
                      {hasOutline && (
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
          已选 {selectedEpisodeIds.length} 集将生成大纲
        </div>
        {hasOverwriteRisk && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            所选分集中已有大纲的将被覆盖
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
            disabled={selectedEpisodeIds.length === 0 || generating}
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
