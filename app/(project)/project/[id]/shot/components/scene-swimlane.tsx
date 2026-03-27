"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  RefreshCw,
  BookOpen,
  Plus,
  Type,
  Film,
} from "lucide-react"
import { ShotCard } from "./shot-card"
import type { ShotCardDisplayMode } from "./shot-card"
import type { ScriptShotPlan, AssetCharacter, AssetScene, AssetProp } from "@/lib/types"

interface SceneSwimlaneProps {
  scriptShotPlan: ScriptShotPlan
  /** 全项目分集排序后的展示集序号 */
  episodeDisplayNumber: number
  activeShotId: string | null
  selectedShotIds: Set<string>
  imageGeneratingIds: Set<string>
  videoGeneratingIds: Set<string>
  shotDisplayMode: ShotCardDisplayMode
  assetCharacters: AssetCharacter[]
  assetScenes: AssetScene[]
  assetProps: AssetProp[]
  onSelectShot: (shotId: string) => void
  onDuplicateShot: (episodeId: string, shotId: string) => void
  onDeleteShot: (episodeId: string, shotId: string) => void
  onAddShot: (episodeId: string) => void
  onGenerateImage: (episodeId: string, shotId: string) => void
  onGenerateVideo: (episodeId: string, shotId: string) => void
  onPlayVideo: (shotId: string) => void
  onRegenerateScript: (episodeId: string) => void
  onViewScript: (scriptShotPlan: ScriptShotPlan) => void
  onToggleShotDisplayMode: () => void
}

export function SceneSwimlane({
  scriptShotPlan,
  episodeDisplayNumber,
  activeShotId,
  selectedShotIds,
  imageGeneratingIds,
  videoGeneratingIds,
  shotDisplayMode,
  assetCharacters,
  assetScenes,
  assetProps,
  onSelectShot,
  onDuplicateShot,
  onDeleteShot,
  onAddShot,
  onGenerateImage,
  onGenerateVideo,
  onPlayVideo,
  onRegenerateScript,
  onViewScript,
  onToggleShotDisplayMode,
}: SceneSwimlaneProps) {
  const episode = scriptShotPlan.episode
  const shotsWithImage = scriptShotPlan.shots.filter((s) => s.imageUrl).length
  const shotsWithVideo = scriptShotPlan.shots.filter((s) => s.videoUrl).length

  return (
    <div className={cn(
      "bg-card transition-all border-0 border-b last:border-b-0 rounded-none shadow-none"
    )}>
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-2 border-b bg-card px-2.5 py-2 xl:px-3"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium truncate 2xl:text-sm">
              {episode.title}
            </span>
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 2xl:text-[10px]">
              第{episodeDisplayNumber}集
            </Badge>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-muted-foreground">
              {scriptShotPlan.shots.length} 个画面
            </span>
            {scriptShotPlan.shots.length > 0 && (
              <>
                <span className="text-xs text-muted-foreground">
                  · {shotsWithImage}/{scriptShotPlan.shots.length} 已生图
                </span>
                {shotsWithVideo > 0 && (
                  <span className="text-xs text-violet-600 dark:text-violet-400">
                    · {shotsWithVideo} 已生视频
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={onToggleShotDisplayMode}
          >
            {shotDisplayMode === "composition" ? (
              <>
                <Type className="size-3 mr-1" />
                画面描述
              </>
            ) : (
              <>
                <Film className="size-3 mr-1" />
                提示词
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onRegenerateScript(scriptShotPlan.episodeId)}
          >
            <RefreshCw className="size-3 mr-1" />
            重新生成
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onViewScript(scriptShotPlan)}
          >
            <BookOpen className="size-3 mr-1" />
            剧本
          </Button>
        </div>
      </div>

      {/* Shots */}
      <div className="flex flex-col gap-2.5 p-2.5 xl:gap-3 xl:p-3">
        {scriptShotPlan.shots.map((shot) => (
          <ShotCard
            key={shot.id}
            shot={shot}
            isActive={activeShotId === shot.id}
            isSelected={selectedShotIds.has(shot.id)}
            isGeneratingImage={imageGeneratingIds.has(shot.id)}
            isGeneratingVideo={videoGeneratingIds.has(shot.id)}
            displayMode={shotDisplayMode}
            assetCharacters={assetCharacters}
            assetScenes={assetScenes}
            assetProps={assetProps}
            onSelect={() => onSelectShot(shot.id)}
            onDuplicate={() => onDuplicateShot(scriptShotPlan.episodeId, shot.id)}
            onDelete={() => onDeleteShot(scriptShotPlan.episodeId, shot.id)}
            onGenerateImage={() => onGenerateImage(scriptShotPlan.episodeId, shot.id)}
            onGenerateVideo={() => onGenerateVideo(scriptShotPlan.episodeId, shot.id)}
            onPlayVideo={() => onPlayVideo(shot.id)}
          />
        ))}

        <button
          onClick={() => onAddShot(scriptShotPlan.episodeId)}
          className="col-span-2 h-10 rounded-xl border-2 border-dashed border-muted-foreground/15 flex items-center justify-center gap-2 hover:border-primary/30 hover:bg-primary/5 transition-colors group xl:h-12"
        >
          <Plus className="size-4 text-muted-foreground/30 group-hover:text-primary/50" />
          <span className="text-xs text-muted-foreground/50 group-hover:text-primary/70">添加镜头</span>
        </button>
      </div>
    </div>
  )
}
