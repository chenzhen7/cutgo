"use client"

import { useParams } from "next/navigation"

export default function VideoPage() {
  const params = useParams()
  const projectId = params.id as string

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b px-6 py-4">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-foreground">视频合成</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            自动加字幕、配音、BGM，合成 MP4
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-8">
        <div className="max-w-md text-center">
          <h3 className="text-lg font-medium mb-2">准备开始重新设计</h3>
          <p className="text-sm text-muted-foreground">
            内容已清空，你可以开始重新实现视频合成页面的逻辑。
          </p>
        </div>
      </div>
    </div>
  )
}
