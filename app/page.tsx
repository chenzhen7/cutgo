import Link from "next/link"
import { Plus, Film, Clock, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AppSidebar } from "@/app/components/app-sidebar"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"


const MOCK_PROJECTS = [
    {
        id: "1",
        name: "霸道总裁爱上我",
        platform: "抖音",
        duration: "60s",
        step: 3,
        stepLabel: "剧本生成",
        updatedAt: "2 小时前",
    },
    {
        id: "2",
        name: "重生之都市修仙",
        platform: "TikTok",
        duration: "90s",
        step: 5,
        stepLabel: "分镜生成",
        updatedAt: "1 天前",
    },
    {
        id: "3",
        name: "闪婚后大佬马甲藏不住了",
        platform: "小红书",
        duration: "30s",
        step: 1,
        stepLabel: "小说导入",
        updatedAt: "3 天前",
    },
]

const STEP_TOTAL = 8

export default function HomePage() {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <div className="min-h-screen bg-background">


                    {/* Main */}
                    <main className="mx-auto max-w-6xl px-6 py-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-semibold text-foreground">我的项目</h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    管理你的短剧项目，从小说到视频一站式完成
                                </p>
                            </div>
                            <Link href="/project/new">
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    新建项目
                                </Button>
                            </Link>
                        </div>

                        {/* Project Grid */}
                        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {MOCK_PROJECTS.map((project) => (
                                <Link key={project.id} href={`/project(/${project.id}`}>
                                    <Card className="cursor-pointer transition-colors hover:border-foreground/20">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-start justify-between">
                                                <CardTitle className="text-base">{project.name}</CardTitle>
                                                <span className="text-muted-foreground hover:text-foreground">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </span>
                                            </div>
                                            <CardDescription className="flex items-center gap-2">
                                                <Badge variant="secondary" className="text-xs">
                                                    {project.platform}
                                                </Badge>
                                                <Badge variant="outline" className="text-xs">
                                                    {project.duration}
                                                </Badge>
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">
                                                    进度：{project.stepLabel}（{project.step}/{STEP_TOTAL}）
                                                </span>
                                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Clock className="h-3 w-3" />
                                                    {project.updatedAt}
                                                </span>
                                            </div>
                                            {/* Progress bar */}
                                            <div className="mt-3 h-1.5 w-full rounded-full bg-secondary">
                                                <div
                                                    className="h-1.5 rounded-full bg-foreground transition-all"
                                                    style={{ width: `${(project.step / STEP_TOTAL) * 100}%` }}
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}

                            {/* New Project Card */}
                            <Link href="/project/new">
                                <Card className="flex min-h-[180px] cursor-pointer items-center justify-center border-dashed transition-colors hover:border-foreground/20">
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                        <Plus className="h-8 w-8" />
                                        <span className="text-sm">新建项目</span>
                                    </div>
                                </Card>
                            </Link>
                        </div>
                    </main>
                </div>
            </SidebarInset>
        </SidebarProvider>

    )
}
