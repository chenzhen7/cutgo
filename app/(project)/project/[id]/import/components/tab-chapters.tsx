"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronDown, ChevronRight } from "lucide-react"
import type { Chapter } from "@/lib/types"

interface TabChaptersProps {
  chapters: Chapter[]
  onToggle: (chapterId: string, selected: boolean) => void
  onToggleAll?: (selected: boolean) => void
}

function ChapterItem({
  chapter,
  onToggle,
}: {
  chapter: Chapter
  onToggle: (chapterId: string, selected: boolean) => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border rounded-lg">
      <div
        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/50"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? (
          <ChevronDown className="size-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="size-4 text-muted-foreground shrink-0" />
        )}
        <Checkbox
          checked={chapter.selected}
          onCheckedChange={(checked) => {
            onToggle(chapter.id, checked === true)
          }}
          onClick={(e) => e.stopPropagation()}
        />
        <span className="flex-1 text-sm font-medium">
          {chapter.title || `段落组 ${chapter.index + 1}`}
        </span>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px]">
            {chapter.paragraphs.length} 段
          </Badge>
          <span className="text-xs text-muted-foreground">
            {chapter.wordCount.toLocaleString()} 字
          </span>
        </div>
      </div>

      {expanded && chapter.paragraphs.length > 0 && (
        <div className="border-t px-3 py-2 bg-muted/20">
          <div className="flex flex-col gap-1.5">
            {chapter.paragraphs.map((p) => (
              <div
                key={p.id}
                className="flex items-start gap-2 text-xs py-1.5 px-2 rounded hover:bg-muted/50"
              >
                <span className="text-muted-foreground shrink-0 w-6 text-right">
                  {p.index + 1}.
                </span>
                <span className="flex-1 text-muted-foreground line-clamp-2">
                  {p.content.slice(0, 80)}
                  {p.content.length > 80 && "..."}
                </span>
                <span className="text-muted-foreground/60 shrink-0">
                  {p.wordCount} 字
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function TabChapters({ chapters, onToggle, onToggleAll }: TabChaptersProps) {
  if (chapters.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        暂无章节数据
      </div>
    )
  }

  const totalParagraphs = chapters.reduce((sum, ch) => sum + ch.paragraphs.length, 0)
  const totalWords = chapters.reduce((sum, ch) => sum + ch.wordCount, 0)
  const selectedCount = chapters.filter((c) => c.selected).length

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>{chapters.length} 个章节</span>
          <span>{totalParagraphs} 个段落</span>
          <span>{totalWords.toLocaleString()} 字</span>
          <span>· 已选 {selectedCount}/{chapters.length}</span>
        </div>
        {onToggleAll && (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => onToggleAll(true)}>
              全选
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onToggleAll(false)}>
              取消全选
            </Button>
          </div>
        )}
      </div>
      <ScrollArea className="max-h-[400px] overflow-y-auto">
        <div className="flex flex-col gap-2">
          {chapters.map((ch) => (
            <ChapterItem key={ch.id} chapter={ch} onToggle={onToggle} />
          ))}
        </div>
      </ScrollArea>
    </>
  )
}
