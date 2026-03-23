"use client"

import { Button } from "@/components/ui/button"
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
import { ArrowRight } from "lucide-react"
import type { ScriptShotPlan } from "@/lib/types"

interface ConfirmStoryboardDialogProps {
  scriptShotPlans: ScriptShotPlan[]
  onConfirm: () => void
}

export function ConfirmStoryboardDialog({
  scriptShotPlans,
  onConfirm,
}: ConfirmStoryboardDialogProps) {
  const generatedPlans = scriptShotPlans.filter((sb) => sb.shots.length > 0)
  const totalShots = scriptShotPlans.reduce((sum, sb) => sum + sb.shots.length, 0)
  const hasScriptShots = generatedPlans.length > 0

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button className="px-8" disabled={!hasScriptShots}>
          确认分镜，进入视频合成
          <ArrowRight className="size-4 ml-2" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认分镜设计</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>确认后将进入视频合成阶段，您仍可以返回修改分镜。</p>
              <div className="rounded-lg bg-muted p-3 space-y-1">
                <p className="text-sm">
                  已生成分镜：<span className="font-medium">{generatedPlans.length}</span> 个场景
                </p>
                <p className="text-sm">
                  总画面数：<span className="font-medium">{totalShots}</span> 个
                </p>
              </div>
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
