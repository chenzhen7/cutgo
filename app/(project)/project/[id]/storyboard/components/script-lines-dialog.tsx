"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import type { Storyboard } from "@/lib/types"

interface ScriptLinesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  storyboard: Storyboard | null
}

export function ScriptLinesDialog({
  open,
  onOpenChange,
  storyboard,
}: ScriptLinesDialogProps) {
  if (!storyboard) return null
  const scene = storyboard.scriptScene

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[70vh]">
        <DialogHeader>
          <DialogTitle>
            场景剧本 · {scene.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-1.5 text-sm">
          {scene.location && (
            <p className="text-xs text-muted-foreground">地点：{scene.location}</p>
          )}
          {scene.emotion && (
            <p className="text-xs text-muted-foreground">情绪：{scene.emotion}</p>
          )}
          {scene.description && (
            <p className="text-xs text-muted-foreground mb-2">描述：{scene.description}</p>
          )}
        </div>

        <div className="overflow-y-auto max-h-[50vh] space-y-2 mt-2">
          {scene.lines.map((line) => (
            <div key={line.id} className="rounded border px-3 py-2">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {line.type === "dialogue" ? "对白" : line.type === "narration" ? "旁白" : line.type === "action" ? "动作" : "转场"}
                </Badge>
                {line.character && (
                  <span className="text-xs font-medium">{line.character}</span>
                )}
                {line.emotion && (
                  <span className="text-xs text-muted-foreground">({line.emotion})</span>
                )}
                {line.duration && (
                  <span className="text-xs text-muted-foreground ml-auto">{line.duration}</span>
                )}
              </div>
              <p className="text-sm">{line.content}</p>
              {line.parenthetical && (
                <p className="text-xs text-muted-foreground mt-0.5">({line.parenthetical})</p>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
