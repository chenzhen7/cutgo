"use client"

import { memo, useCallback, useMemo } from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Copy, Trash2, User, MapPin, Package, ImageIcon, Loader2, Video, Play, Film, GripVertical } from "lucide-react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { IMAGE_TYPE_OPTIONS } from "@/lib/types"
import type { Shot, AssetCharacter, AssetScene, AssetProp } from "@/lib/types"
import { PreviewableImage } from "@/components/ui/previewable-image"
import { useScriptShotsStore } from "@/store/script-shot-store"

export type ShotCardLayout = "list" | "grid"

/** 与详情侧栏「画面生成 / 视频生成」页签一致，用于列表/网格中展示对应提示词 */
export type ShotDetailTab = "image" | "video"

function imagePromptSummary(shot: Shot): string {
  const imageType = shot.imageType || "keyframe"
  const head = shot.content?.trim() ?? ""
  if (imageType === "first_last") {
    const tail = shot.lastContent?.trim() ?? ""
    if (head && tail) return `首：${head}　尾：${tail}`
    if (head) return `首：${head}　尾：（同首帧）`
    return tail
  }
  return head
}

interface ShotCardProps {
  shot: Shot
  episodeId: string
  /** 与右侧详情页签同步：画面 → 图片侧提示词，视频 → 视频提示词 */
  detailTab?: ShotDetailTab
  layout?: ShotCardLayout
  /** 项目画幅比，如 "9:16" 或 "16:9" */
  aspectRatio?: string
  isDragging?: boolean
  assetCharacterMap: Map<string, AssetCharacter>
  assetSceneMap: Map<string, AssetScene>
  assetPropMap: Map<string, AssetProp>
  onSelect: (shotId: string) => void
  onDuplicate: (episodeId: string, shotId: string) => void
  onDelete: (episodeId: string, shotId: string) => void
  onGenerateImage: (episodeId: string, shotId: string) => void
  onGenerateVideo: (episodeId: string, shotId: string) => void
  onPlayVideo: (shotId: string) => void
}

function VideoOverlay({ shot, detailTab = "image", isGeneratingVideo, onPlayVideo }: { shot: Shot; detailTab?: ShotDetailTab; isGeneratingVideo: boolean; onPlayVideo?: () => void }) {
  const hasVideo = !!shot.videoUrl

  if (isGeneratingVideo) {
    return (
      <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-lg z-10">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="size-8 animate-spin text-violet-400" />
          <span className="text-xs font-medium text-white/90">生成视频</span>
        </div>
      </div>
    )
  }

  if (hasVideo) {
    return (
      <>
        <div className="absolute bottom-1 left-1 z-10 bg-violet-600/80 text-white text-[8px] px-1.5 py-0.5 rounded flex items-center gap-0.5">
          <Video className="size-2.5" />
          {shot.videoDuration ? `${shot.videoDuration}s` : "5s"}
        </div>
        {detailTab === "video" && (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/30 rounded-lg"
          >
            <button
              onClick={(e) => { e.stopPropagation(); onPlayVideo?.() }}
              className="size-8 rounded-full bg-white/90 flex items-center justify-center hover:scale-110 transition-transform"
            >
              <Play className="size-4 text-violet-600 ml-0.5" />
            </button>
          </div>
        )}
      </>
    )
  }

  return null
}

function ShotThumbnail({ shot, detailTab = "image", isGeneratingImage, isGeneratingVideo, onPlayVideo, aspectRatio }: { shot: Shot; detailTab?: ShotDetailTab; isGeneratingImage: boolean; isGeneratingVideo: boolean; onPlayVideo?: () => void; aspectRatio?: string }) {
  const imageType = shot.imageType || "keyframe"
  const typeLabel = IMAGE_TYPE_OPTIONS.find((o) => o.value === imageType)?.label || "关键帧"

  // 列表模式缩略图宽度：横屏(16:9)用更宽容器，竖屏(9:16)用窄容器，并保持比例
  const containerClassName = aspectRatio === "16:9"
    ? "relative w-[150px] shrink-0 self-start @[480px]:w-[180px] @[640px]:w-[230px] @[900px]:w-[280px] @[1200px]:w-[340px] aspect-[16/9] transition-all duration-300"
    : "relative w-[80px] shrink-0 self-start @[480px]:w-[105px] @[640px]:w-[130px] @[900px]:w-[160px] @[1200px]:w-[200px] aspect-[9/16] transition-all duration-300"
  const contentClassName = "absolute inset-0 rounded-lg overflow-hidden border bg-muted/20"
  const handleThumbnailClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
  }, [])

  if (detailTab === "video") {
    return (
      <div className={containerClassName} onClick={handleThumbnailClick}>
        <div className={contentClassName}>
          {shot.videoUrl ? (
            <video src={shot.videoUrl} preload="metadata" muted className="size-full object-contain bg-black" />
          ) : (
            <div className="size-full flex flex-col items-center justify-center bg-muted/30">
              <Video className="size-6 text-muted-foreground/25 @[900px]:size-8" />
              <span className="text-[9px] text-muted-foreground/40 @[900px]:text-[10px] mt-1">暂无视频</span>
            </div>
          )}
          <VideoOverlay shot={shot} detailTab={detailTab} isGeneratingVideo={isGeneratingVideo} onPlayVideo={onPlayVideo} />
        </div>
      </div>
    )
  }

  if (isGeneratingImage) {
    return (
      <div className={containerClassName} onClick={handleThumbnailClick}>
        <div className={cn(contentClassName, "bg-muted/50 border border-dashed border-muted-foreground/15 flex flex-col items-center justify-center gap-1.5")}>
          <Loader2 className="size-6 animate-spin text-primary @[900px]:size-8" />
          <span className="text-[9px] font-medium text-muted-foreground @[900px]:text-[10px]">生成中</span>
          <span className="text-[9px] text-muted-foreground/60 @[900px]:text-[10px]">{typeLabel}</span>
        </div>
      </div>
    )
  }

  if (imageType === "first_last") {
    return (
      <div className={containerClassName} onClick={handleThumbnailClick}>
        <div className={cn(contentClassName, "flex flex-row gap-0.5")}>
          {shot.imageUrl ? (
            <PreviewableImage src={shot.imageUrl} alt="首帧" className="w-1/2 min-w-0 h-full object-contain bg-black" />
          ) : (
            <div className="w-1/2 min-w-0 h-full flex flex-col items-center justify-center bg-muted/30 border-r border-dashed border-muted-foreground/10">
              <ImageIcon className="size-4 text-muted-foreground/25 @[900px]:size-5" />
              <span className="text-[8px] text-muted-foreground/40 @[900px]:text-[9px] mt-0.5">首帧</span>
            </div>
          )}
          {shot.lastFrameUrl ? (
            <PreviewableImage src={shot.lastFrameUrl} alt="尾帧" className="w-1/2 min-w-0 h-full object-contain bg-black" />
          ) : (
            <div className="w-1/2 min-w-0 h-full flex flex-col items-center justify-center bg-muted/30">
              <ImageIcon className="size-4 text-muted-foreground/25 @[900px]:size-5" />
              <span className="text-[8px] text-muted-foreground/40 @[900px]:text-[9px] mt-0.5">尾帧</span>
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-black/40 text-white text-[8px] px-1.5 py-0.5 rounded">首尾帧</div>
          </div>
          <VideoOverlay shot={shot} detailTab={detailTab} isGeneratingVideo={isGeneratingVideo} onPlayVideo={onPlayVideo} />
        </div>
      </div>
    )
  }

  if (imageType === "multi_grid") {
    return (
      <div className={containerClassName} onClick={handleThumbnailClick}>
        <div className={contentClassName}>
          {shot.imageUrl ? (
            <PreviewableImage src={shot.imageUrl} alt="多宫格" className="size-full object-contain bg-black" />
          ) : (
            <div className="size-full flex flex-col items-center justify-center bg-muted/30">
              <ImageIcon className="size-6 text-muted-foreground/25 @[900px]:size-8" />
              <span className="text-[9px] text-muted-foreground/40 @[900px]:text-[10px] mt-1">{shot.gridLayout || "2x2"}</span>
            </div>
          )}
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.3) 1px, transparent 1px)",
            backgroundSize: "50% 50%",
          }} />
          <div className="absolute bottom-1 right-1 bg-black/40 text-white text-[8px] px-1.5 py-0.5 rounded">
            {shot.gridLayout || "2x2"}
          </div>
          <VideoOverlay shot={shot} detailTab={detailTab} isGeneratingVideo={isGeneratingVideo} onPlayVideo={onPlayVideo} />
        </div>
      </div>
    )
  }

  return (
    <div className={containerClassName} onClick={handleThumbnailClick}>
      <div className={contentClassName}>
        {shot.imageUrl ? (
          <PreviewableImage src={shot.imageUrl} alt="关键帧" className="size-full object-contain bg-black" />
        ) : (
          <div className="size-full flex flex-col items-center justify-center bg-muted/30">
            <ImageIcon className="size-6 text-muted-foreground/25 @[900px]:size-8" />
            <span className="text-[9px] text-muted-foreground/40 @[900px]:text-[10px] mt-1">{typeLabel}</span>
          </div>
        )}
        <VideoOverlay shot={shot} detailTab={detailTab} isGeneratingVideo={isGeneratingVideo} onPlayVideo={onPlayVideo} />
      </div>
    </div>
  )
}

export const ShotCard = memo(function ShotCard({
  shot,
  episodeId,
  detailTab = "image",
  layout = "list",
  aspectRatio = "9:16",
  isDragging = false,
  assetCharacterMap,
  assetSceneMap,
  assetPropMap,
  onSelect,
  onDuplicate,
  onDelete,
  onGenerateImage,
  onGenerateVideo,
  onPlayVideo,
}: ShotCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: shot.id })
  const isActive = useScriptShotsStore((state) => state.activeShotId === shot.id)
  const isSelected = useScriptShotsStore((state) => state.selectedShotIds.has(shot.id))
  const isGeneratingImage = useScriptShotsStore((state) => state.imageGeneratingIds.has(shot.id))
  const isGeneratingVideo = useScriptShotsStore((state) => state.videoGeneratingIds.has(shot.id))
  const handleSelect = useCallback(() => onSelect(shot.id), [onSelect, shot.id])
  const handleDuplicate = useCallback(() => onDuplicate(episodeId, shot.id), [onDuplicate, episodeId, shot.id])
  const handleDelete = useCallback(() => onDelete(episodeId, shot.id), [onDelete, episodeId, shot.id])
  const handleGenerateImage = useCallback(() => onGenerateImage(episodeId, shot.id), [onGenerateImage, episodeId, shot.id])
  const handleGenerateVideo = useCallback(() => onGenerateVideo(episodeId, shot.id), [onGenerateVideo, episodeId, shot.id])
  const handlePlayVideo = useCallback(() => onPlayVideo(shot.id), [onPlayVideo, shot.id])

  const imageType = shot.imageType || "keyframe"

  const boundCharacters = useMemo(
    () => (shot.characterIds ?? []).map((id) => assetCharacterMap.get(id)).filter((v): v is AssetCharacter => !!v),
    [shot.characterIds, assetCharacterMap]
  )
  const boundScene = useMemo(
    () => (shot.sceneId ? assetSceneMap.get(shot.sceneId) || null : null),
    [assetSceneMap, shot.sceneId]
  )
  const boundProps = useMemo(
    () => (shot.propIds ?? []).map((id) => assetPropMap.get(id)).filter((v): v is AssetProp => !!v),
    [shot.propIds, assetPropMap]
  )

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.4 : 1,
    zIndex: isSortableDragging ? 50 : undefined,
  }

  if (layout === "grid") {
    return (
      <div
        ref={setNodeRef}
        style={style}
        onClick={handleSelect}
        className={cn(
          "group relative rounded-xl border bg-card cursor-pointer hover:shadow-md hover:border-border/80 flex flex-col overflow-hidden",
          !isSortableDragging && "transition-all",
          isActive && "ring-2 ring-primary border-primary shadow-sm bg-primary/[0.02]",
          isSelected && !isActive && "ring-2 ring-blue-400 border-blue-400",
          isDragging && "shadow-2xl ring-2 ring-primary/50"
        )}
      >
        {/* Thumbnail — 按项目画幅比 */}
        <div className={cn(
          "relative w-full bg-muted/30 overflow-hidden",
          aspectRatio === "16:9" ? "aspect-[16/9]" : "aspect-[9/16]"
        )}>
          {detailTab === "video" ? (
            shot.videoUrl ? (
              <video src={shot.videoUrl} preload="metadata" muted className="size-full object-contain bg-black" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                <Video className="size-6 text-muted-foreground/25" />
                <span className="text-xs text-muted-foreground/40">暂无视频</span>
              </div>
            )
          ) : isGeneratingImage ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <Loader2 className="size-8 animate-spin text-primary" />
              <span className="text-xs font-medium text-muted-foreground">生成中</span>
            </div>
          ) : imageType === "first_last" ? (
            <div className="absolute inset-0 flex flex-row gap-px bg-black">
              {shot.imageUrl ? (
                <PreviewableImage src={shot.imageUrl} alt="首帧" previewable={false} className="flex-1 object-contain bg-black" />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center bg-muted/30">
                  <ImageIcon className="size-4 text-muted-foreground/25" />
                </div>
              )}
              {shot.lastFrameUrl ? (
                <PreviewableImage src={shot.lastFrameUrl} alt="尾帧" previewable={false} className="flex-1 object-contain bg-black" />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center bg-muted/30">
                  <ImageIcon className="size-4 text-muted-foreground/25" />
                </div>
              )}
            </div>
          ) : imageType === "multi_grid" ? (
            <div className="absolute inset-0">
              {shot.imageUrl ? (
                <PreviewableImage src={shot.imageUrl} alt="多宫格" previewable={false} className="size-full object-contain bg-black" />
              ) : (
                <div className="size-full flex flex-col items-center justify-center bg-muted/30">
                  <ImageIcon className="size-6 text-muted-foreground/25" />
                </div>
              )}
              <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.3) 1px, transparent 1px)",
                backgroundSize: "50% 50%",
              }} />
              <div className="absolute bottom-1 right-1 bg-black/40 text-white text-[8px] px-1.5 py-0.5 rounded">
                {shot.gridLayout || "2x2"}
              </div>
            </div>
          ) : shot.imageUrl ? (
            <PreviewableImage src={shot.imageUrl} alt="分镜" previewable={false} className="size-full object-contain bg-black" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
              <ImageIcon className="size-6 text-muted-foreground/25" />
            </div>
          )}

          {/* Video overlay */}
          <VideoOverlay shot={shot} detailTab={detailTab} isGeneratingVideo={isGeneratingVideo} onPlayVideo={handlePlayVideo} />

          {/* Index badge */}
          <div className={cn(
            "absolute top-1.5 left-1.5 size-5 rounded-md flex items-center justify-center text-[9px] font-bold z-20",
            isActive
              ? "bg-primary text-primary-foreground"
              : "bg-black/50 text-white"
          )}>
            {shot.index + 1}
          </div>

          {/* Drag handle */}
          <div
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-1.5 left-1.5 z-20 rounded-lg p-1.5 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
            title="拖拽排序"
          >
            <GripVertical className="size-3.5 text-muted-foreground/40 hover:text-muted-foreground" />
          </div>

          {/* Hover actions */}
          <div className="absolute top-1.5 right-1.5 z-20 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all">
            <button
              onClick={(e) => { e.stopPropagation(); if (!isGeneratingImage) handleGenerateImage() }}
              className={cn(
                "rounded-lg p-1.5 bg-background/80 backdrop-blur-sm transition-colors",
                isGeneratingImage ? "opacity-40 cursor-not-allowed" : "hover:bg-muted"
              )}
              title={shot.imageUrl ? "重新生成画面" : "生成画面"}
              disabled={isGeneratingImage}
            >
              <ImageIcon className={cn("size-3.5", isGeneratingImage ? "text-muted-foreground" : "text-primary/70 hover:text-primary")} />
            </button>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => { e.stopPropagation(); if (shot.imageUrl) handleGenerateVideo() }}
                  className={cn(
                    "rounded-lg p-1.5 bg-background/80 backdrop-blur-sm transition-colors",
                    shot.imageUrl
                      ? "hover:bg-muted"
                      : "opacity-40 cursor-not-allowed"
                  )}
                  title={shot.videoUrl ? "重新生成视频" : "生成视频"}
                  disabled={!shot.imageUrl || isGeneratingVideo}
                >
                  <Video className={cn(
                    "size-3.5",
                    shot.imageUrl ? "text-violet-500/70 hover:text-violet-500" : "text-muted-foreground/40"
                  )} />
                </button>
              </TooltipTrigger>
              {!shot.imageUrl && (
                <TooltipContent side="left" className="text-xs">请先生成画面</TooltipContent>
              )}
            </Tooltip>

            <button
              onClick={(e) => { e.stopPropagation(); handleDuplicate() }}
              className="rounded-lg p-1.5 bg-background/80 backdrop-blur-sm hover:bg-muted transition-colors"
              title="复制"
            >
              <Copy className="size-3.5 text-muted-foreground hover:text-foreground" />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); handleDelete() }}
              className="rounded-lg p-1.5 bg-background/80 backdrop-blur-sm hover:bg-muted transition-colors"
              title="删除"
            >
              <Trash2 className="size-3.5 text-destructive/70 hover:text-destructive" />
            </button>
          </div>
        </div>

        {/* Bottom info — 随详情页签切换：画面提示词 / 视频提示词 */}
        <div className="px-2 py-1.5 flex flex-col gap-0.5">
          <p className={cn(
            "text-[11px] @[640px]:text-[12px] @[900px]:text-[13px] @[1200px]:text-[14px] leading-relaxed line-clamp-2",
            (detailTab === "video"
              ? shot.content?.trim()
              : imagePromptSummary(shot)) ? "text-foreground/90" : "text-muted-foreground italic"
          )}>
            {detailTab === "video"
              ? (shot.content?.trim() || "暂无分镜描述")
              : (imagePromptSummary(shot) || "暂无画面提示词")}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={handleSelect}
      className={cn(
        "group relative rounded-xl border bg-card p-2.5 cursor-pointer hover:shadow-md hover:border-border/80 flex items-stretch @[640px]:p-3  @[900px]:p-3.5",
        !isSortableDragging && "transition-all",
        isActive && "ring-2 ring-primary border-primary shadow-sm bg-primary/[0.02]",
        isSelected && !isActive && "ring-2 ring-blue-400 border-blue-400",
        isDragging && "shadow-2xl ring-2 ring-primary/50"
      )}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className="flex items-center self-stretch shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing -ml-1 mr-0 pr-0.5"
        title="拖拽排序"
      >
        <GripVertical className="size-3.5 text-muted-foreground/40 hover:text-muted-foreground" />
      </div>

      <div className="flex items-stretch gap-2.5 @[640px]:gap-3 @[900px]:gap-3.5">
        {/* Left: Thumbnail */}
        <ShotThumbnail shot={shot} detailTab={detailTab} isGeneratingImage={isGeneratingImage} isGeneratingVideo={isGeneratingVideo} onPlayVideo={handlePlayVideo} aspectRatio={aspectRatio} />

        {/* Center: Index + Content */}
        <div className="flex-1 min-w-0  flex gap-2 @[640px]:gap-2.5">
          <div className="flex flex-col items-center shrink-0">
            <div className={cn(
              "size-[22px] rounded-lg flex items-center justify-center text-[9px] font-bold transition-colors @[640px]:size-6 @[640px]:text-[10px] @[900px]:size-[26px]",
              isActive
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground group-hover:bg-muted/80"
            )}>
              {shot.index + 1}
            </div>
          </div>

          <div className="flex-1 min-w-0 flex flex-col gap-1.5 @[900px]:gap-2">
            <div className="flex flex-col gap-2">
              {shot.content && (
                <div className="flex items-start gap-1.5 mb-1">
                  <span className="text-[11px] @[640px]:text-[12px] @[900px]:text-[13px] @[1200px]:text-[14px] font-medium text-foreground/90  @[600px]:line-clamp-3 @[900px]:line-clamp-4 @[1200px]:line-clamp-5 leading-relaxed">
                    {shot.content}
                  </span>
                </div>
              )}
              <div className="hidden @[480px]:flex items-start gap-1.5">
                {detailTab === "video" ? (
                  <Badge variant="outline" className="text-[8px] px-1.5 py-0 shrink-0 mt-0.5 bg-violet-500/5 text-violet-600 dark:text-violet-400 border-violet-500/20 @[900px]:text-[9px]">
                    <Film className="size-2.5 mr-0.5" />
                    视频
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[8px] px-1.5 py-0 shrink-0 mt-0.5 bg-blue-500/5 text-blue-600 dark:text-blue-400 border-blue-500/20 @[900px]:text-[9px]">
                    <ImageIcon className="size-2.5 mr-0.5" />
                    画面
                  </Badge>
                )}
                <p className="text-[11px] @[640px]:text-[12px] @[900px]:text-[13px] @[1200px]:text-[14px] text-foreground/90 line-clamp-2 @[600px]:line-clamp-3 @[900px]:line-clamp-4 @[1200px]:line-clamp-5 leading-relaxed">
                  {detailTab === "video"
                    ? (shot.content?.trim() || "暂无分镜描述")
                    : (imagePromptSummary(shot) || "暂无画面提示词")}
                </p>
              </div>
            </div>

            <div className="hidden @[350px]:flex items-center gap-3 flex-wrap ">
              <div className="flex items-center gap-2 flex-wrap">
                {boundCharacters.length > 0 && (
                  <div className="flex items-center -space-x-1.5">
                    {boundCharacters.slice(0, 5).map((c) => (
                      <Tooltip key={c.id}>
                        <TooltipTrigger asChild>
                          <div className="size-[22px] rounded-full bg-muted border-2 border-card flex items-center justify-center overflow-hidden shrink-0 @[640px]:size-6 @[900px]:size-7" onClick={(e) => e.stopPropagation()}>
                            {c.imageUrl ? (
                              <PreviewableImage src={c.imageUrl} alt={c.name} className="size-full object-cover" />
                            ) : (
                              <User className="size-3.5 text-muted-foreground @[900px]:size-4" />
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">{c.name}</TooltipContent>
                      </Tooltip>
                    ))}
                    {boundCharacters.length > 5 && (
                      <div className="size-[22px] rounded-full bg-muted border-2 border-card flex items-center justify-center text-[8px] text-muted-foreground font-medium shrink-0 @[640px]:size-6 @[900px]:size-7 @[900px]:text-[9px]">
                        +{boundCharacters.length - 5}
                      </div>
                    )}
                  </div>
                )}

                {boundScene && (
                  <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-full px-1.5 py-0.5 font-medium @[900px]:text-[10px]">
                    <MapPin className="size-3.5 shrink-0 @[900px]:size-4" />
                    {boundScene.name}
                  </span>
                )}

                {boundProps.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-[9px] bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-full px-1.5 py-0.5 font-medium @[900px]:text-[10px]">
                    <Package className="size-3.5 shrink-0 @[900px]:size-4" />
                    {boundProps.length === 1
                      ? boundProps[0].name
                      : `${boundProps[0].name} +${boundProps.length - 1}`}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex flex-col items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); if (!isGeneratingImage) handleGenerateImage() }}
            className={cn(
              "rounded-lg p-2 transition-colors",
              isGeneratingImage ? "opacity-40 cursor-not-allowed" : "hover:bg-primary/10"
            )}
            title={shot.imageUrl ? "重新生成画面" : "生成画面"}
            disabled={isGeneratingImage}
          >
            <ImageIcon className={cn("size-3.5", isGeneratingImage ? "text-muted-foreground" : "text-primary/70 hover:text-primary")} />
          </button>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={(e) => { e.stopPropagation(); if (shot.imageUrl) handleGenerateVideo() }}
                className={cn(
                  "rounded-lg p-2 transition-colors",
                  shot.imageUrl
                    ? "hover:bg-violet-500/10"
                    : "opacity-40 cursor-not-allowed"
                )}
                title={shot.videoUrl ? "重新生成视频" : "生成视频"}
                disabled={!shot.imageUrl || isGeneratingVideo}
              >
                <Video className={cn(
                  "size-3.5",
                  shot.imageUrl ? "text-violet-500/70 hover:text-violet-500" : "text-muted-foreground/40"
                )} />
              </button>
            </TooltipTrigger>
            {!shot.imageUrl && (
              <TooltipContent side="left" className="text-xs">请先生成画面</TooltipContent>
            )}
          </Tooltip>
          <button
            onClick={(e) => { e.stopPropagation(); handleDuplicate() }}
            className="rounded-lg p-2 hover:bg-muted transition-colors"
            title="复制"
          >
            <Copy className="size-3.5 text-muted-foreground hover:text-foreground" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete() }}
            className="rounded-lg p-2 hover:bg-muted transition-colors"
            title="删除"
          >
            <Trash2 className="size-3.5 text-destructive/70 hover:text-destructive" />
          </button>
        </div>
      </div>

    </div>
  )
})
