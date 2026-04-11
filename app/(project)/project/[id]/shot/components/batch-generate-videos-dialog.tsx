"use client"

import { useState, useEffect, useRef, useMemo, useCallback, memo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Shot, ScriptShotPlan, ShotInput } from "@/lib/types"
import { Loader2, Image as ImageIcon } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

// ─── 行级 memo 组件：仅在自身相关 props 变化时重渲染 ───────────────────────

interface ShotRowProps {
  shot: Shot
  scriptShotPlan: ScriptShotPlan
  index: number
  isSelected: boolean
  isGeneratingVideo: boolean
  videoPromptValue: string
  onToggle: (id: string) => void
  onVideoPromptChange: (shotId: string, prompt: string) => void
  onUpdateShot: (episodeId: string, shotId: string, data: Partial<ShotInput>) => void
}

const ShotRow = memo(function ShotRow({
  shot,
  scriptShotPlan,
  index,
  isSelected,
  isGeneratingVideo,
  videoPromptValue,
  onToggle,
  onVideoPromptChange,
}: ShotRowProps) {
  const hasImage = !!shot.imageUrl

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
      <div className="w-24 h-24 shrink-0 bg-muted rounded overflow-hidden flex items-center justify-center border mt-1 relative">
        {isGeneratingVideo ? (
          <div className="flex flex-col items-center justify-center gap-1 w-full h-full bg-muted/50">
            <Loader2 className="size-5 animate-spin text-primary" />
            <span className="text-[10px] text-muted-foreground">生成中</span>
          </div>
        ) : shot.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shot.imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center justify-center gap-1">
            <ImageIcon className="size-6 text-muted-foreground/50" />
            <span className="text-[10px] text-muted-foreground">请先生成画面</span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
        <Textarea
          value={videoPromptValue}
          onChange={(e) => onVideoPromptChange(shot.id, e.target.value)}
          placeholder="视频提示词（可选，描述运镜或动作）"
          className="min-h-[60px] text-sm resize-y"
          onPointerDown={(e) => e.stopPropagation()}
          disabled={!hasImage}
        />
        <div className="flex items-center gap-2" onPointerDown={(e) => e.stopPropagation()}>
          {shot.videoUrl && (
            <span className="text-xs text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded">
              已有视频
            </span>
          )}
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
  const [videoPromptValues, setVideoPromptValues] = useState<Record<string, string>>({})
  const videoPromptDebounceTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const shotMetaMap = useMemo(
    () => new Map(shots.map(({ shot, scriptShotPlan }) => [
      shot.id,
      {
        episodeId: scriptShotPlan.episodeId,
        originalVideoPrompt: shot.videoPrompt || "",
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
      setVideoPromptValues(Object.fromEntries(shots.map(({ shot }) => [shot.id, shot.videoPrompt || ""])))
    }
  }, [open, shots, videoGeneratingIds])

  useEffect(() => {
    return () => {
      videoPromptDebounceTimersRef.current.forEach((timer) => clearTimeout(timer))
      videoPromptDebounceTimersRef.current.clear()
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

  const flushPromptUpdates = useCallback(() => {
    videoPromptDebounceTimersRef.current.forEach((timer) => clearTimeout(timer))
    videoPromptDebounceTimersRef.current.clear()

    Object.entries(videoPromptValues).forEach(([shotId, videoPrompt]) => {
      const meta = shotMetaMap.get(shotId)
      if (!meta || videoPrompt === meta.originalVideoPrompt) return
      onUpdateShot(meta.episodeId, shotId, { videoPrompt })
    })
  }, [onUpdateShot, videoPromptValues, shotMetaMap])

  const handleVideoPromptChange = useCallback(
    (shotId: string, videoPrompt: string) => {
      setVideoPromptValues((prev) => ({ ...prev, [shotId]: videoPrompt }))

      const timer = videoPromptDebounceTimersRef.current.get(shotId)
      if (timer) clearTimeout(timer)

      const meta = shotMetaMap.get(shotId)
      if (!meta) return

      const nextTimer = setTimeout(() => {
        onUpdateShot(meta.episodeId, shotId, { videoPrompt })
        videoPromptDebounceTimersRef.current.delete(shotId)
      }, 600)

      videoPromptDebounceTimersRef.current.set(shotId, nextTimer)
    },
    [onUpdateShot, shotMetaMap]
  )

  const handleConfirm = useCallback(() => {
    flushPromptUpdates()
    onConfirm(Array.from(selectedIds))
  }, [flushPromptUpdates, onConfirm, selectedIds])

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
              videoPromptValue={videoPromptValues[shot.id] ?? shot.videoPrompt ?? ""}
              onToggle={handleToggleShot}
              onVideoPromptChange={handleVideoPromptChange}
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
