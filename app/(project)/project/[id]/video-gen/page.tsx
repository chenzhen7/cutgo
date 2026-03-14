"use client"

import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Video, Play, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"

export default function VideoGenPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 模拟加载
    const timer = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  const handleConfirm = () => {
    router.push(`/project/${projectId}/video`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">视频生成</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            利用 AI 将静态分镜图片转化为动态视频片段
          </p>
        </div>
        <Button onClick={handleConfirm}>
          确认视频，进入合成
          <ArrowRight className="size-4 ml-2" />
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 模拟视频片段列表 */}
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="overflow-hidden group">
            <CardContent className="p-0 relative">
              <div className="aspect-video bg-muted flex items-center justify-center relative overflow-hidden">
                <Video className="size-12 text-muted-foreground/20" />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button size="icon" variant="secondary" className="rounded-full">
                    <Play className="size-4 fill-current" />
                  </Button>
                </div>
                <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/60 text-[10px] text-white font-mono">
                  00:03
                </div>
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-muted-foreground">镜头 {i}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    已生成
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  镜头描述：角色在森林中行走，阳光透过树叶洒下斑驳光影。
                </p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 h-7 text-[10px]">
                    重新生成
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 h-7 text-[10px]">
                    调整参数
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
