import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function ScriptPage() {
    return (
        <div className="p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-foreground">剧本生成</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        基于小说内容自动生成结构化剧本，支持手动编辑
                    </p>
                </div>
                <Button>生成剧本</Button>
            </div>

            <div className="mt-6 flex flex-col gap-4">
                {/* 场景列表占位 */}
                {[1, 2, 3].map((i) => (
                    <Card key={i}>
                        <CardContent className="py-4">
                            <div className="flex items-start justify-between">
                                <div className="flex flex-col gap-1">
                                    <p className="text-sm font-medium text-foreground">场景 {i}</p>
                                    <p className="text-xs text-muted-foreground">角色台词 / 情绪标签 / 时长估算 / BGM 建议</p>
                                </div>
                                <span className="rounded bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                  ~15s
                </span>
                            </div>
                            <div className="mt-3 rounded bg-muted p-3 text-sm text-muted-foreground">
                                剧本内容将在这里显示，支持直接编辑...
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
