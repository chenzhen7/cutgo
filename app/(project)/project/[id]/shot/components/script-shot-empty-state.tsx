"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { LayoutGrid, Sparkles } from "lucide-react"
import type { Episode } from "@/lib/types"

interface ScriptShotEmptyStateProps {
  episodes: Episode[]
  onGenerateAll: () => void
  onSelectEpisodes: () => void
  onGoToScript: () => void
}

export function ScriptShotEmptyState({
  episodes,
  onGenerateAll,
  onSelectEpisodes,
  onGoToScript: _onGoToScript,
}: ScriptShotEmptyStateProps) {
  const episodesWithScript = episodes.filter((ep) => ep.script)

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16">
        <LayoutGrid className="size-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">尚未生成分镜</h3>
        <p className="text-sm text-muted-foreground mb-2 text-center max-w-md">
          已有 {episodesWithScript.length} 集剧本数据。点击下方按钮，AI 将为每集剧本自动生成分镜设计。
        </p>
        <p className="text-xs text-muted-foreground mb-6">包含景别、镜头运动、画面构图和画面 Prompt</p>

        {episodesWithScript.length > 0 && (
          <div className="mb-6 w-full max-w-lg">
            <p className="text-xs font-medium text-muted-foreground mb-2">剧本预览：</p>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {episodesWithScript.slice(0, 6).map((ep) => (
                <div key={ep.id} className="rounded border bg-muted/30 px-3 py-2 text-xs">
                  <span className="font-medium">{ep.title}</span>
                  <span className="text-muted-foreground ml-1">· {ep.script.length}字</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Button onClick={onGenerateAll}>
            <Sparkles className="size-4 mr-2" />
            AI 生成全部分镜
          </Button>
          <Button variant="outline" onClick={onSelectEpisodes}>
            选择分集生成...
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
