"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, ListChecks, AlertTriangle, ArrowLeft } from "lucide-react"
import type { Episode } from "@/lib/types"

interface ScriptEmptyStateProps {
  episodes: Episode[]
  onGenerateAll: () => void
  onSelectEpisodes: () => void
  onGoToOutline: () => void
}

export function ScriptEmptyState({
  episodes,
  onGenerateAll,
  onSelectEpisodes,
  onGoToOutline,
}: ScriptEmptyStateProps) {
  if (episodes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <AlertTriangle className="size-10 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-base font-medium mb-2">暂无分集大纲数据</h3>
        <p className="text-sm text-muted-foreground mb-4">
          请先生成分集大纲，再进行剧本生成
        </p>
        <Button onClick={onGoToOutline}>
          <ArrowLeft className="size-4" />
          前往分集大纲
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-dashed p-8 text-center">
      <Sparkles className="size-10 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-base font-medium mb-2">尚未生成剧本</h3>
      <p className="text-sm text-muted-foreground mb-6">
        基于已确认的 {episodes.length} 个分集大纲，AI 将为每集生成结构化剧本
      </p>

      <Card className="mb-6 mx-auto max-w-lg">
        <CardContent className="py-3">
          <p className="text-xs text-muted-foreground mb-2">可用分集：</p>
          <div className="flex flex-wrap gap-1.5 justify-center">
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
        </CardContent>
      </Card>

      <div className="flex items-center justify-center gap-3">
        <Button onClick={onGenerateAll}>
          <Sparkles className="size-4" />
          AI 生成全部剧本
        </Button>
        <Button variant="outline" onClick={onSelectEpisodes}>
          <ListChecks className="size-4" />
          选择分集生成
        </Button>
      </div>
    </div>
  )
}
