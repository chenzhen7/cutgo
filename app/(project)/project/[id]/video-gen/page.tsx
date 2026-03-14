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

    </div>
  )
}
