"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { AlertCircle, Loader2, RefreshCw, Search, TriangleAlert } from "lucide-react"
import { toast } from "sonner"
import { apiFetch, ApiError } from "@/lib/api-client"
import { AI_TASK_STATUSES, AI_TASK_STATUS_LABEL, AI_TASK_TYPES, AI_TASK_TYPE_LABEL } from "@/lib/ai-task"
import type { AiTask, AiTaskListResponse } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

type AiTaskDetail = AiTask & {
  parsedConfigSnapshot?: unknown
  parsedInputPayload?: unknown
  parsedOutputPayload?: unknown
  events?: { key: string; label: string; at: string; status?: string; detail?: string | null }[]
}

const PAGE_SIZE = 20

function formatDateTime(value?: string | null) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleString("zh-CN", { hour12: false })
}

function formatDuration(startedAt?: string | null, finishedAt?: string | null) {
  if (!startedAt || !finishedAt) return "-"
  const start = new Date(startedAt).getTime()
  const end = new Date(finishedAt).getTime()
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return "-"
  const seconds = Math.round((end - start) / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${minutes}m ${rest}s`
}

function statusBadgeVariant(status: AiTask["status"]) {
  if (status === "failed") return "destructive" as const
  if (status === "succeeded") return "default" as const
  if (status === "cancelled") return "outline" as const
  if (status === "running") return "secondary" as const
  return "outline" as const
}

function renderJson(value: unknown) {
  if (value === null || value === undefined) return "-"
  if (typeof value === "string") return value
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

export default function ProjectTasksPage() {
  const params = useParams()
  const projectId = params.id as string

  const [tasks, setTasks] = useState<AiTask[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const [keyword, setKeyword] = useState("")
  const [taskType, setTaskType] = useState("all")
  const [status, setStatus] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [sortBy, setSortBy] = useState("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [failedFirst, setFailedFirst] = useState(false)
  const [failedOnly, setFailedOnly] = useState(false)

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detail, setDetail] = useState<AiTaskDetail | null>(null)

  const loadTasks = useCallback(
    async (nextPage: number, showRefreshing = false) => {
      if (showRefreshing) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      try {
        const query = new URLSearchParams({
          projectId,
          page: String(nextPage),
          pageSize: String(PAGE_SIZE),
          sortBy,
          sortOrder,
        })

        if (keyword.trim()) query.set("keyword", keyword.trim())
        if (taskType !== "all") query.set("taskType", taskType)
        if (status !== "all") query.set("status", status)
        if (startDate) query.set("startDate", startDate)
        if (endDate) query.set("endDate", endDate)
        if (failedOnly) query.set("status", "failed")

        const data = await apiFetch<AiTaskListResponse>(`/api/ai-tasks?${query.toString()}`)
        setTasks(data.items)
        setTotalPages(data.pagination.totalPages)
        setTotal(data.pagination.total)
        setPage(data.pagination.page)
      } catch (err) {
        if (err instanceof ApiError) {
          toast.error(err.message)
        } else {
          toast.error("读取任务列表失败，请稍后重试")
        }
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [projectId, sortBy, sortOrder, keyword, taskType, status, startDate, endDate, failedOnly]
  )

  useEffect(() => {
    void loadTasks(1)
  }, [loadTasks])

  const handleSearch = () => {
    void loadTasks(1)
  }

  const handleRefresh = () => {
    void loadTasks(page, true)
  }

  const sortedTasks = useMemo(() => {
    if (!failedFirst) return tasks
    return [...tasks].sort((a, b) => {
      const aFailed = a.status === "failed" ? 0 : 1
      const bFailed = b.status === "failed" ? 0 : 1
      if (aFailed !== bFailed) return aFailed - bFailed
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [tasks, failedFirst])

  const openDetail = async (id: string) => {
    setSelectedTaskId(id)
    setDetail(null)
    setDetailLoading(true)
    try {
      const data = await apiFetch<AiTaskDetail>(`/api/ai-tasks/${id}`)
      setDetail(data)
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message)
      } else {
        toast.error("读取任务详情失败")
      }
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">任务中心</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              统一查看 LLM、图片、视频、TTS 任务状态，聚焦失败排障与执行追踪。
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleRefresh} disabled={refreshing || loading}>
              {refreshing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
              刷新
            </Button>
            <Button
              variant={failedOnly ? "default" : "outline"}
              onClick={() => {
                setFailedOnly((prev) => !prev)
              }}
            >
              仅看失败
            </Button>
            <Button disabled variant="outline">
              新建任务
            </Button>
          </div>
        </div>
      </div>

      <div className="shrink-0 border-b px-6 py-3">
        <div className="grid gap-2 lg:grid-cols-12">
          <div className="relative lg:col-span-3">
            <Search className="pointer-events-none absolute left-2 top-2.5 size-3.5 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="pl-7"
              placeholder="搜索任务ID / 模型 / 错误"
            />
          </div>
          <div className="lg:col-span-2">
            <Select value={taskType} onValueChange={setTaskType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="任务类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                {AI_TASK_TYPES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {AI_TASK_TYPE_LABEL[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="lg:col-span-2">
            <Select value={status} onValueChange={setStatus} disabled={failedOnly}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                {AI_TASK_STATUSES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {AI_TASK_STATUS_LABEL[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="lg:col-span-2">
            <Input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="lg:col-span-2">
            <Input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div className="lg:col-span-1">
            <Button className="w-full" onClick={handleSearch}>
              查询
            </Button>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger size="sm" className="w-36">
              <SelectValue placeholder="排序字段" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">创建时间</SelectItem>
              <SelectItem value="updatedAt">更新时间</SelectItem>
              <SelectItem value="startedAt">开始时间</SelectItem>
              <SelectItem value="finishedAt">结束时间</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))}
          >
            {sortOrder === "desc" ? "倒序" : "正序"}
          </Button>
          <Button
            variant={failedFirst ? "secondary" : "outline"}
            size="sm"
            onClick={() => setFailedFirst((prev) => !prev)}
          >
            失败优先排序
          </Button>
          <span className="text-xs text-muted-foreground">共 {total} 条任务</span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-6 py-4">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : sortedTasks.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
            <AlertCircle className="size-5" />
            <p className="text-sm">暂无任务记录</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <div className="grid grid-cols-10 border-b bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground">
              <div>任务ID</div>
              <div>类型</div>
              <div>目标对象</div>
              <div>状态</div>
              <div>进度</div>
              <div>模型</div>
              <div>耗时</div>
              <div>创建时间</div>
              <div>错误摘要</div>
              <div className="text-right">操作</div>
            </div>
            {sortedTasks.map((task) => {
              const targetText = task.shot
                ? `分镜 #${task.shot.index}`
                : task.episode
                  ? `第${task.episode.index}集`
                  : "项目级"
              return (
                <div
                  key={task.id}
                  className={cn(
                    "grid grid-cols-10 items-center border-b px-3 py-2 text-sm last:border-b-0 hover:bg-muted/20",
                    task.status === "failed" && "bg-destructive/5"
                  )}
                >
                  <div className="font-mono text-xs">{task.id.slice(-8)}</div>
                  <div className="text-xs">{AI_TASK_TYPE_LABEL[task.taskType]}</div>
                  <div className="text-xs text-muted-foreground">{targetText}</div>
                  <div>
                    <Badge variant={statusBadgeVariant(task.status)}>{AI_TASK_STATUS_LABEL[task.status]}</Badge>
                  </div>
                  <div className="pr-2">
                    <div className="flex items-center gap-1.5">
                      {task.status === "running" && <Loader2 className="size-3 animate-spin text-primary" />}
                      <span className="text-xs">{task.progress}%</span>
                    </div>
                    <Progress value={task.progress} className="mt-1 h-1.5" />
                  </div>
                  <div className="text-xs text-muted-foreground">{task.model || "-"}</div>
                  <div className="text-xs">{formatDuration(task.startedAt, task.finishedAt)}</div>
                  <div className="text-xs text-muted-foreground">{formatDateTime(task.createdAt)}</div>
                  <div className="text-xs text-muted-foreground">
                    {task.errorMessage ? (
                      <span className="inline-flex items-center gap-1 text-destructive">
                        <TriangleAlert className="size-3" />
                        {task.errorMessage}
                      </span>
                    ) : (
                      "-"
                    )}
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => void openDetail(task.id)}>
                      查看详情
                    </Button>
                    <Button variant="ghost" size="sm" disabled>
                      重试
                    </Button>
                    <Button variant="ghost" size="sm" disabled>
                      取消
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t px-6 py-3">
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => void loadTasks(page - 1, true)}
          >
            上一页
          </Button>
          <span className="text-xs text-muted-foreground">
            第 {page} / {totalPages} 页
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || loading}
            onClick={() => void loadTasks(page + 1, true)}
          >
            下一页
          </Button>
        </div>
      </div>

      <Dialog open={!!selectedTaskId} onOpenChange={(open) => !open && setSelectedTaskId(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>任务详情</DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : !detail ? (
            <div className="py-8 text-sm text-muted-foreground">未找到任务详情</div>
          ) : (
            <div className="grid max-h-[70vh] gap-3 overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-2 rounded-lg border p-3 text-xs">
                <div>任务ID：{detail.id}</div>
                <div>任务类型：{AI_TASK_TYPE_LABEL[detail.taskType]}</div>
                <div>状态：{AI_TASK_STATUS_LABEL[detail.status]}</div>
                <div>模型：{detail.model || "-"}</div>
                <div>开始时间：{formatDateTime(detail.startedAt)}</div>
                <div>结束时间：{formatDateTime(detail.finishedAt)}</div>
                <div className="col-span-2">当前步骤：{detail.currentStep || "-"}</div>
              </div>

              <div className="rounded-lg border p-3">
                <p className="mb-2 text-sm font-medium">步骤时间线</p>
                {detail.events && detail.events.length > 0 ? (
                  <div className="space-y-2">
                    {detail.events.map((event) => (
                      <div key={event.key} className="rounded border border-dashed px-2 py-1.5 text-xs">
                        <div className="font-medium">{event.label}</div>
                        <div className="text-muted-foreground">{formatDateTime(event.at)}</div>
                        {event.detail && <div className="text-muted-foreground">{event.detail}</div>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">暂无步骤记录</p>
                )}
              </div>

              <div className="rounded-lg border p-3">
                <p className="mb-2 text-sm font-medium">输入快照</p>
                <pre className="max-h-40 overflow-auto rounded bg-muted/30 p-2 text-xs">
                  {renderJson(detail.parsedInputPayload ?? detail.inputPayload)}
                </pre>
              </div>

              <div className="rounded-lg border p-3">
                <p className="mb-2 text-sm font-medium">输出快照</p>
                <pre className="max-h-40 overflow-auto rounded bg-muted/30 p-2 text-xs">
                  {renderJson(detail.parsedOutputPayload ?? detail.outputPayload)}
                </pre>
              </div>

              <div className="rounded-lg border p-3">
                <p className="mb-2 text-sm font-medium">执行配置快照</p>
                <pre className="max-h-40 overflow-auto rounded bg-muted/30 p-2 text-xs">
                  {renderJson(detail.parsedConfigSnapshot ?? detail.configSnapshot)}
                </pre>
              </div>

              {detail.errorMessage && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
                  <p className="font-medium">错误信息</p>
                  <p className="mt-1">{detail.errorMessage}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
