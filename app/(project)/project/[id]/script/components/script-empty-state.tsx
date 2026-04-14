"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FilePlus, Sparkles } from "lucide-react"
import type { Episode } from "@/lib/types"
import { parseJsonArray } from "@/lib/utils"

interface ScriptEmptyStateProps {
  episodes: Episode[]
  onOpenGenerate?: () => void
  onCreateEpisode?: () => void
}

export function ScriptEmptyState({
  episodes,
  onOpenGenerate,
  onCreateEpisode,
}: ScriptEmptyStateProps) {
  if (episodes.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <Sparkles className="size-10 text-muted-foreground/40" />
        <div className="text-center">
          <p className="text-sm font-medium">开始创作第一集</p>
          <p className="mt-1 text-xs text-muted-foreground">
            点击「新建分集」，粘贴小说原文，AI 将自动生成剧本
          </p>
        </div>
        {onCreateEpisode && (
          <Button onClick={onCreateEpisode}>
            <FilePlus className="size-4" />
            新建分集
          </Button>
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
            <span className="ml-1 opacity-60">({parseJsonArray(ep.scenes).length}场)</span>
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
