"use client"

import { Clapperboard, Settings, Play, AlertTriangle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface VideoEmptyStateProps {
  projectId: string
  episodeCount: number
  totalShots: number
  shotsWithImage: number
  onConfigure: () => void
  onStartAll: () => void
  isStarting: boolean
}

export function VideoEmptyState({
  projectId,
  episodeCount,
  totalShots,
  shotsWithImage,
  onConfigure,
  onStartAll,
  isStarting,
}: VideoEmptyStateProps) {
  const router = useRouter()
  const missingImages = totalShots - shotsWithImage
  const coveragePercent = totalShots > 0 ? Math.round((shotsWithImage / totalShots) * 100) : 0

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <Clapperboard className="h-8 w-8 text-primary" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-foreground">尚未开始视频合成</h3>
      <p className="mb-6 text-sm text-muted-foreground">
        已就绪：{episodeCount} 个分集 · {totalShots} 个镜头 · {shotsWithImage} 张画面（{coveragePercent}% 覆盖）
      </p>

      {missingImages > 0 && (
        <div className="mb-6 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="text-left">
            <p>{missingImages} 个镜头尚无画面，合成时将使用占位图</p>
            <button
              onClick={() => router.push(`/project/${projectId}/images`)}
              className="mt-1 flex items-center gap-1 text-amber-700 underline-offset-2 hover:underline dark:text-amber-400"
            >
              前往画面生成补全 <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center gap-3">
        <Button variant="outline" onClick={onConfigure} className="gap-2">
          <Settings className="h-4 w-4" />
          配置合成参数
        </Button>
        <Button onClick={onStartAll} disabled={isStarting} className="gap-2">
          <Play className="h-4 w-4" />
          {isStarting ? "启动中..." : "一键合成全部分集"}
        </Button>
      </div>
    </div>
  )
}
