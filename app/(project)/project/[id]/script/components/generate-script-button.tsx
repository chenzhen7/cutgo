"use client"

import { Button } from "@/components/ui/button"
import { NotebookText, Loader2 } from "lucide-react"
import type { ScriptGenerateStatus } from "@/lib/types"

interface GenerateScriptButtonProps {
  generateStatus: ScriptGenerateStatus
  disabled?: boolean
  onClick: () => void
}

export function GenerateScriptButton({
  generateStatus,
  disabled,
  onClick,
}: GenerateScriptButtonProps) {
  const isGenerating = generateStatus === "generating"

  if (isGenerating) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Loader2 className="size-4 animate-spin" />
        生成中...
      </Button>
    )
  }

  return (
    <Button
   
      size="sm"
      disabled={disabled}
      onClick={onClick}
    >
      <NotebookText className="size-4" />
      生成剧本
    </Button>
  )
}
