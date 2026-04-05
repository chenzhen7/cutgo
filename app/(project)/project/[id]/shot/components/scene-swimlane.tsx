"use client"

import { memo, useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  BookOpen,
  Plus,
  LayoutGrid,
  LayoutList,
} from "lucide-react"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core"
import {
  SortableContext,
  rectSortingStrategy,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ShotCard } from "./shot-card"
import type { ShotCardLayout } from "./shot-card"
import type { ScriptShotPlan, Shot, AssetCharacter, AssetScene, AssetProp } from "@/lib/types"

interface SceneSwimlaneProps {
  scriptShotPlan: ScriptShotPlan
  /** 全项目分集排序后的展示集序号 */
  episodeDisplayNumber: number
  activeShotId: string | null
  selectedShotIds: Set<string>
  imageGeneratingIds: Set<string>
  videoGeneratingIds: Set<string>
  layout?: ShotCardLayout
  /** 项目画幅比，如 "9:16" 或 "16:9" */
  aspectRatio?: string
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
  onViewScript: (scriptShotPlan: ScriptShotPlan) => void
  onShotLayoutChange: (layout: ShotCardLayout) => void
  onReorderShots: (episodeId: string, orderedIds: string[]) => void
}

export const SceneSwimlane = memo(function SceneSwimlane({
  scriptShotPlan,
  episodeDisplayNumber,
  activeShotId,
  selectedShotIds,
  imageGeneratingIds,
  videoGeneratingIds,
  layout = "list",
  aspectRatio = "9:16",
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
  onViewScript,
  onShotLayoutChange,
  onReorderShots,
}: SceneSwimlaneProps) {
  const episode = scriptShotPlan.episode

  // 乐观本地顺序：拖拽结束后立即更新，不等 API 返回
  const [localShots, setLocalShots] = useState<Shot[]>(scriptShotPlan.shots)
  const isDraggingRef = useRef(false)

  // 当 store 里的 shots 变化时（非拖拽引起），同步到本地
  useEffect(() => {
    if (!isDraggingRef.current) {
      setLocalShots(scriptShotPlan.shots)
    }
  }, [scriptShotPlan.shots])

  const shotsWithImage = localShots.filter((s) => s.imageUrl).length
  const shotsWithVideo = localShots.filter((s) => s.videoUrl).length

  const [activeDragShot, setActiveDragShot] = useState<Shot | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 3 },
    })
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    isDraggingRef.current = true
    const shot = localShots.find((s) => s.id === event.active.id)
    setActiveDragShot(shot ?? null)
  }, [localShots])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    isDraggingRef.current = false
    setActiveDragShot(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = localShots.findIndex((s) => s.id === active.id)
    const newIndex = localShots.findIndex((s) => s.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(localShots, oldIndex, newIndex)
    // 立即更新本地顺序（乐观更新）
    setLocalShots(reordered)
    // 异步同步到后端
    onReorderShots(scriptShotPlan.id, reordered.map((s) => s.id))
  }, [localShots, scriptShotPlan.id, onReorderShots])

  const shotIds = localShots.map((s) => s.id)

  return (
    <TooltipProvider delayDuration={300}>
      <div className="@container bg-card transition-all border-0 border-b last:border-b-0 rounded-none shadow-none">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center gap-2 border-b bg-card px-2.5 py-2 @[640px]:px-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-medium truncate @[900px]:text-sm">
                {episode.title}
              </span>
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 @[900px]:text-[10px]">
                第{episodeDisplayNumber}集
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground">
                {scriptShotPlan.shots.length} 个镜头
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
              onClick={() => onViewScript(scriptShotPlan)}
            >
              <BookOpen className="size-3 mr-1" />
              剧本
            </Button>

            <div className="flex items-center rounded-lg border bg-muted/30 p-0.5">
              <button
                onClick={() => onShotLayoutChange("list")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-all",
                  layout === "list"
                    ? "bg-background text-foreground shadow-sm font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="列表视图"
              >
                <LayoutList className="size-3.5" />
                列表
              </button>
              <button
                onClick={() => onShotLayoutChange("grid")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-all",
                  layout === "grid"
                    ? "bg-background text-foreground shadow-sm font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="网格视图"
              >
                <LayoutGrid className="size-3.5" />
                网格
              </button>
            </div>
          </div>
        </div>

        {/* Shots */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={shotIds}
            strategy={layout === "grid" ? rectSortingStrategy : verticalListSortingStrategy}
          >
            <div className={cn(
              "p-2.5 @[640px]:p-3",
              layout === "grid"
                ? aspectRatio === "16:9"
                  // 横屏：卡片宽，列数少
                  ? "grid gap-2.5 grid-cols-1 @[480px]:grid-cols-2 @[720px]:grid-cols-3 @[960px]:grid-cols-4 @[1200px]:grid-cols-5 @[1440px]:grid-cols-6"
                  // 竖屏（9:16 及其他）：卡片窄高，列数多
                  : "grid gap-2 grid-cols-2 @[360px]:grid-cols-3 @[540px]:grid-cols-4 @[720px]:grid-cols-5 @[900px]:grid-cols-6 @[1080px]:grid-cols-7 @[1260px]:grid-cols-8"
                : "flex flex-col gap-2.5 @[640px]:gap-3"
            )}>
              {localShots.map((shot) => (
                <ShotCard
                  key={shot.id}
                  shot={shot}
                  episodeId={scriptShotPlan.episodeId}
                  isActive={activeShotId === shot.id}
                  isSelected={selectedShotIds.has(shot.id)}
                  isGeneratingImage={imageGeneratingIds.has(shot.id)}
                  isGeneratingVideo={videoGeneratingIds.has(shot.id)}
                  layout={layout}
                  aspectRatio={aspectRatio}
                  assetCharacters={assetCharacters}
                  assetScenes={assetScenes}
                  assetProps={assetProps}
                  onSelect={onSelectShot}
                  onDuplicate={onDuplicateShot}
                  onDelete={onDeleteShot}
                  onGenerateImage={onGenerateImage}
                  onGenerateVideo={onGenerateVideo}
                  onPlayVideo={onPlayVideo}
                />
              ))}

              <button
                onClick={() => onAddShot(scriptShotPlan.episodeId)}
                className={cn(
                  "rounded-xl border-2 border-dashed border-muted-foreground/15 flex items-center justify-center gap-2 hover:border-primary/30 hover:bg-primary/5 transition-colors group",
                  layout === "grid" ? "aspect-square" : "h-10 @[640px]:h-12"
                )}
              >
                <Plus className="size-4 text-muted-foreground/30 group-hover:text-primary/50" />
                {layout === "list" && (
                  <span className="text-xs text-muted-foreground/50 group-hover:text-primary/70">添加镜头</span>
                )}
              </button>
            </div>
          </SortableContext>

          <DragOverlay>
            {activeDragShot && (
              <ShotCard
                shot={activeDragShot}
                episodeId={scriptShotPlan.episodeId}
                isActive={false}
                isSelected={false}
                isGeneratingImage={false}
                isGeneratingVideo={false}
                layout={layout}
                aspectRatio={aspectRatio}
                isDragging={true}
                assetCharacters={assetCharacters}
                assetScenes={assetScenes}
                assetProps={assetProps}
                onSelect={onSelectShot}
                onDuplicate={onDuplicateShot}
                onDelete={onDeleteShot}
                onGenerateImage={onGenerateImage}
                onGenerateVideo={onGenerateVideo}
                onPlayVideo={onPlayVideo}
              />
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </TooltipProvider>
  )
})
