"use client"

import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { IMAGE_TYPE_OPTIONS, GRID_LAYOUT_OPTIONS } from "@/lib/types"
import type { ImageType, GridLayout } from "@/lib/types"
import { AlertTriangle } from "lucide-react"

interface GenerateShotTypeDialogProps {
  open: boolean
  hasExistingShots: boolean
  defaultShotType?: ImageType
  onCancel: () => void
  onConfirm: (imageType: ImageType, gridLayout: GridLayout | null) => void
}

export function GenerateShotTypeDialog({
  open,
  hasExistingShots,
  defaultShotType = "keyframe",
  onCancel,
  onConfirm,
}: GenerateShotTypeDialogProps) {
  const [selectedType, setSelectedType] = useState<ImageType>(defaultShotType)
  const [selectedGridLayout, setSelectedGridLayout] = useState<GridLayout>("2x2")

  // 当 defaultShotType 变化或打开弹窗时，重置选择
  React.useEffect(() => {
    if (open) {
      setSelectedType(defaultShotType)
    }
  }, [open, defaultShotType])

  const handleConfirm = () => {
    onConfirm(selectedType, selectedType === "multi_grid" ? selectedGridLayout : null)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-semibold">生成分镜</DialogTitle>
          <DialogDescription>
            为该分集生成分镜画面，请选择分镜类型
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold  uppercase tracking-wider">分镜类型</Label>

            <Select
              value={selectedType}
              onValueChange={(value) => setSelectedType(value as ImageType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="请选择分镜类型" />
              </SelectTrigger>
              <SelectContent>
                {IMAGE_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {IMAGE_TYPE_OPTIONS.find((opt) => opt.value === selectedType)?.description}
            </p>
          </div>

          {/* 多宫格布局选择 */}
          {selectedType === "multi_grid" && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider">宫格布局</Label>
              <Select
                value={selectedGridLayout}
                onValueChange={(value) => setSelectedGridLayout(value as GridLayout)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择宫格布局" />
                </SelectTrigger>
                <SelectContent>
                  {GRID_LAYOUT_OPTIONS.map((layout) => (
                    <SelectItem key={layout.value} value={layout.value}>
                      {layout.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 覆盖警告 */}
          {hasExistingShots && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
              <p className="text-xs text-destructive">
                当前分集已有分镜，重新生成将<span className="font-semibold">永久删除</span>所有现有镜头、画面及视频，且无法恢复。
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            取消
          </Button>
          <Button
            onClick={handleConfirm}
            variant={hasExistingShots ? "destructive" : "default"}
          >
            {hasExistingShots ? "确认重新生成" : "开始生成"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
