"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  RefreshCw,
  BookOpen,
  Plus,
} from "lucide-react"
import { ShotCard } from "./shot-card"
import type { Storyboard, AssetCharacter, AssetScene, AssetProp } from "@/lib/types"

interface SceneSwimlaneProps {
  storyboard: Storyboard
  activeShotId: string | null
  selectedShotIds: Set<string>
  imageGeneratingIds: Set<string>
  assetCharacters: AssetCharacter[]
  assetScenes: AssetScene[]
  assetProps: AssetProp[]
  onSelectShot: (shotId: string) => void
  onDuplicateShot: (storyboardId: string, shotId: string) => void
  onDeleteShot: (storyboardId: string, shotId: string) => void
  onAddShot: (storyboardId: string) => void
  onGenerateImage: (storyboardId: string, shotId: string) => void
  onRegenerateScript: (scriptId: string) => void
  onViewScript: (storyboard: Storyboard) => void
}

export function SceneSwimlane({
  storyboard,
  activeShotId,
  selectedShotIds,
  imageGeneratingIds,
  assetCharacters,
  assetScenes,
  assetProps,
  onSelectShot,
  onDuplicateShot,
  onDeleteShot,
  onAddShot,
  onGenerateImage,
  onRegenerateScript,
  onViewScript,
}: SceneSwimlaneProps) {
  const script = storyboard.script
  const shotsWithImage = storyboard.shots.filter((s) => s.imageUrl).length

  return (
    <div className={cn(
      "bg-card transition-all border-0 border-b last:border-b-0 rounded-none shadow-none"
    )}>
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-2 px-3 py-2 border-b bg-card"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">
              {script.title}
            </span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              第{script.episode.index}集
            </Badge>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-muted-foreground">
              {storyboard.shots.length} 个画面
            </span>
            {storyboard.shots.length > 0 && (
              <span className="text-xs text-muted-foreground">
                · {shotsWithImage}/{storyboard.shots.length} 已生图
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onRegenerateScript(script.id)}
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
      <div className="flex flex-col gap-3 p-3">
        {storyboard.shots.map((shot) => (
          <ShotCard
            key={shot.id}
            shot={shot}
            isActive={activeShotId === shot.id}
            isSelected={selectedShotIds.has(shot.id)}
            isGeneratingImage={imageGeneratingIds.has(shot.id)}
            assetCharacters={assetCharacters}
            assetScenes={assetScenes}
            assetProps={assetProps}
            onSelect={() => onSelectShot(shot.id)}
            onDuplicate={() => onDuplicateShot(storyboard.id, shot.id)}
            onDelete={() => onDeleteShot(storyboard.id, shot.id)}
            onGenerateImage={() => onGenerateImage(storyboard.id, shot.id)}
          />
        ))}

        <button
          onClick={() => onAddShot(storyboard.id)}
          className="col-span-2 h-12 rounded-xl border-2 border-dashed border-muted-foreground/15 flex items-center justify-center gap-2 hover:border-primary/30 hover:bg-primary/5 transition-colors group"
        >
          <Plus className="size-4 text-muted-foreground/30 group-hover:text-primary/50" />
          <span className="text-xs text-muted-foreground/50 group-hover:text-primary/70">添加镜头</span>
        </button>
      </div>
    </div>
  )
}
