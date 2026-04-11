"use client"

import { Button } from "@/components/ui/button"
import { Clapperboard, Loader2, ImageIcon, Video } from "lucide-react"
import type { ScriptShotGenerateStatus } from "@/lib/types"

interface ScriptShotToolbarProps {
  generateStatus: ScriptShotGenerateStatus
  batchImageStatus: "idle" | "generating" | "completed" | "error"
  batchImageProgress: { current: number; total: number } | null
  canGenerateCurrentEpisode: boolean
  onGenerateCurrentEpisode: () => void
  onOpenBatchImageDialog: () => void
  batchVideoStatus: "idle" | "generating" | "completed" | "error"
  batchVideoProgress: { current: number; total: number } | null
  onOpenBatchVideoDialog: () => void
}

function ToolbarButton({
  isGenerating,
  disabled,
  onClick,
  icon: Icon,
  progress,
  generatingText,
  idleText,
  variant = "outline",
}: {
  isGenerating: boolean
  disabled?: boolean
  onClick: () => void
  icon: React.ElementType
  progress?: { current: number; total: number } | null
  generatingText: string
  idleText: string
  variant?: "default" | "outline"
}) {
  return (
    <Button variant={variant} disabled={disabled} size="sm" onClick={onClick}>
      {isGenerating ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Icon className="size-4 mr-2" />}
      {isGenerating
        ? progress
          ? `${generatingText} ${progress.current}/${progress.total}`
          : `${generatingText}中...`
        : idleText}
    </Button>
  )
}

export function ScriptShotToolbar({
  generateStatus,
  batchImageStatus,
  batchImageProgress,
  canGenerateCurrentEpisode,
  onGenerateCurrentEpisode,
  onOpenBatchImageDialog,
  batchVideoStatus,
  batchVideoProgress,
  onOpenBatchVideoDialog,
}: ScriptShotToolbarProps) {
  const isGenerating = generateStatus === "generating"
  const isImageGenerating = batchImageStatus === "generating"
  const isVideoGenerating = batchVideoStatus === "generating"

  return (
    <div className="flex shrink-0 items-center gap-2">
      <div className="flex items-center gap-2 shrink-0">
        <ToolbarButton
          isGenerating={isImageGenerating}
          onClick={onOpenBatchImageDialog}
          icon={ImageIcon}
          progress={batchImageProgress}
          generatingText="生成画面"
          idleText="批量生成画面"
        />

        <ToolbarButton
          isGenerating={isVideoGenerating}
          onClick={onOpenBatchVideoDialog}
          icon={Video}
          progress={batchVideoProgress}
          generatingText="生成视频"
          idleText="批量生成视频"
        />

        <ToolbarButton
          isGenerating={isGenerating}
          disabled={!canGenerateCurrentEpisode || isGenerating}
          onClick={onGenerateCurrentEpisode}
          icon={Clapperboard}
          generatingText="生成"
          idleText="生成分镜"
          variant="default"
        />
      </div>
    </div>
  )
}
