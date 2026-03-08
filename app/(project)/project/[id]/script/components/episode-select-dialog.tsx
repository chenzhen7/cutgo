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
import { CheckCircle2, Circle, AlertTriangle, Film } from "lucide-react"
import type { Episode, Script } from "@/lib/types"

interface EpisodeSelectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  episodes: Episode[]
  scripts: Script[]
  onGenerate: (episodeIds: string[]) => void
}

export function EpisodeSelectDialog({
  open,
  onOpenChange,
  episodes,
  scripts,
  onGenerate,
}: EpisodeSelectDialogProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const scriptEpisodeIds = useMemo(
    () => new Set(scripts.map((s) => s.episodeId)),
    [scripts]
  )

  const scriptWordCount = useMemo(() => {
    const map = new Map<string, number>()
    for (const s of scripts) {
      map.set(s.episodeId, s.content.length)
    }
    return map
  }, [scripts])

  const hasExistingSelected = selectedIds.some((id) => scriptEpisodeIds.has(id))

  const toggleEpisode = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const selectAll = () => setSelectedIds(episodes.map((ep) => ep.id))
  const selectUngenerated = () =>
    setSelectedIds(
      episodes.filter((ep) => !scriptEpisodeIds.has(ep.id)).map((ep) => ep.id)
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
          <DialogTitle>选择要生成剧本的分集</DialogTitle>
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
            {episodes.map((ep) => {
              const hasScript = scriptEpisodeIds.has(ep.id)
              const wordCount = scriptWordCount.get(ep.id) || 0
              const isChecked = selectedIds.includes(ep.id)

              return (
                <label
                  key={ep.id}
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => toggleEpisode(ep.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">
                        {ep.title}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {hasScript ? (
                      <Badge variant="secondary" className="gap-1 text-xs">
                        <CheckCircle2 className="size-3 text-green-500" />
                        已生成 {wordCount}字
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
          已选 {selectedIds.length} 个分集
        </div>
        {hasExistingSelected && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
            <AlertTriangle className="size-3.5" />
            已生成的分集重新生成将覆盖现有剧本
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleGenerate} disabled={selectedIds.length === 0}>
            <Film className="size-4" />
            生成选中剧本
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
