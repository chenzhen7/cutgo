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
  const script = scriptShotPlan.script

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[70vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            剧本内容 · {script.title}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0">
          {script.content ? (
            <div className="text-sm leading-relaxed whitespace-pre-wrap font-mono p-1">
              {script.content}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              暂无剧本内容
            </p>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
