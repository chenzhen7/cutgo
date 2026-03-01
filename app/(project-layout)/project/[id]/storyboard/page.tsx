import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function StoryboardPage() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">分镜生成</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            根据剧本自动生成分镜提示词与画面设计
          </p>
        </div>
        <Button>生成分镜</Button>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="flex items-start gap-4 py-4">
              <div className="flex h-24 w-36 shrink-0 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
                分镜 {i} 预览
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-foreground">镜头 {i}</p>
                <p className="text-xs text-muted-foreground">类型：近景 | 运动：推进 | 时长：3s</p>
                <p className="mt-1 rounded bg-muted p-2 text-xs text-muted-foreground">
                  画面描述 Prompt 将在这里显示，支持编辑...
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
