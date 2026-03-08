"use client"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { GripVertical, Copy, Trash2, ImageIcon } from "lucide-react"
import type { Shot } from "@/lib/types"
import { SHOT_SIZE_OPTIONS, CAMERA_MOVEMENT_OPTIONS } from "@/lib/types"

interface ShotCardProps {
  shot: Shot
  isActive: boolean
  isSelected: boolean
  onSelect: () => void
  onDuplicate: () => void
  onDelete: () => void
}

export function ShotCard({
  shot,
  isActive,
  isSelected,
  onSelect,
  onDuplicate,
  onDelete,
}: ShotCardProps) {
  const sizeLabel = SHOT_SIZE_OPTIONS.find((o) => o.value === shot.shotSize)?.label || shot.shotSize
  const movementLabel = CAMERA_MOVEMENT_OPTIONS.find((o) => o.value === shot.cameraMovement)?.label || shot.cameraMovement

  return (
    <div
      onClick={onSelect}
      onContextMenu={(e) => {
        e.preventDefault()
      }}
      className={cn(
        "group relative w-40 shrink-0 rounded-lg border bg-card cursor-pointer transition-all hover:shadow-md",
        isActive && "ring-2 ring-primary border-primary",
        isSelected && "ring-2 ring-blue-400 border-blue-400"
      )}
    >
      <div className="absolute top-1.5 left-1.5 z-10 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="size-3.5 text-muted-foreground" />
      </div>

      <div className="absolute top-1.5 right-1.5 z-10 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onDuplicate() }}
          className="rounded p-0.5 hover:bg-muted"
          title="复制"
        >
          <Copy className="size-3 text-muted-foreground" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="rounded p-0.5 hover:bg-destructive/10"
          title="删除"
        >
          <Trash2 className="size-3 text-destructive" />
        </button>
      </div>

      {/* Sequence number */}
      <div className="absolute top-1.5 left-6 z-10">
        <span className="text-[10px] font-mono text-muted-foreground">#{shot.index + 1}</span>
      </div>

      {/* Image preview */}
      <div className="mx-2 mt-7 h-20 rounded bg-muted flex items-center justify-center overflow-hidden">
        {shot.imageUrl ? (
          <img src={shot.imageUrl} alt="" className="size-full object-cover" />
        ) : (
          <ImageIcon className="size-6 text-muted-foreground/40" />
        )}
      </div>

      {/* Badges */}
      <div className="flex gap-1 px-2 mt-1.5 flex-wrap">
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
          {sizeLabel}
        </Badge>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
          {movementLabel}
        </Badge>
      </div>

      {/* Duration */}
      <div className="px-2 mt-1">
        <span className="text-[10px] text-muted-foreground">{shot.duration}</span>
      </div>

      {/* Composition preview */}
      <div className="px-2 mt-1 pb-2">
        <p className="text-[10px] text-muted-foreground line-clamp-2 leading-tight">
          {shot.composition || "暂无构图描述"}
        </p>
      </div>
    </div>
  )
}
