import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function ExportPage() {
    return (
        <div className="p-6">
            <h2 className="text-xl font-semibold text-foreground">导出发布</h2>
            <p className="mt-1 text-sm text-muted-foreground">
                导出 1080P 9:16 视频，支持带字幕和无字幕版本
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between text-base">
                            带字幕版本
                            <Badge variant="secondary">1080P</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex aspect-video items-center justify-center rounded bg-muted text-sm text-muted-foreground">
                            预览
                        </div>
                        <Button className="mt-4 w-full">下载 MP4</Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between text-base">
                            无字幕版本
                            <Badge variant="secondary">1080P</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex aspect-video items-center justify-center rounded bg-muted text-sm text-muted-foreground">
                            预览
                        </div>
                        <Button className="mt-4 w-full">下载 MP4</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
