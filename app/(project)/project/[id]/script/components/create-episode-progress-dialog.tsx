"use client"

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Circle, Loader2, Sparkles, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

export type CreateEpisodeProgressStepStatus = "pending" | "running" | "completed" | "error"

export interface CreateEpisodeProgressStep {
  key: string
  label: string
  description: string
  status: CreateEpisodeProgressStepStatus
}

interface CreateEpisodeProgressDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  episodeTitle: string
  steps: CreateEpisodeProgressStep[]
  statusMessage: string
  errorMessage: string | null
  finished: boolean
}

function StepIcon({ status }: { status: CreateEpisodeProgressStepStatus }) {
  if (status === "completed") {
    return <CheckCircle2 className="size-4 text-emerald-500" />
  }
  if (status === "running") {
    return <Loader2 className="size-4 animate-spin text-primary" />
  }
  if (status === "error") {
    return <AlertTriangle className="size-4 text-destructive" />
  }
  return <Circle className="size-4 text-muted-foreground/60" />
}

export function CreateEpisodeProgressDialog({
  open,
  onOpenChange,
  episodeTitle,
  steps,
  statusMessage,
  errorMessage,
  finished,
}: CreateEpisodeProgressDialogProps) {
  const completedCount = steps.filter((step) => step.status === "completed").length
  const progressValue = steps.length === 0 ? 0 : (completedCount / steps.length) * 100

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            处理中
          </DialogTitle>
          <p className="text-sm text-muted-foreground font-normal pt-1">
            《{episodeTitle}》已创建完成，系统正在继续处理后续步骤。
          </p>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{statusMessage}</span>
              <span>{Math.round(progressValue)}%</span>
            </div>
            <Progress value={progressValue} className="h-2" />
          </div>

          <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
            {steps.map((step) => (
              <div
                key={step.key}
                className={cn(
                  "flex items-start gap-3 rounded-md px-2 py-2 transition-colors",
                  step.status === "running" && "bg-background",
                  step.status === "error" && "bg-destructive/5"
                )}
              >
                <div className="pt-0.5">
                  <StepIcon status={step.status} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{step.label}</span>
                    {step.status === "running" && <Badge variant="secondary">进行中</Badge>}
                    {step.status === "completed" && <Badge variant="secondary">已完成</Badge>}
                    {step.status === "error" && <Badge variant="destructive">失败</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          {errorMessage ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2">
              <p className="text-xs text-destructive">{errorMessage}</p>
            </div>
          ) : (
            <div className="rounded-lg border bg-background px-3 py-2">
              <p className="text-xs text-muted-foreground">
                你可以先继续编辑当前分集，处理完成后剧本和资产会自动刷新到页面上。
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {finished ? "关闭" : "后台继续"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
