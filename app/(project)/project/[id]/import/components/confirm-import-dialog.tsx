"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { ArrowRight, BookOpen, Users, Zap, FileText } from "lucide-react"
import type { Chapter, NovelCharacter, PlotEvent } from "@/lib/types"

interface ConfirmImportDialogProps {
  wordCount: number
  chapters: Chapter[]
  characters: NovelCharacter[]
  events: PlotEvent[]
  onConfirm: () => Promise<void>
  disabled?: boolean
}

export function ConfirmImportDialog({
  wordCount,
  chapters,
  characters,
  events,
  onConfirm,
  disabled,
}: ConfirmImportDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="lg" className="w-full" disabled={disabled}>
          确认导入，进入分集大纲
          <ArrowRight className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认导入</AlertDialogTitle>
          <AlertDialogDescription>
            确认后将保存所有分析结果，并进入分集大纲阶段。
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid grid-cols-2 gap-3 py-2">
          <div className="flex items-center gap-2 text-sm">
            <FileText className="size-4 text-muted-foreground" />
            <span>{wordCount.toLocaleString()} 字</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <BookOpen className="size-4 text-muted-foreground" />
            <span>{chapters.length} 个章节</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="size-4 text-muted-foreground" />
            <span>{characters.length} 个角色</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Zap className="size-4 text-muted-foreground" />
            <span>{events.length} 个事件</span>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            确认导入
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
