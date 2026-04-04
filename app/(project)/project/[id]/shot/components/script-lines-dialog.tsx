"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { ScriptShotPlan } from "@/lib/types"

interface ScriptLinesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  scriptShotPlan: ScriptShotPlan | null
}

export function ScriptLinesDialog({
  open,
  onOpenChange,
  scriptShotPlan,
}: ScriptLinesDialogProps) {
  if (!scriptShotPlan) return null
  const episode = scriptShotPlan.episode

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl h-[80vh] !flex !flex-col p-0 overflow-hidden outline-none">
        <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
          <DialogTitle>
            剧本内容 · {episode.title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6 custom-scrollbar">
          {episode.script ? (
            <div className="text-sm leading-relaxed whitespace-pre-wrap break-words font-mono py-2">
              {episode.script}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-12">
              暂无剧本内容
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
