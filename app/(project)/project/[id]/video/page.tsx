import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function VideoPage() {
    return (
        <div className="p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-foreground">视频合成</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        自动加字幕、配音、BGM 和转场，合成 MP4
                    </p>
                </div>
                <Button>开始合成</Button>
            </div>

            <div className="mt-6 flex flex-col gap-6">
                {/* 视频预览占位 */}
                <Card>
                    <CardContent className="py-4">
                        <div className="flex aspect-video items-center justify-center rounded bg-muted text-muted-foreground">
                            视频预览区域
                        </div>
                    </CardContent>
                </Card>

                {/* 时间线占位 */}
                <Card className="border-dashed">
                    <CardContent className="flex min-h-[100px] items-center justify-center">
                        <p className="text-sm text-muted-foreground">
                            时间线编辑器将在这里展示
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
