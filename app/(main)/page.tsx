"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Plus,
  Clock,
  MoreHorizontal,
  Search,
  LayoutGrid,
  List,
  Trash2,
  ArrowUpDown,
  Filter,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { useProjectStore } from "@/store/project-store"
import { PLATFORM_PRESETS } from "@/lib/types"

const STEP_TOTAL = 7

type ViewMode = "grid" | "list"
type SortField = "updatedAt" | "createdAt" | "name"

function formatTime(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return "刚刚"
  if (minutes < 60) return `${minutes} 分钟前`
  if (hours < 24) return `${hours} 小时前`
  if (days < 30) return `${days} 天前`
  return date.toLocaleDateString("zh-CN")
}

export default function HomePage() {
  const router = useRouter()
  const { projects, loading, fetchProjects, deleteProject } = useProjectStore()

  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [filterPlatform, setFilterPlatform] = useState<string>("")
  const [sortField, setSortField] = useState<SortField>("updatedAt")
  const [deleteDialogId, setDeleteDialogId] = useState<string | null>(null)

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const filteredProjects = useMemo(() => {
    let result = [...projects]

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.tags?.toLowerCase().includes(q)
      )
    }

    if (filterPlatform) {
      result = result.filter((p) => p.platform === filterPlatform)
    }

    result.sort((a, b) => {
      if (sortField === "name") return a.name.localeCompare(b.name)
      return (
        new Date(b[sortField]).getTime() - new Date(a[sortField]).getTime()
      )
    })

    return result
  }, [projects, searchQuery, filterPlatform, sortField])

  async function handleDelete() {
    if (!deleteDialogId) return
    await deleteProject(deleteDialogId)
    setDeleteDialogId(null)
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">
              我的项目
            </h2>
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

        {/* Toolbar */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索项目名称、描述、标签..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Platform Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-3.5 w-3.5" />
                {filterPlatform || "全部平台"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilterPlatform("")}>
                全部平台
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {PLATFORM_PRESETS.map((p) => (
                <DropdownMenuItem
                  key={p.value}
                  onClick={() => setFilterPlatform(p.label)}
                >
                  {p.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <ArrowUpDown className="mr-2 h-3.5 w-3.5" />
                排序
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSortField("updatedAt")}>
                最近修改
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortField("createdAt")}>
                创建时间
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortField("name")}>
                名称
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View Toggle */}
          <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="h-7 w-7"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="h-7 w-7"
              onClick={() => setViewMode("list")}
            >
              <List className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-3">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="mt-2 h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="mt-3 h-1.5 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredProjects.length === 0 && (
          <div className="mt-16 flex flex-col items-center gap-4 text-center">
            <div className="rounded-full bg-muted p-4">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-medium">
                {projects.length === 0 ? "还没有项目" : "没有匹配的项目"}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {projects.length === 0
                  ? "创建你的第一个短剧项目，开始 AI 创作之旅"
                  : "试试调整搜索条件或筛选器"}
              </p>
            </div>
            {projects.length === 0 && (
              <Button onClick={() => router.push("/project/new")}>
                <Plus className="mr-2 h-4 w-4" />
                新建项目
              </Button>
            )}
          </div>
        )}

        {/* Grid View */}
        {!loading && filteredProjects.length > 0 && viewMode === "grid" && (
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <Card
                key={project.id}
                className="cursor-pointer transition-colors hover:border-foreground/20"
              >
                <Link href={`/project/${project.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base line-clamp-1">
                        {project.name}
                      </CardTitle>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          asChild
                          onClick={(e) => e.preventDefault()}
                        >
                          <span className="text-muted-foreground hover:text-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                          </span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.preventDefault()
                              router.push(`/project/${project.id}`)
                            }}
                          >
                            打开项目
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => {
                              e.preventDefault()
                              setDeleteDialogId(project.id)
                            }}
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                            删除项目
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {project.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {project.description}
                      </p>
                    )}
                    <CardDescription className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {project.platform}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {project.duration}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {project.aspectRatio}
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
                        {formatTime(project.updatedAt)}
                      </span>
                    </div>
                    <div className="mt-3 h-1.5 w-full rounded-full bg-secondary">
                      <div
                        className="h-1.5 rounded-full bg-primary transition-all"
                        style={{
                          width: `${(project.step / STEP_TOTAL) * 100}%`,
                        }}
                      />
                    </div>
                  </CardContent>
                </Link>
              </Card>
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
        )}

        {/* List View */}
        {!loading && filteredProjects.length > 0 && viewMode === "list" && (
          <div className="mt-8 flex flex-col gap-2">
            {filteredProjects.map((project) => (
              <Link key={project.id} href={`/project/${project.id}`}>
                <Card className="cursor-pointer transition-colors hover:border-foreground/20">
                  <div className="flex items-center gap-4 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">
                          {project.name}
                        </span>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {project.platform}
                        </Badge>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {project.duration}
                        </Badge>
                      </div>
                      {project.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {project.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-6 shrink-0 text-sm text-muted-foreground">
                      <span>
                        {project.stepLabel}（{project.step}/{STEP_TOTAL}）
                      </span>
                      <span className="flex items-center gap-1 text-xs">
                        <Clock className="h-3 w-3" />
                        {formatTime(project.updatedAt)}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          asChild
                          onClick={(e) => e.preventDefault()}
                        >
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.preventDefault()
                              router.push(`/project/${project.id}`)
                            }}
                          >
                            打开项目
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => {
                              e.preventDefault()
                              setDeleteDialogId(project.id)
                            }}
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                            删除项目
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Delete Dialog */}
      <AlertDialog
        open={!!deleteDialogId}
        onOpenChange={(open) => !open && setDeleteDialogId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除项目？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作不可撤销，项目下的所有数据将被永久删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
