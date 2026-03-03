"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, usePathname } from "next/navigation"
import {
    ArrowLeft,
    Film,
    Palette,
    FolderOpen,
    Settings,
    ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { PIPELINE_STEPS } from "@/lib/pipeline"
import { cn } from "@/lib/utils"
import type { Project } from "@/lib/types"

export default function ProjectLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const params = useParams()
    const pathname = usePathname()
    const projectId = params.id as string

    const [project, setProject] = useState<Project | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch(`/api/projects/${projectId}`)
            .then((res) => res.json())
            .then((data) => {
                setProject(data)
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [projectId])

    const currentStepKey = pathname.split("/").pop() || "import"

    const managementLinks = [
        { key: "style", label: "视觉风格", icon: Palette },
        { key: "assets", label: "资产库", icon: FolderOpen },
    ]

    return (
        <div className="flex min-h-screen bg-background">
            {/* Sidebar */}
            <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-sidebar">
                {/* Header */}
                <div className="flex items-center gap-2 border-b border-sidebar-border px-4 py-3">
                    <Link href="/">
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div className="flex items-center gap-2">
                        <Film className="h-4 w-4 text-sidebar-foreground" />
                        <span className="text-sm font-semibold text-sidebar-foreground">
                            CutGo
                        </span>
                    </div>
                </div>

                {/* Project Info */}
                <div className="border-b border-sidebar-border px-4 py-3">
                    {loading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-3 w-20" />
                        </div>
                    ) : project ? (
                        <div>
                            <p className="truncate text-sm font-medium text-sidebar-foreground">
                                {project.name}
                            </p>
                            <div className="mt-1.5 flex items-center gap-1.5">
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                    {project.platform}
                                </Badge>
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                    {project.duration}
                                </Badge>
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                    {project.aspectRatio}
                                </Badge>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">项目不存在</p>
                    )}
                </div>

                {/* Management Section */}
                <div className="px-2 pt-3">
                    <p className="px-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        项目设置
                    </p>
                    <nav className="mt-1 flex flex-col gap-0.5">
                        {managementLinks.map((item) => {
                            const isActive = currentStepKey === item.key
                            return (
                                <Link
                                    key={item.key}
                                    href={`/project/${projectId}/${item.key}`}
                                >
                                    <div
                                        className={cn(
                                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                                            isActive
                                                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                                : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                                        )}
                                    >
                                        <item.icon className="h-4 w-4 shrink-0" />
                                        <span>{item.label}</span>
                                    </div>
                                </Link>
                            )
                        })}
                    </nav>
                </div>

                <Separator className="mx-4 my-2" />

                {/* Pipeline Steps */}
                <div className="px-2">
                    <p className="px-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        制作流程
                    </p>
                    <nav className="mt-1 flex flex-1 flex-col gap-0.5">
                        {PIPELINE_STEPS.map((step) => {
                            const isActive = currentStepKey === step.key
                            const Icon = step.icon
                            return (
                                <Link
                                    key={step.key}
                                    href={`/project/${projectId}/${step.key}`}
                                >
                                    <div
                                        className={cn(
                                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                                            isActive
                                                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                                : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                                        )}
                                    >
                                        <span className="flex h-5 w-5 items-center justify-center rounded text-xs font-medium">
                                            {step.step}
                                        </span>
                                        <Icon className="h-4 w-4 shrink-0" />
                                        <span>{step.label}</span>
                                    </div>
                                </Link>
                            )
                        })}
                    </nav>
                </div>

                <div className="flex-1" />
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">{children}</main>
        </div>
    )
}
