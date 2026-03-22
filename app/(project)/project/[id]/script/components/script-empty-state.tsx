"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, ArrowLeft, ListOrdered, Sparkles } from "lucide-react"
import type { Chapter, Episode } from "@/lib/types"
import { formatChapterOrdinalLabel } from "@/lib/novel-utils"

interface ScriptEmptyStateProps {
  episodes: Episode[]
  chapters: Chapter[]
  onGoToImport: () => void
  onOpenGenerate?: () => void
  onOpenOutlineDialog?: () => void
}

export function ScriptEmptyState({
  episodes,
  chapters,
  onGoToImport,
  onOpenGenerate,
  onOpenOutlineDialog,
}: ScriptEmptyStateProps) {
  if (episodes.length === 0 && chapters.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <AlertTriangle className="size-10 text-muted-foreground/40" />
        <div className="text-center">
          <p className="text-sm font-medium">暂无章节数据</p>
          <p className="mt-1 text-xs text-muted-foreground">
            请先在小说导入中上传并解析小说，识别章节后再生成剧本
          </p>
        </div>
        <Button onClick={onGoToImport}>
          <ArrowLeft className="size-4" />
          返回小说导入
        </Button>
      </div>
    )
  }

  if (episodes.length === 0 && chapters.length > 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <Sparkles className="size-10 text-muted-foreground/40" />
        <div className="text-center max-w-md">
          <p className="text-sm font-medium">尚未创建分集</p>
          
          <p className="mt-3 text-xs text-muted-foreground">
            已识别 {chapters.length} 个章节。请先在分集规划中创建分集，然后点击右上角「AI 生成剧本」为各分集生成剧本
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 justify-center max-w-lg">
          {chapters.slice(0, 12).map((ch) => (
            <Badge key={ch.id} variant="secondary" className="text-xs">
              {formatChapterOrdinalLabel(ch.index)}
              {ch.title?.trim() ? ` ${ch.title.trim()}` : ""}
            </Badge>
          ))}
          {chapters.length > 12 && (
            <Badge variant="outline" className="text-xs">
              +{chapters.length - 12} 章
            </Badge>
          )}
        </div>
        {onOpenOutlineDialog && (
            <div className="mt-3 flex justify-center">
              <Button size="sm" onClick={onOpenOutlineDialog}>
                <ListOrdered className="size-4" />
                生成分集大纲
              </Button>
            </div>
          )}
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <Sparkles className="size-10 text-muted-foreground/40" />
      <div className="text-center">
        <p className="text-sm font-medium">尚未生成剧本</p>
        <p className="mt-1 text-xs text-muted-foreground">
          共 {episodes.length} 个分集。请点击右上角「AI 生成剧本」，勾选要生成的分集后开始生成
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5 justify-center max-w-lg">
        {episodes.slice(0, 10).map((ep) => (
          <Badge key={ep.id} variant="secondary" className="text-xs">
            {ep.title}
            <span className="ml-1 opacity-60">({ep.scenes.length}场)</span>
          </Badge>
        ))}
        {episodes.length > 10 && (
          <Badge variant="outline" className="text-xs">
            +{episodes.length - 10} 更多
          </Badge>
        )}
      </div>
      {onOpenGenerate && (
        <Button onClick={onOpenGenerate}>
          <Sparkles className="size-4" />
          选择分集生成剧本
        </Button>
      )}
    </div>
  )
}
