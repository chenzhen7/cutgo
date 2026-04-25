"use client"

import { useState, useEffect, useRef, useMemo, useCallback, memo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Shot, ScriptShotPlan, ShotInput, GRID_LAYOUT_OPTIONS } from "@/lib/types"
import { Image as ImageIcon, Loader2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// ─── 行级 memo 组件：仅在自身相关 props 变化时重渲染 ───────────────────────

interface ShotRowProps {
  shot: Shot
  scriptShotPlan: ScriptShotPlan
  index: number
  isSelected: boolean
  isGeneratingImage: boolean
  contentValue: string
  lastContentValue: string
  onToggle: (id: string) => void
  onContentChange: (shotId: string, value: string) => void
  onLastContentChange: (shotId: string, value: string) => void
  onUpdateShot: (episodeId: string, shotId: string, data: Partial<ShotInput>) => void
}

const ShotRow = memo(function ShotRow({
  shot,
  scriptShotPlan,
  index,
  isSelected,
  isGeneratingImage,
  contentValue,
  lastContentValue,
  onToggle,
  onContentChange,
  onLastContentChange,
  onUpdateShot,
}: ShotRowProps) {
  const imageType = shot.imageType || "keyframe"

  const handleGridLayoutChange = (layout: string) => {
    onUpdateShot(scriptShotPlan.episodeId, shot.id, {
      gridLayout: layout as ShotInput["gridLayout"],
    })
  }

  return (
    <div
      className={`flex items-start gap-4 p-2 rounded-md cursor-pointer ${isGeneratingImage ? "opacity-50 grayscale" : "hover:bg-muted/50"}`}
      onClick={() => {
        if (!isGeneratingImage) onToggle(shot.id)
      }}
    >
      <div className="pt-2">
        <Checkbox
          checked={isSelected}
          disabled={isGeneratingImage}
          onCheckedChange={() => {
            if (!isGeneratingImage) onToggle(shot.id)
          }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      <div className="w-8 pt-2 text-center text-sm text-muted-foreground shrink-0">
        {index + 1}
      </div>
      <div className="w-24 h-24 shrink-0 bg-muted rounded overflow-hidden flex items-center justify-center border mt-1 relative">
        {isGeneratingImage ? (
          <div className="flex flex-col items-center justify-center gap-2 w-full h-full bg-muted/50 px-1">
            <Loader2 className="size-8 animate-spin text-primary" />
            <span className="text-xs font-medium text-muted-foreground text-center leading-tight">生成中</span>
          </div>
        ) : imageType === "first_last" ? (
          <div className="flex flex-row gap-0.5 w-full h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shot.imageUrl || ""} alt="首帧" className="w-1/2 h-full object-cover" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shot.lastFrameUrl || ""} alt="尾帧" className="w-1/2 h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-black/40 text-white text-[8px] px-1 py-0.5 rounded">首尾帧</div>
            </div>
          </div>
        ) : shot.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shot.imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <ImageIcon className="size-6 text-muted-foreground/50" />
        )}
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
        {imageType === "first_last" ? (
          <div className="grid grid-cols-2 gap-2">
            <Textarea
              value={contentValue}
              onChange={(e) => onContentChange(shot.id, e.target.value)}
              placeholder="分镜描述（首帧）"
              className="min-h-[60px] text-sm resize-y"
              onPointerDown={(e) => e.stopPropagation()}
            />
            <Textarea
              value={lastContentValue}
              onChange={(e) => onLastContentChange(shot.id, e.target.value)}
              placeholder="尾帧分镜描述（留空则使用首帧）"
              className="min-h-[60px] text-sm resize-y"
              onPointerDown={(e) => e.stopPropagation()}
            />
          </div>
        ) : (
          <Textarea
            value={contentValue}
            onChange={(e) => onContentChange(shot.id, e.target.value)}
            placeholder="分镜描述"
            className="min-h-[60px] text-sm resize-y"
            onPointerDown={(e) => e.stopPropagation()}
          />
        )}
        <div className="flex items-center gap-2" onPointerDown={(e) => e.stopPropagation()}>
          <span className="text-xs text-muted-foreground">类型:</span>
          <Select
            value={imageType}
            onValueChange={(val: string) => onUpdateShot(scriptShotPlan.episodeId, shot.id, { imageType: val as ShotInput["imageType"] })}
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

          {imageType === "multi_grid" && (
            <>
              <span className="text-xs text-muted-foreground ml-2">布局:</span>
              <Select
                value={shot.gridLayout || "2x2"}
                onValueChange={handleGridLayoutChange}
              >
                <SelectTrigger className="h-7 text-xs w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GRID_LAYOUT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
        </div>
      </div>
    </div>
  )
})

// ─── 对话框主体 ─────────────────────────────────────────────────────────────

interface BatchGenerateImagesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shots: { shot: Shot; scriptShotPlan: ScriptShotPlan }[]
  onConfirm: (shotIds: string[]) => void
  onUpdateShot: (episodeId: string, shotId: string, data: Partial<ShotInput>) => void
  imageGeneratingIds: Set<string>
}

export function BatchGenerateImagesDialog({
  open,
  onOpenChange,
  shots,
  onConfirm,
  onUpdateShot,
  imageGeneratingIds,
}: BatchGenerateImagesDialogProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [contentValues, setContentValues] = useState<Record<string, string>>({})
  const [lastContentValues, setLastContentValues] = useState<Record<string, string>>({})
  const [confirming, setConfirming] = useState(false)
  const contentDebounceTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const lastContentDebounceTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const shotMetaMap = useMemo(
    () => new Map(shots.map(({ shot, scriptShotPlan }) => [
      shot.id,
      {
        episodeId: scriptShotPlan.episodeId,
        originalContent: shot.content || "",
        originalLastContent: shot.lastContent || "",
      },
    ])),
    [shots]
  )

  useEffect(() => {
    if (open) {
      const missingIds = new Set(shots.filter((s) => !s.shot.imageUrl && !imageGeneratingIds.has(s.shot.id)).map((s) => s.shot.id))
      setSelectedIds(missingIds)
      setContentValues(Object.fromEntries(shots.map(({ shot }) => [shot.id, shot.content || ""])))
      setLastContentValues(Object.fromEntries(shots.map(({ shot }) => [shot.id, shot.lastContent || ""])))
    }
  }, [open, shots, imageGeneratingIds])

  useEffect(() => {
    return () => {
      contentDebounceTimersRef.current.forEach((timer) => clearTimeout(timer))
      contentDebounceTimersRef.current.clear()
      lastContentDebounceTimersRef.current.forEach((timer) => clearTimeout(timer))
      lastContentDebounceTimersRef.current.clear()
    }
  }, [])

  const handleSelectAll = useCallback(() => {
    setSelectedIds(new Set(shots.filter((s) => !imageGeneratingIds.has(s.shot.id)).map((s) => s.shot.id)))
  }, [shots, imageGeneratingIds])

  const handleSelectMissing = useCallback(() => {
    setSelectedIds(new Set(shots.filter((s) => !s.shot.imageUrl && !imageGeneratingIds.has(s.shot.id)).map((s) => s.shot.id)))
  }, [shots, imageGeneratingIds])

  const handleSelectNone = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  // 使用函数式更新，避免 selectedIds 进入依赖数组导致每次选择变化都重建函数
  const handleToggleShot = useCallback((id: string) => {
    if (imageGeneratingIds.has(id)) return
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [imageGeneratingIds])

  const flushPromptUpdates = useCallback(() => {
    contentDebounceTimersRef.current.forEach((timer) => clearTimeout(timer))
    contentDebounceTimersRef.current.clear()
    lastContentDebounceTimersRef.current.forEach((timer) => clearTimeout(timer))
    lastContentDebounceTimersRef.current.clear()

    Object.entries(contentValues).forEach(([shotId, content]) => {
      const meta = shotMetaMap.get(shotId)
      if (!meta || content === meta.originalContent) return
      onUpdateShot(meta.episodeId, shotId, { content })
    })

    Object.entries(lastContentValues).forEach(([shotId, lastContent]) => {
      const meta = shotMetaMap.get(shotId)
      if (!meta || lastContent === meta.originalLastContent) return
      onUpdateShot(meta.episodeId, shotId, { lastContent: lastContent || null })
    })
  }, [onUpdateShot, contentValues, lastContentValues, shotMetaMap])

  const handleContentChange = useCallback(
    (shotId: string, value: string) => {
      setContentValues((prev) => ({ ...prev, [shotId]: value }))

      const timer = contentDebounceTimersRef.current.get(shotId)
      if (timer) clearTimeout(timer)

      const meta = shotMetaMap.get(shotId)
      if (!meta) return

      const nextTimer = setTimeout(() => {
        onUpdateShot(meta.episodeId, shotId, { content: value })
        contentDebounceTimersRef.current.delete(shotId)
      }, 600)

      contentDebounceTimersRef.current.set(shotId, nextTimer)
    },
    [onUpdateShot, shotMetaMap]
  )

  const handleLastContentChange = useCallback(
    (shotId: string, value: string) => {
      setLastContentValues((prev) => ({ ...prev, [shotId]: value }))

      const timer = lastContentDebounceTimersRef.current.get(shotId)
      if (timer) clearTimeout(timer)

      const meta = shotMetaMap.get(shotId)
      if (!meta) return

      const nextTimer = setTimeout(() => {
        onUpdateShot(meta.episodeId, shotId, { lastContent: value || null })
        lastContentDebounceTimersRef.current.delete(shotId)
      }, 800)

      lastContentDebounceTimersRef.current.set(shotId, nextTimer)
    },
    [onUpdateShot, shotMetaMap]
  )

  const handleConfirm = useCallback(async () => {
    if (confirming) return
    setConfirming(true)
    try {
      flushPromptUpdates()
      await onConfirm(Array.from(selectedIds))
    } finally {
      setConfirming(false)
    }
  }, [flushPromptUpdates, onConfirm, selectedIds, confirming])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>批量生成画面</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 py-2">
          <Button variant="outline" size="sm" onClick={handleSelectAll}>
            全选
          </Button>
          <Button variant="outline" size="sm" onClick={handleSelectNone}>
            清空
          </Button>
          <Button variant="outline" size="sm" onClick={handleSelectMissing}>
            仅选缺失图片
          </Button>

          <span className="text-sm text-muted-foreground ml-auto">
            已选 {selectedIds.size} / {shots.length}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 border rounded-md p-2 space-y-2">
          {shots.map(({ shot, scriptShotPlan }, index) => (
            <ShotRow
              key={shot.id}
              shot={shot}
              scriptShotPlan={scriptShotPlan}
              index={index}
              isSelected={selectedIds.has(shot.id)}
              isGeneratingImage={imageGeneratingIds.has(shot.id)}
              contentValue={contentValues[shot.id] ?? shot.content ?? ""}
              lastContentValue={lastContentValues[shot.id] ?? shot.lastContent ?? ""}
              onToggle={handleToggleShot}
              onContentChange={handleContentChange}
              onLastContentChange={handleLastContentChange}
              onUpdateShot={onUpdateShot}
            />
          ))}
          {shots.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              暂无分镜
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={() => void handleConfirm()}
            disabled={selectedIds.size === 0 || confirming}
          >
            {confirming ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            ) : (
              <ImageIcon className="mr-1.5 size-3.5" />
            )}
            生成选中项 ({selectedIds.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
