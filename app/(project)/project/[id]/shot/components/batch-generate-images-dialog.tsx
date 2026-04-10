"use client"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Shot } from "@/lib/types"
import { Image as ImageIcon, Loader2 } from "lucide-react"

interface BatchGenerateImagesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shots: Shot[]
  onConfirm: (shotIds: string[]) => void
  isGenerating: boolean
}

export function BatchGenerateImagesDialog({
  open,
  onOpenChange,
  shots,
  onConfirm,
  isGenerating,
}: BatchGenerateImagesDialogProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (open) {
      // 默认选中没有图片的镜头
      const missingIds = new Set(shots.filter((s) => !s.imageUrl).map((s) => s.id))
      setSelectedIds(missingIds)
    }
  }, [open, shots])

  const handleSelectAll = () => {
    setSelectedIds(new Set(shots.map((s) => s.id)))
  }

  const handleSelectMissing = () => {
    setSelectedIds(new Set(shots.filter((s) => !s.imageUrl).map((s) => s.id)))
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

  const handleConfirm = () => {
    onConfirm(Array.from(selectedIds))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
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
          {shots.map((shot, index) => (
            <div
              key={shot.id}
              className="flex items-center gap-4 p-2 hover:bg-muted/50 rounded-md cursor-pointer"
              onClick={() => toggleShot(shot.id)}
            >
              <Checkbox
                checked={selectedIds.has(shot.id)}
                onCheckedChange={() => toggleShot(shot.id)}
                onClick={(e) => e.stopPropagation()}
              />
              <div className="w-8 text-center text-sm text-muted-foreground shrink-0">
                {index + 1}
              </div>
              <div className="w-16 h-16 shrink-0 bg-muted rounded overflow-hidden flex items-center justify-center border">
                {shot.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={shot.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="size-6 text-muted-foreground/50" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {shot.prompt || "无提示词"}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  类型: {shot.imageType === "multi_grid" ? "多宫格" : shot.imageType === "first_last" ? "首尾帧" : "单图"}
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
