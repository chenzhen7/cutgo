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
import type { Script, Episode } from "@/lib/types"

interface ConfirmScriptDialogProps {
  scripts: Script[]
  episodes: Episode[]
  onConfirm: () => void
}

export function ConfirmScriptDialog({
  scripts,
  episodes,
  onConfirm,
}: ConfirmScriptDialogProps) {
  const totalScenes = scripts.reduce((sum, s) => sum + s.scenes.length, 0)
  const totalLines = scripts.reduce(
    (sum, s) => sum + s.scenes.reduce((ss, sc) => ss + sc.lines.length, 0),
    0
  )
  const disabled = scripts.length === 0

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="lg" className="w-full" disabled={disabled}>
          确认剧本，进入角色生成
          <ArrowRight className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认剧本</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>确认后将进入角色生成阶段，当前剧本摘要：</p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>已生成剧本：{scripts.length}/{episodes.length} 集</li>
                <li>总场景数：{totalScenes} 个</li>
                <li>总台词行数：{totalLines} 行</li>
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
