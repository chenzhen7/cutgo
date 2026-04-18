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
  promptValue: string
  promptEndValue: string
  gridPromptsValue: string
  onToggle: (id: string) => void
  onPromptChange: (shotId: string, prompt: string) => void
  onPromptEndChange: (shotId: string, promptEnd: string) => void
  onGridPromptsChange: (shotId: string, gridPrompts: string) => void
  onUpdateShot: (episodeId: string, shotId: string, data: Partial<ShotInput>) => void
}

const ShotRow = memo(function ShotRow({
  shot,
  scriptShotPlan,
  index,
  isSelected,
  isGeneratingImage,
  promptValue,
  promptEndValue,
  gridPromptsValue,
  onToggle,
  onPromptChange,
  onPromptEndChange,
  onGridPromptsChange,
  onUpdateShot,
}: ShotRowProps) {
  const imageType = shot.imageType || "keyframe"
  const currentGridLayout = GRID_LAYOUT_OPTIONS.find((o) => o.value === (shot.gridLayout || "2x2")) || GRID_LAYOUT_OPTIONS[0]
  
  let parsedGridPrompts: string[] = []
  try {
    parsedGridPrompts = gridPromptsValue ? JSON.parse(gridPromptsValue) : []
  } catch {
    parsedGridPrompts = []
  }

  let parsedImageUrls: string[] = []
  try {
    parsedImageUrls = shot.imageUrls ? JSON.parse(shot.imageUrls) : []
  } catch {
    parsedImageUrls = []
  }

  const handleGridLayoutChange = (layout: string) => {
    const layoutOpt = GRID_LAYOUT_OPTIONS.find((o) => o.value === layout)
    if (!layoutOpt) return
    const currentPrompts = parsedGridPrompts.length > 0 ? parsedGridPrompts : []
    const newPrompts = Array.from({ length: layoutOpt.count }, (_, i) => currentPrompts[i] || "")
    const newPromptsStr = JSON.stringify(newPrompts)
    onGridPromptsChange(shot.id, newPromptsStr)
    onUpdateShot(scriptShotPlan.episodeId, shot.id, {
      gridLayout: layout as ShotInput["gridLayout"],
      gridPrompts: newPromptsStr,
    })
  }

  const handleGridPromptChange = (i: number, value: string) => {
    const newPrompts = [...parsedGridPrompts]
    newPrompts[i] = value
    onGridPromptsChange(shot.id, JSON.stringify(newPrompts))
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
        ) : shot.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shot.imageUrl} alt="" className="w-full h-full object-cover" />
        ) : imageType === "first_last" && parsedImageUrls.length >= 2 ? (
          <div className="flex flex-row gap-0.5 w-full h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={parsedImageUrls[0]} alt="首帧" className="w-1/2 h-full object-cover" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={parsedImageUrls[1]} alt="尾帧" className="w-1/2 h-full object-cover" />
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
              value={promptValue}
              onChange={(e) => onPromptChange(shot.id, e.target.value)}
              placeholder="首帧提示词"
              className="min-h-[60px] text-sm resize-y"
              onPointerDown={(e) => e.stopPropagation()}
            />
            <Textarea
              value={promptEndValue}
              onChange={(e) => onPromptEndChange(shot.id, e.target.value)}
              placeholder="尾帧提示词"
              className="min-h-[60px] text-sm resize-y"
              onPointerDown={(e) => e.stopPropagation()}
            />
          </div>
        ) : imageType === "multi_grid" ? (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2 max-h-[120px] overflow-y-auto px-1">
              {Array.from({ length: currentGridLayout.count }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <span className="text-[10px] text-muted-foreground font-medium">格 {i + 1}</span>
                  <Textarea
                    value={parsedGridPrompts[i] || ""}
                    onChange={(e) => handleGridPromptChange(i, e.target.value)}
                    className="min-h-[40px] text-xs resize-y"
                    placeholder={`第 ${i + 1} 格提示词`}
                    onPointerDown={(e) => e.stopPropagation()}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <Textarea
            value={promptValue}
            onChange={(e) => onPromptChange(shot.id, e.target.value)}
            placeholder="提示词"
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
  const [promptValues, setPromptValues] = useState<Record<string, string>>({})
  const [promptEndValues, setPromptEndValues] = useState<Record<string, string>>({})
  const [gridPromptsValues, setGridPromptsValues] = useState<Record<string, string>>({})
  const [confirming, setConfirming] = useState(false)
  const promptDebounceTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const promptEndDebounceTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const gridPromptsDebounceTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const shotMetaMap = useMemo(
    () => new Map(shots.map(({ shot, scriptShotPlan }) => [
      shot.id, 
      { 
        episodeId: scriptShotPlan.episodeId, 
        originalPrompt: shot.prompt || "",
        originalPromptEnd: shot.promptEnd || "",
        originalGridPrompts: shot.gridPrompts || ""
      }
    ])),
    [shots]
  )

  useEffect(() => {
    if (open) {
      const missingIds = new Set(shots.filter((s) => !s.shot.imageUrl && !imageGeneratingIds.has(s.shot.id)).map((s) => s.shot.id))
      setSelectedIds(missingIds)
      setPromptValues(Object.fromEntries(shots.map(({ shot }) => [shot.id, shot.prompt || ""])))
      setPromptEndValues(Object.fromEntries(shots.map(({ shot }) => [shot.id, shot.promptEnd || ""])))
      setGridPromptsValues(Object.fromEntries(shots.map(({ shot }) => [shot.id, shot.gridPrompts || ""])))
    }
  }, [open, shots, imageGeneratingIds])

  useEffect(() => {
    return () => {
      promptDebounceTimersRef.current.forEach((timer) => clearTimeout(timer))
      promptDebounceTimersRef.current.clear()
      promptEndDebounceTimersRef.current.forEach((timer) => clearTimeout(timer))
      promptEndDebounceTimersRef.current.clear()
      gridPromptsDebounceTimersRef.current.forEach((timer) => clearTimeout(timer))
      gridPromptsDebounceTimersRef.current.clear()
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
  }, [])

  const flushPromptUpdates = useCallback(() => {
    promptDebounceTimersRef.current.forEach((timer) => clearTimeout(timer))
    promptDebounceTimersRef.current.clear()
    promptEndDebounceTimersRef.current.forEach((timer) => clearTimeout(timer))
    promptEndDebounceTimersRef.current.clear()
    gridPromptsDebounceTimersRef.current.forEach((timer) => clearTimeout(timer))
    gridPromptsDebounceTimersRef.current.clear()

    Object.entries(promptValues).forEach(([shotId, prompt]) => {
      const meta = shotMetaMap.get(shotId)
      if (!meta || prompt === meta.originalPrompt) return
      onUpdateShot(meta.episodeId, shotId, { prompt })
    })

    Object.entries(promptEndValues).forEach(([shotId, promptEnd]) => {
      const meta = shotMetaMap.get(shotId)
      if (!meta || promptEnd === meta.originalPromptEnd) return
      onUpdateShot(meta.episodeId, shotId, { promptEnd })
    })

    Object.entries(gridPromptsValues).forEach(([shotId, gridPrompts]) => {
      const meta = shotMetaMap.get(shotId)
      if (!meta || gridPrompts === meta.originalGridPrompts) return
      onUpdateShot(meta.episodeId, shotId, { gridPrompts })
    })
  }, [onUpdateShot, promptValues, promptEndValues, gridPromptsValues, shotMetaMap])

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

  const handlePromptEndChange = useCallback(
    (shotId: string, promptEnd: string) => {
      setPromptEndValues((prev) => ({ ...prev, [shotId]: promptEnd }))

      const timer = promptEndDebounceTimersRef.current.get(shotId)
      if (timer) clearTimeout(timer)

      const meta = shotMetaMap.get(shotId)
      if (!meta) return

      const nextTimer = setTimeout(() => {
        onUpdateShot(meta.episodeId, shotId, { promptEnd })
        promptEndDebounceTimersRef.current.delete(shotId)
      }, 800)

      promptEndDebounceTimersRef.current.set(shotId, nextTimer)
    },
    [onUpdateShot, shotMetaMap]
  )

  const handleGridPromptsChange = useCallback(
    (shotId: string, gridPrompts: string) => {
      setGridPromptsValues((prev) => ({ ...prev, [shotId]: gridPrompts }))

      const timer = gridPromptsDebounceTimersRef.current.get(shotId)
      if (timer) clearTimeout(timer)

      const meta = shotMetaMap.get(shotId)
      if (!meta) return

      const nextTimer = setTimeout(() => {
        onUpdateShot(meta.episodeId, shotId, { gridPrompts })
        gridPromptsDebounceTimersRef.current.delete(shotId)
      }, 800)

      gridPromptsDebounceTimersRef.current.set(shotId, nextTimer)
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
              promptValue={promptValues[shot.id] ?? shot.prompt ?? ""}
              promptEndValue={promptEndValues[shot.id] ?? shot.promptEnd ?? ""}
              gridPromptsValue={gridPromptsValues[shot.id] ?? shot.gridPrompts ?? ""}
              onToggle={handleToggleShot}
              onPromptChange={handlePromptChange}
              onPromptEndChange={handlePromptEndChange}
              onGridPromptsChange={handleGridPromptsChange}
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
