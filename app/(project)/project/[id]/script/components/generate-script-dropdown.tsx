"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Sparkles, ChevronDown, Loader2, SkipForward, RefreshCw, ListChecks } from "lucide-react"
import type { ScriptGenerateStatus } from "@/lib/types"

interface GenerateScriptDropdownProps {
  generateStatus: ScriptGenerateStatus
  onGenerateAll: (mode: "skip_existing" | "overwrite") => void
  onSelectEpisodes: () => void
}

export function GenerateScriptDropdown({
  generateStatus,
  onGenerateAll,
  onSelectEpisodes,
}: GenerateScriptDropdownProps) {
  const isGenerating = generateStatus === "generating"

  if (isGenerating) {
    return (
      <Button disabled>
        <Loader2 className="size-4 animate-spin" />
        生成中...
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>
          <Sparkles className="size-4" />
          AI 生成剧本
          <ChevronDown className="size-3.5 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => onGenerateAll("skip_existing")}>
          <SkipForward className="size-4" />
          生成全部剧本（跳过已生成）
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onGenerateAll("overwrite")}>
          <RefreshCw className="size-4" />
          生成全部剧本（全部重新生成）
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onSelectEpisodes}>
          <ListChecks className="size-4" />
          选择分集生成...
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
