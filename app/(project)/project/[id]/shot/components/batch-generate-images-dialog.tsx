"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Shot, ScriptShotPlan, ShotInput } from "@/lib/types"
import { Image as ImageIcon, Loader2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface BatchGenerateImagesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shots: { shot: Shot; scriptShotPlan: ScriptShotPlan }[]
  onConfirm: (shotIds: string[]) => void
  onUpdateShot: (episodeId: string, shotId: string, data: Partial<ShotInput>) => void
  isGenerating: boolean
}

export function BatchGenerateImagesDialog({
  open,
  onOpenChange,
  shots,
  onConfirm,
  onUpdateShot,
  isGenerating,
}: BatchGenerateImagesDialogProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [promptValues, setPromptValues] = useState<Record<string, string>>({})
  const promptDebounceTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const shotMetaMap = useMemo(
    () => new Map(shots.map(({ shot, scriptShotPlan }) => [shot.id, { episodeId: scriptShotPlan.episodeId, originalPrompt: shot.prompt || "" }])),
    [shots]
  )

  useEffect(() => {
    if (open) {
      // 默认选中没有图片的镜头
      const missingIds = new Set(shots.filter((s) => !s.shot.imageUrl).map((s) => s.shot.id))
      setSelectedIds(missingIds)
      setPromptValues(
        Object.fromEntries(shots.map(({ shot }) => [shot.id, shot.prompt || ""]))
      )
    }
  }, [open, shots])

  useEffect(() => {
    return () => {
      promptDebounceTimersRef.current.forEach((timer) => clearTimeout(timer))
      promptDebounceTimersRef.current.clear()
    }
  }, [])

  const handleSelectAll = () => {
    setSelectedIds(new Set(shots.map((s) => s.shot.id)))
  }

  const handleSelectMissing = () => {
    setSelectedIds(new Set(shots.filter((s) => !s.shot.imageUrl).map((s) => s.shot.id)))
  }

  const handleSelectNone = () => {
    setSelectedIds(new Set())
  }

  const toggleShot = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedIds(next)
  }

  const flushPromptUpdates = useCallback(() => {
    promptDebounceTimersRef.current.forEach((timer) => clearTimeout(timer))
    promptDebounceTimersRef.current.clear()

    Object.entries(promptValues).forEach(([shotId, prompt]) => {
      const meta = shotMetaMap.get(shotId)
      if (!meta || prompt === meta.originalPrompt) return
      onUpdateShot(meta.episodeId, shotId, { prompt })
    })
  }, [onUpdateShot, promptValues, shotMetaMap])

  const handlePromptChange = useCallback(
    (shotId: string, prompt: string) => {
      setPromptValues((prev) => ({ ...prev, [shotId]: prompt }))

      const timer = promptDebounceTimersRef.current.get(shotId)
      if (timer) clearTimeout(timer)

      const meta = shotMetaMap.get(shotId)
      if (!meta) return

      const nextTimer = setTimeout(() => {
        onUpdateShot(meta.episodeId, shotId, { prompt })
        promptDebounceTimersRef.current.delete(shotId)
      }, 600)

      promptDebounceTimersRef.current.set(shotId, nextTimer)
    },
    [onUpdateShot, shotMetaMap]
  )

  const handleConfirm = () => {
    flushPromptUpdates()
    onConfirm(Array.from(selectedIds))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>批量生成画面</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 py-2">
          <Button variant="outline" size="sm" onClick={handleSelectAll}>
            全选
          </Button>
          <Button variant="outline" size="sm" onClick={handleSelectMissing}>
            仅选缺失图片
          </Button>
          <Button variant="outline" size="sm" onClick={handleSelectNone}>
            清空
          </Button>
          <span className="text-sm text-muted-foreground ml-auto">
            已选 {selectedIds.size} / {shots.length}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 border rounded-md p-2 space-y-2">
          {shots.map(({ shot, scriptShotPlan }, index) => (
            <div
              key={shot.id}
              className="flex items-start gap-4 p-2 hover:bg-muted/50 rounded-md cursor-pointer"
              onClick={() => toggleShot(shot.id)}
            >
              <div className="pt-2">
                <Checkbox
                  checked={selectedIds.has(shot.id)}
                  onCheckedChange={() => toggleShot(shot.id)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="w-8 pt-2 text-center text-sm text-muted-foreground shrink-0">
                {index + 1}
              </div>
              <div className="w-24 h-24 shrink-0 bg-muted rounded overflow-hidden flex items-center justify-center border mt-1">
                {shot.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={shot.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="size-6 text-muted-foreground/50" />
                )}
              </div>
              <div className="flex-1 min-w-0 flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                <Textarea
                  value={promptValues[shot.id] ?? shot.prompt ?? ""}
                  onChange={(e) => handlePromptChange(shot.id, e.target.value)}
                  placeholder="提示词"
                  className="min-h-[60px] text-sm resize-y"
                  onPointerDown={(e) => e.stopPropagation()}
                />
                <div className="flex items-center gap-2" onPointerDown={(e) => e.stopPropagation()}>
                  <span className="text-xs text-muted-foreground">类型:</span>
                  <Select
                    value={shot.imageType || "keyframe"}
                    onValueChange={(val: any) => onUpdateShot(scriptShotPlan.episodeId, shot.id, { imageType: val })}
                  >
                    <SelectTrigger className="h-7 text-xs w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="keyframe">单图</SelectItem>
                      <SelectItem value="first_last">首尾帧</SelectItem>
                      <SelectItem value="multi_grid">多宫格</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}
          {shots.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              暂无分镜
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}>
            取消
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedIds.size === 0 || isGenerating}
          >
            {isGenerating && <Loader2 className="size-4 mr-2 animate-spin" />}
            生成选中项 ({selectedIds.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
