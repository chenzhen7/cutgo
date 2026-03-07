"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, ListChecks, BookOpen, AlertTriangle } from "lucide-react"
import type { Chapter } from "@/lib/types"

interface OutlineEmptyStateProps {
  chapters: Chapter[]
  novelConfirmed: boolean
  onGenerateAll: () => void
  onSelectChapters: () => void
  onGoToImport: () => void
}

export function OutlineEmptyState({
  chapters,
  novelConfirmed,
  onGenerateAll,
  onSelectChapters,
  onGoToImport,
}: OutlineEmptyStateProps) {
  if (!novelConfirmed) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <AlertTriangle className="size-10 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-base font-medium mb-2">请先完成小说导入</h3>
        <p className="text-sm text-muted-foreground mb-4">
          分集大纲需要基于已导入并确认的小说内容生成
        </p>
        <Button onClick={onGoToImport}>
          <BookOpen className="size-4" />
          前往小说导入
        </Button>
      </div>
    )
  }

  const selectedChapters = chapters.filter((ch) => ch.selected)

  return (
    <div className="rounded-lg border border-dashed p-8 text-center">
      <Sparkles className="size-10 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-base font-medium mb-2">尚未生成分集大纲</h3>
      <p className="text-sm text-muted-foreground mb-6">
        基于已导入的 {selectedChapters.length} 个章节，AI 将自动拆分为多集短剧大纲
      </p>

      {selectedChapters.length > 0 && (
        <Card className="mb-6 mx-auto max-w-md">
          <CardContent className="py-3">
            <p className="text-xs text-muted-foreground mb-2">可用章节：</p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {selectedChapters.map((ch) => (
                <Badge key={ch.id} variant="secondary" className="text-xs">
                  {ch.title || `第${ch.index + 1}章`}
                  <span className="ml-1 opacity-60">({ch.wordCount}字)</span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-center gap-3">
        <Button onClick={onGenerateAll}>
          <Sparkles className="size-4" />
          AI 生成全部大纲
        </Button>
        <Button variant="outline" onClick={onSelectChapters}>
          <ListChecks className="size-4" />
          选择章节生成
        </Button>
      </div>
    </div>
  )
}
