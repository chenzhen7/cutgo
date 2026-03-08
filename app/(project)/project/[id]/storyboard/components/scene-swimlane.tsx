"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ChevronDown,
  ChevronRight,
  RefreshCw,
  BookOpen,
  Plus,
  MapPin,
} from "lucide-react"
import { ShotCard } from "./shot-card"
import type { Storyboard, Shot } from "@/lib/types"

interface SceneSwimlaneProps {
  storyboard: Storyboard
  activeShotId: string | null
  selectedShotIds: Set<string>
  onSelectShot: (shotId: string) => void
  onDuplicateShot: (storyboardId: string, shotId: string) => void
  onDeleteShot: (storyboardId: string, shotId: string) => void
  onAddShot: (storyboardId: string) => void
  onRegenerateScene: (scriptSceneId: string) => void
  onViewScript: (storyboard: Storyboard) => void
}

export function SceneSwimlane({
  storyboard,
  activeShotId,
  selectedShotIds,
  onSelectShot,
  onDuplicateShot,
  onDeleteShot,
  onAddShot,
  onRegenerateScene,
  onViewScript,
}: SceneSwimlaneProps) {
  const [collapsed, setCollapsed] = useState(false)
  const scene = storyboard.scriptScene
  const totalDuration = storyboard.shots.reduce(
    (sum, s) => sum + (parseFloat(s.duration) || 0),
    0
  )

  return (
    <div className="rounded-lg border bg-card">
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? (
          <ChevronRight className="size-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="size-4 text-muted-foreground shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">
              {scene.title}
            </span>
            {scene.location && (
              <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                <MapPin className="size-3" />
                {scene.location}
              </span>
            )}
            {scene.emotion && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {scene.emotion}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-muted-foreground">
              {storyboard.shots.length} 镜头
            </span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">
              {Math.round(totalDuration)}s
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onRegenerateScene(scene.id)}
          >
            <RefreshCw className="size-3 mr-1" />
            重新生成
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onViewScript(storyboard)}
          >
            <BookOpen className="size-3 mr-1" />
            剧本
          </Button>
        </div>
      </div>

      {/* Shots */}
      {!collapsed && (
        <div className="flex items-start gap-3 p-3 overflow-x-auto">
          {storyboard.shots.map((shot) => (
            <ShotCard
              key={shot.id}
              shot={shot}
              isActive={activeShotId === shot.id}
              isSelected={selectedShotIds.has(shot.id)}
              onSelect={() => onSelectShot(shot.id)}
              onDuplicate={() => onDuplicateShot(storyboard.id, shot.id)}
              onDelete={() => onDeleteShot(storyboard.id, shot.id)}
            />
          ))}

          {/* Add shot placeholder */}
          <button
            onClick={() => onAddShot(storyboard.id)}
            className="w-40 shrink-0 h-[180px] rounded-lg border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center gap-2 hover:border-primary/40 hover:bg-primary/5 transition-colors"
          >
            <Plus className="size-5 text-muted-foreground/40" />
            <span className="text-xs text-muted-foreground/60">添加镜头</span>
          </button>
        </div>
      )}

      {collapsed && (
        <div className="px-3 py-1.5">
          <div className="flex gap-1">
            {storyboard.shots.slice(0, 8).map((shot) => (
              <div
                key={shot.id}
                className="h-1.5 rounded-full bg-primary/30"
                style={{ width: `${Math.max(16, (parseFloat(shot.duration) || 3) * 8)}px` }}
              />
            ))}
            {storyboard.shots.length > 8 && (
              <span className="text-[10px] text-muted-foreground ml-1">
                +{storyboard.shots.length - 8}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
