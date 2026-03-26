"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import type { Episode, ScriptShotPlan } from "@/lib/types"
import {
  buildEpisodeDisplayNumberMap,
  sortEpisodesByChapterAndIndex,
} from "@/lib/episode-display"

interface EpisodeSelectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  episodes: Episode[]
  scriptShotPlans: ScriptShotPlan[]
  onGenerate: (episodeIds: string[]) => void
}

export function EpisodeSelectDialog({
  open,
  onOpenChange,
  episodes,
  scriptShotPlans,
  onGenerate,
}: EpisodeSelectDialogProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const orderedEpisodes = useMemo(
    () => sortEpisodesByChapterAndIndex(episodes),
    [episodes]
  )
  const displayNumberById = useMemo(
    () => buildEpisodeDisplayNumberMap(episodes),
    [episodes]
  )

  const toggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const selectAll = () => setSelectedIds(episodes.map((e) => e.id))
  const selectUngenerated = () => {
    const ungeneratedIds = episodes.filter((ep) => {
      const plan = scriptShotPlans.find((sb) => sb.episodeId === ep.id)
      return !plan || plan.shots.length === 0
    }).map((e) => e.id)
    setSelectedIds(ungeneratedIds)
  }

  const getEpisodeStatus = (episode: Episode) => {
    const plan = scriptShotPlans.find((sb) => sb.episodeId === episode.id)
    const shotCount = plan?.shots.length ?? 0
    if (shotCount > 0) return { status: "generated" as const, shotCount }
    if (episode.script) return { status: "partial" as const, shotCount: 0 }
    return { status: "none" as const, shotCount: 0 }
  }

  const handleGenerate = () => {
    if (selectedIds.length === 0) return
    onGenerate(selectedIds)
    onOpenChange(false)
    setSelectedIds([])
  }

  const hasGeneratedSelected = selectedIds.some((id) => {
    const ep = episodes.find((e) => e.id === id)
    return ep ? getEpisodeStatus(ep).status !== "none" : false
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>选择要生成分镜的分集</DialogTitle>
          <DialogDescription>
            选择需要 AI 生成分镜的分集，已有分镜的分集重新生成将覆盖现有数据。
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 mb-3">
          <Button variant="outline" size="sm" onClick={selectAll}>
            全选
          </Button>
          <Button variant="outline" size="sm" onClick={selectUngenerated}>
            仅选未生成
          </Button>
        </div>

        <div className="max-h-64 overflow-y-auto space-y-2">
          {orderedEpisodes.map((ep) => {
            const info = getEpisodeStatus(ep)
            const displayN = displayNumberById.get(ep.id) ?? 1
            return (
              <label
                key={ep.id}
                className="flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  checked={selectedIds.includes(ep.id)}
                  onCheckedChange={() => toggle(ep.id)}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    第{displayN}集 · {ep.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {ep.script ? `${ep.script.length}字剧本` : "无剧本"}
                  </p>
                </div>
                <div>
                  {info.status === "generated" && (
                    <Badge variant="default" className="text-xs bg-green-600">
                      已生成 {info.shotCount}镜头
                    </Badge>
                  )}
                  {info.status === "partial" && (
                    <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                      有剧本
                    </Badge>
                  )}
                  {info.status === "none" && (
                    <Badge variant="outline" className="text-xs">
                      未生成
                    </Badge>
                  )}
                </div>
              </label>
            )
          })}
        </div>

        <div className="text-sm text-muted-foreground">
          已选 {selectedIds.length} 个分集
          {hasGeneratedSelected && (
            <span className="text-amber-600 ml-2">
              已生成的分集重新生成将覆盖现有分镜
            </span>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleGenerate} disabled={selectedIds.length === 0}>
            生成选中分镜
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
