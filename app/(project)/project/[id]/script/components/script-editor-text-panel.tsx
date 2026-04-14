"use client"

import { Loader2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import type { RefObject } from "react"

interface ScriptEditorTextPanelProps {
  content: string
  lineNumbers: number[]
  lineCount: number
  wordCount: number
  isGeneratingScript: boolean
  textareaRef: RefObject<HTMLTextAreaElement | null>
  gutterRef: RefObject<HTMLDivElement | null>
  onChange: (value: string) => void
  onScrollSync: () => void
}

export function ScriptEditorTextPanel({
  content,
  lineNumbers,
  lineCount,
  wordCount,
  isGeneratingScript,
  textareaRef,
  gutterRef,
  onChange,
  onScrollSync,
}: ScriptEditorTextPanelProps) {
  return (
    <div className="relative min-w-0 flex flex-col h-full">
      <div className="flex-1 flex min-h-0 overflow-hidden bg-background">
        <div
          ref={gutterRef}
          className="pointer-events-none shrink-0 w-11 select-none overflow-y-auto overflow-x-hidden border-r border-border/60 bg-muted/25 py-3 pl-2 pr-1.5 text-right font-mono text-sm leading-relaxed text-muted-foreground/80 tabular-nums [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-hidden
        >
          {lineNumbers.map((n) => (
            <div key={n} className="min-h-[1.625em] leading-relaxed">
              {n}
            </div>
          ))}
        </div>
        <div className="flex-1 relative min-w-0 min-h-0">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => onChange(e.target.value)}
            onScroll={onScrollSync}
            placeholder="在此编辑剧本内容..."
            spellCheck={false}
            className="absolute inset-0 h-full w-full resize-none rounded-none border-0 bg-transparent py-3 pl-2 pr-4 font-mono text-sm leading-relaxed shadow-none focus-visible:ring-0 whitespace-pre overflow-x-auto overflow-y-auto"
          />
        </div>
      </div>
      {isGeneratingScript && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-[1px]">
          <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 shadow-sm">
            <Loader2 className="size-4 animate-spin text-primary" />
            <span className="text-sm text-foreground">正在生成分集剧本...</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 px-4 py-1.5 shrink-0 text-[11px] tabular-nums text-muted-foreground border-t">
        <span>{lineCount > 0 ? `${lineCount} 行` : "空内容"}</span>
        <span className="text-border select-none" aria-hidden>
          ·
        </span>
        <span className="font-medium text-foreground/75">
          {wordCount.toLocaleString()} 字
        </span>
      </div>
    </div>
  )
}
