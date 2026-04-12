"use client"

import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface GenerateShotTypeDialogProps {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function GenerateShotTypeDialog({
  open,
  onCancel,
  onConfirm,
}: GenerateShotTypeDialogProps) {
  const [submitting, setSubmitting] = useState(false)

  React.useEffect(() => {
    if (open) {
      setSubmitting(false)
    }
  }, [open])

  const handleConfirm = async () => {
    setSubmitting(true)
    try {
      await onConfirm()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-semibold">生成分镜</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
            <p className="text-xs text-destructive">
              当前分集已有分镜，重新生成将<span className="font-semibold">永久删除</span>所有现有镜头、画面及视频，且无法恢复。
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={submitting}>
            取消
          </Button>
          <Button onClick={handleConfirm} variant="destructive" disabled={submitting}>
            确认重新生成
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
