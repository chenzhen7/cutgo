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
import { ArrowRight } from "lucide-react"
import type { Episode, Chapter } from "@/lib/types"

interface ConfirmOutlineDialogProps {
  episodes: Episode[]
  chapters: Chapter[]
  onConfirm: () => void
}

export function ConfirmOutlineDialog({
  episodes,
  chapters,
  onConfirm,
}: ConfirmOutlineDialogProps) {
  const totalScenes = episodes.reduce((sum, ep) => sum + ep.scenes.length, 0)
  const coveredChapterIds = new Set(episodes.map((ep) => ep.chapterId))
  const selectedChapters = chapters.filter((ch) => ch.selected)
  const disabled = episodes.length === 0

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="lg" className="w-full" disabled={disabled}>
          确认大纲，进入资产生成
          <ArrowRight className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认分集大纲</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>确认后将进入资产生成阶段（自动提取角色/场景/道具），当前大纲摘要：</p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>总集数：{episodes.length} 集</li>
                <li>总场景数：{totalScenes} 个</li>
                <li>覆盖章节：{coveredChapterIds.size}/{selectedChapters.length} 章</li>
              </ul>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            确认并继续
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
