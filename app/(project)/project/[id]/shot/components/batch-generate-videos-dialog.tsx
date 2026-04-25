"use client"

import { useState, useEffect, useRef, useMemo, useCallback, memo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Shot, ScriptShotPlan, ShotInput } from "@/lib/types"
import { Loader2, Image as ImageIcon } from "lucide-react"

// ─── 行级 memo 组件：仅在自身相关 props 变化时重渲染 ───────────────────────

interface ShotRowProps {
  shot: Shot
  scriptShotPlan: ScriptShotPlan
  index: number
  isSelected: boolean
  isGeneratingVideo: boolean
  durationValue: string
  onToggle: (id: string) => void
  onDurationChange: (shotId: string, duration: string) => void
  onUpdateShot: (episodeId: string, shotId: string, data: Partial<ShotInput>) => void
}

const ShotRow = memo(function ShotRow({
  shot,
  index,
  isSelected,
  isGeneratingVideo,
  durationValue,
  onToggle,
  onDurationChange,
}: ShotRowProps) {
  const hasImage = !!shot.imageUrl
  const imageType = shot.imageType || "keyframe"
  const tailFrameUrl = imageType === "first_last" ? shot.lastFrameUrl : null

  return (
    <div
      className={`flex items-start gap-4 p-2 rounded-md cursor-pointer ${isGeneratingVideo ? "opacity-50 grayscale" : hasImage ? "hover:bg-muted/50" : "opacity-50 grayscale"
        }`}
      onClick={() => {
        if (hasImage && !isGeneratingVideo) onToggle(shot.id)
      }}
    >
      <div className="pt-2">
        <Checkbox
          checked={isSelected}
          disabled={!hasImage || isGeneratingVideo}
          onCheckedChange={() => {
            if (hasImage && !isGeneratingVideo) onToggle(shot.id)
          }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      <div className="w-8 pt-2 text-center text-sm text-muted-foreground shrink-0">
        {index + 1}
      </div>

      {/* 图片区域：首尾帧时并排展示首帧+尾帧；已有视频标签在图下方 */}
      <div className={`shrink-0 mt-1 flex flex-col gap-1 ${tailFrameUrl ? "w-52" : "w-24"}`}>
        <div className="flex gap-1.5">
          <div className="flex flex-col gap-0.5 flex-1">
            {tailFrameUrl && (
              <span className="text-[9px] text-muted-foreground text-center">首帧</span>
            )}
            <div className="h-24 bg-muted rounded overflow-hidden flex items-center justify-center border relative">
              {isGeneratingVideo ? (
                <div className="flex flex-col items-center justify-center gap-2 w-full h-full bg-muted/50 px-1">
                  <Loader2 className="size-8 animate-spin text-primary" />
                  <span className="text-xs font-medium text-muted-foreground text-center leading-tight">生成中</span>
                </div>
              ) : shot.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={shot.imageUrl} alt="首帧" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center gap-1.5 px-1">
                  <ImageIcon className="size-7 text-muted-foreground/50" />
                  <span className="text-xs text-muted-foreground text-center leading-tight">请先生成画面</span>
                </div>
              )}
            </div>
          </div>

          {tailFrameUrl && (
            <div className="flex flex-col gap-0.5 flex-1">
              <span className="text-[9px] text-muted-foreground text-center">尾帧</span>
              <div className="h-24 bg-muted rounded overflow-hidden flex items-center justify-center border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={tailFrameUrl} alt="尾帧" className="w-full h-full object-cover" />
              </div>
            </div>
          )}
        </div>
        {shot.videoUrl && (
          <span className="text-center text-xs text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded self-center">
            已有视频
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
        <p className="text-sm text-foreground/90 line-clamp-3 leading-relaxed">
          {shot.content?.trim() || "暂无分镜描述"}
        </p>
        <div className="flex items-center gap-2" onPointerDown={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground whitespace-nowrap">时长(秒)</span>
            <Input
              value={durationValue}
              onChange={(e) => {
                const val = e.target.value
                if (val === "" || /^\d+(\.\d*)?$/.test(val)) {
                  onDurationChange(shot.id, val)
                }
              }}
              placeholder="5"
              className="h-6 w-16 text-xs px-2"
              disabled={!hasImage}
            />
          </div>
        </div>
      </div>
    </div>
  )
})

// ─── 对话框主体 ─────────────────────────────────────────────────────────────

interface BatchGenerateVideosDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shots: { shot: Shot; scriptShotPlan: ScriptShotPlan }[]
  onConfirm: (shotIds: string[]) => void
  onUpdateShot: (episodeId: string, shotId: string, data: Partial<ShotInput>) => void
  videoGeneratingIds: Set<string>
}

export function BatchGenerateVideosDialog({
  open,
  onOpenChange,
  shots,
  onConfirm,
  onUpdateShot,
  videoGeneratingIds,
}: BatchGenerateVideosDialogProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [durationValues, setDurationValues] = useState<Record<string, string>>({})
  const debounceTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const shotMetaMap = useMemo(
    () => new Map(shots.map(({ shot, scriptShotPlan }) => [
      shot.id,
      {
        episodeId: scriptShotPlan.episodeId,
        originalDuration: shot.duration?.toString() || "5",
      }
    ])),
    [shots]
  )

  useEffect(() => {
    if (open) {
      const missingIds = new Set(
        shots.filter((s) => s.shot.imageUrl && !s.shot.videoUrl && !videoGeneratingIds.has(s.shot.id)).map((s) => s.shot.id)
      )
      setSelectedIds(missingIds)
      setDurationValues(Object.fromEntries(shots.map(({ shot }) => [shot.id, shot.duration?.toString() || "5"])))
    }
  }, [open, shots, videoGeneratingIds])

  useEffect(() => {
    return () => {
      debounceTimersRef.current.forEach((timer) => clearTimeout(timer))
      debounceTimersRef.current.clear()
    }
  }, [])

  const handleSelectAll = useCallback(() => {
    setSelectedIds(new Set(shots.filter((s) => s.shot.imageUrl && !videoGeneratingIds.has(s.shot.id)).map((s) => s.shot.id)))
  }, [shots, videoGeneratingIds])

  const handleSelectMissing = useCallback(() => {
    setSelectedIds(new Set(shots.filter((s) => s.shot.imageUrl && !s.shot.videoUrl && !videoGeneratingIds.has(s.shot.id)).map((s) => s.shot.id)))
  }, [shots, videoGeneratingIds])

  const handleSelectNone = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const handleToggleShot = useCallback((id: string) => {
    if (videoGeneratingIds.has(id)) return
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [videoGeneratingIds])

  const flushAllUpdates = useCallback(() => {
    debounceTimersRef.current.forEach((timer) => clearTimeout(timer))
    debounceTimersRef.current.clear()

    Object.entries(durationValues).forEach(([shotId, durStr]) => {
      const meta = shotMetaMap.get(shotId)
      if (!meta || durStr === meta.originalDuration) return
      const duration = durStr ? parseFloat(durStr) : undefined
      if (duration !== undefined && !isNaN(duration)) {
        onUpdateShot(meta.episodeId, shotId, { duration })
      }
    })
  }, [onUpdateShot, durationValues, shotMetaMap])

  const handleDurationChange = useCallback(
    (shotId: string, durStr: string) => {
      setDurationValues((prev) => ({ ...prev, [shotId]: durStr }))

      const key = `duration_${shotId}`
      const timer = debounceTimersRef.current.get(key)
      if (timer) clearTimeout(timer)

      const meta = shotMetaMap.get(shotId)
      if (!meta) return

      const nextTimer = setTimeout(() => {
        const duration = durStr ? parseFloat(durStr) : undefined
        if (duration !== undefined && !isNaN(duration)) {
          onUpdateShot(meta.episodeId, shotId, { duration })
        }
        debounceTimersRef.current.delete(key)
      }, 600)

      debounceTimersRef.current.set(key, nextTimer)
    },
    [onUpdateShot, shotMetaMap]
  )

  const handleConfirm = useCallback(() => {
    flushAllUpdates()
    onConfirm(Array.from(selectedIds))
  }, [flushAllUpdates, onConfirm, selectedIds])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>批量生成视频</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 py-2">
          <Button variant="outline" size="sm" onClick={handleSelectAll}>
            全选
          </Button>
          <Button variant="outline" size="sm" onClick={handleSelectNone}>
            清空
          </Button>
          <Button variant="outline" size="sm" onClick={handleSelectMissing}>
            仅选缺失视频
          </Button>

          <span className="text-sm text-muted-foreground ml-auto">
            已选 {selectedIds.size} / {shots.filter(s => s.shot.imageUrl).length} (共 {shots.length} 镜)
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
              isGeneratingVideo={videoGeneratingIds.has(shot.id)}
              durationValue={durationValues[shot.id] ?? shot.duration?.toString() ?? "5"}
              onToggle={handleToggleShot}
              onDurationChange={handleDurationChange}
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
            onClick={handleConfirm}
            disabled={selectedIds.size === 0}
          >
            生成选中项 ({selectedIds.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
