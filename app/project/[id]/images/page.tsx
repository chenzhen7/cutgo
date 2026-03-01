import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function ImagesPage() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">画面生成</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            自动或手动生成场景图、角色图和动态帧
          </p>
        </div>
        <Button>批量生成</Button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardContent className="py-4">
              <div className="flex h-40 items-center justify-center rounded bg-muted text-sm text-muted-foreground">
                画面 {i}
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">镜头 {i}</span>
                <Button variant="outline" size="sm" className="text-xs">
                  重新生成
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
