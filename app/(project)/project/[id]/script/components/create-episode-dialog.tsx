"use client"

import { useEffect, useRef, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, FilePlus } from "lucide-react"

interface CreateEpisodeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 提交：返回是否需要提取资产 */
  onSubmit: (params: {
    title: string
    rawText: string
    extractAssets: boolean
  }) => Promise<void>
  nextEpisodeNumber?: number
}

export function CreateEpisodeDialog({
  open,
  onOpenChange,
  onSubmit,
  nextEpisodeNumber = 1,
}: CreateEpisodeDialogProps) {
  const [title, setTitle] = useState("")
  const [rawText, setRawText] = useState("")
  const [extractAssets, setExtractAssets] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (open) {
      setTitle("")
      setRawText("")
      setExtractAssets(true)
      setError(null)
      setLoading(false)
    }
  }, [open])

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("请填写分集标题")
      return
    }
    if (!rawText.trim()) {
      setError("请填写小说原文")
      return
    }
    setError(null)
    setLoading(true)
    try {
      await onSubmit({
        title: title.trim(),
        rawText: rawText.trim(),
        extractAssets,
      })
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建失败，请重试")
    } finally {
      setLoading(false)
    }
  }

  const wordCount = rawText.trim().length

  return (
    <Dialog open={open} onOpenChange={loading ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FilePlus className="size-4 text-primary" />
            新建分集
          </DialogTitle>
          <p className="text-sm text-muted-foreground font-normal pt-1">
            填写分集标题与小说原文，AI 将自动生成该集大纲和剧本。
          </p>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 min-h-0 overflow-y-auto p-1">
          {/* 标题 */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ep-title">分集标题 <span className="text-destructive">*</span></Label>
            <Input
              id="ep-title"
              placeholder={`例如：第${nextEpisodeNumber}集 天崩开局`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* 小说原文 */}
          <div className="flex flex-col gap-1.5 flex-1 min-h-0">
            <div className="flex items-center justify-between">
              <Label htmlFor="ep-rawtext">小说原文 <span className="text-destructive">*</span></Label>
              {wordCount > 0 && (
                <span className="text-[11px] text-muted-foreground">{wordCount.toLocaleString()} 字</span>
              )}
            </div>
            <Textarea
              id="ep-rawtext"
              ref={textareaRef}
              placeholder="请粘贴该集对应的小说原文内容…"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* 提取资产 checkbox */}
          <label className="flex items-start gap-3 rounded-lg cursor-pointer ">
            <Checkbox
              id="ep-extract-assets"
              checked={extractAssets}
              onCheckedChange={(v) => setExtractAssets(v === true)}
              disabled={loading}
              className="mt-0.5"
            />
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium leading-snug">完成后提取资产</span>
              <span className="text-xs text-muted-foreground">
                AI 将从原文中识别角色、场景和道具，添加到项目资产库
              </span>
            </div>
          </label>

          {error && (
            <p className="text-xs text-destructive bg-destructive/5 rounded-md px-3 py-2">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="pt-2 shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            取消
          </Button>
          <Button
            onClick={() => void handleSubmit()}
            disabled={loading || !rawText.trim() || !title.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                AI 生成中…
              </>
            ) : (
              <>
                <FilePlus className="size-4" />
                创建并生成剧本
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
