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
  const totalWords = scripts.reduce((sum, s) => sum + s.content.length, 0)
  const disabled = scripts.length === 0

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="lg" className="w-full" disabled={disabled}>
          确认剧本，进入分镜生成
          <ArrowRight className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认剧本</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>确认后将进入分镜生成阶段，当前剧本摘要：</p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>已生成剧本：{scripts.length}/{episodes.length} 集</li>
                <li>总字数：{totalWords} 字</li>
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
