"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Loader2 } from "lucide-react"

const STAGES = [
  "正在拆分文本结构...",
  "正在识别角色...",
  "正在分析剧情结构...",
  "正在生成故事大纲...",
  "正在整理分析结果...",
]

export function AnalysisProgress() {
  const [stageIndex, setStageIndex] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const stageInterval = setInterval(() => {
      setStageIndex((i) => (i < STAGES.length - 1 ? i + 1 : i))
    }, 3000)

    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + 2, 90))
    }, 300)

    return () => {
      clearInterval(stageInterval)
      clearInterval(progressInterval)
    }
  }, [])

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-4 py-12">
        <Loader2 className="size-8 animate-spin text-primary" />
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm font-medium">{STAGES[stageIndex]}</p>
          <Progress value={progress} className="w-64 h-2" />
          <p className="text-xs text-muted-foreground">
            AI 正在分析您的小说文本，这可能需要 10-30 秒
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
