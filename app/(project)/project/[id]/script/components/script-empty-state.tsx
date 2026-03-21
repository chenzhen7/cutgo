"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, ArrowLeft, Sparkles } from "lucide-react"
import type { Episode } from "@/lib/types"

interface ScriptEmptyStateProps {
  episodes: Episode[]
  onGoToImport: () => void
}

export function ScriptEmptyState({
  episodes,
  onGoToImport,
}: ScriptEmptyStateProps) {
  if (episodes.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <AlertTriangle className="size-10 text-muted-foreground/40" />
        <div className="text-center">
          <p className="text-sm font-medium">暂无分集数据</p>
          <p className="mt-1 text-xs text-muted-foreground">
            请在小说导入中确认导入，系统会按所选章节自动生成分集
          </p>
        </div>
        <Button onClick={onGoToImport}>
          <ArrowLeft className="size-4" />
          返回小说导入
        </Button>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <Sparkles className="size-10 text-muted-foreground/40" />
      <div className="text-center">
        <p className="text-sm font-medium">尚未生成剧本</p>
        <p className="mt-1 text-xs text-muted-foreground">
          共 {episodes.length} 个分集（按小说章节划分）。请点击右上角「AI
          生成剧本」，在对话框中勾选要生成的章节（将生成该章下全部分集）
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
    </div>
  )
}
