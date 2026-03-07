"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { ChevronDown, ChevronRight, Trash2, Plus, Pencil } from "lucide-react"
import type { Chapter } from "@/lib/types"

interface ChapterFormData {
  title: string
  content: string
}

interface TabChaptersProps {
  chapters: Chapter[]
  onAdd: (data: { title?: string; content?: string }) => Promise<void>
  onUpdate: (chapterId: string, data: { title?: string; content?: string }) => Promise<void>
  onDelete: (chapterId: string) => Promise<void>
}

function ChapterItem({
  chapter,
  onEdit,
  onDelete,
}: {
  chapter: Chapter
  onEdit: (chapter: Chapter) => void
  onDelete: (chapterId: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  return (
    <div className="border rounded-lg">
      <div
        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/50"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? (
          <ChevronDown className="size-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="size-4 text-muted-foreground shrink-0" />
        )}
        <span className="flex-1 text-sm font-medium">
          {chapter.title || `段落组 ${chapter.index + 1}`}
        </span>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px]">
            {chapter.paragraphs.length} 段
          </Badge>
          <span className="text-xs text-muted-foreground">
            {chapter.wordCount.toLocaleString()} 字
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-primary"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(chapter)
            }}
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation()
              setShowDeleteConfirm(true)
            }}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      {expanded && chapter.paragraphs.length > 0 && (
        <div className="border-t px-3 py-2 bg-muted/20">
          <div className="flex flex-col gap-1.5">
            {chapter.paragraphs.map((p) => (
              <div
                key={p.id}
                className="flex items-start gap-2 text-xs py-1.5 px-2 rounded hover:bg-muted/50"
              >
                <span className="text-muted-foreground shrink-0 w-6 text-right">
                  {p.index + 1}.
                </span>
                <span className="flex-1 text-muted-foreground line-clamp-2">
                  {p.content.slice(0, 80)}
                  {p.content.length > 80 && "..."}
                </span>
                <span className="text-muted-foreground/60 shrink-0">
                  {p.wordCount} 字
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {expanded && chapter.paragraphs.length === 0 && chapter.content && (
        <div className="border-t px-3 py-2 bg-muted/20">
          <p className="text-xs text-muted-foreground line-clamp-4 whitespace-pre-wrap">
            {chapter.content.slice(0, 200)}
            {chapter.content.length > 200 && "..."}
          </p>
        </div>
      )}

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除章节</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除「{chapter.title || `段落组 ${chapter.index + 1}`}」吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => onDelete(chapter.id)}
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function ChapterDialog({
  open,
  onOpenChange,
  mode,
  initialData,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "add" | "edit"
  initialData?: ChapterFormData
  onSubmit: (data: ChapterFormData) => Promise<void>
}) {
  const [title, setTitle] = useState(initialData?.title ?? "")
  const [content, setContent] = useState(initialData?.content ?? "")
  const [submitting, setSubmitting] = useState(false)

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      setTitle("")
      setContent("")
    }
    onOpenChange(v)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await onSubmit({ title: title.trim(), content: content.trim() })
      setTitle("")
      setContent("")
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  const isAdd = mode === "add"
  const canSubmit = isAdd ? title.trim().length > 0 : true

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isAdd ? "添加章节" : "编辑章节"}</DialogTitle>
          <DialogDescription>
            {isAdd ? "输入章节标题和内容来创建新章节" : "修改章节的标题和内容"}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="chapter-title">章节标题</Label>
            <Input
              id="chapter-title"
              placeholder="如：第一章 重生"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="chapter-content">章节内容</Label>
              {content.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {content.length.toLocaleString()} 字
                </span>
              )}
            </div>
            <Textarea
              id="chapter-content"
              placeholder="输入章节正文内容（可选）"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              className="resize-y overflow-y-auto max-h-[350px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !canSubmit}>
            {submitting ? "保存中..." : isAdd ? "添加" : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function TabChapters({ chapters, onAdd, onUpdate, onDelete }: TabChaptersProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null)

  const handleEdit = (chapter: Chapter) => {
    setEditingChapter(chapter)
  }

  const handleAddSubmit = async (data: ChapterFormData) => {
    await onAdd({
      title: data.title || undefined,
      content: data.content || undefined,
    })
  }

  const handleEditSubmit = async (data: ChapterFormData) => {
    if (!editingChapter) return
    await onUpdate(editingChapter.id, {
      title: data.title || undefined,
      content: data.content || undefined,
    })
  }

  if (chapters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12">
        <p className="text-sm text-muted-foreground">暂无章节数据</p>
        <Button variant="outline" size="sm" onClick={() => setShowDialog(true)}>
          <Plus className="size-4 mr-1" />
          添加章节
        </Button>
        <ChapterDialog
          open={showDialog}
          onOpenChange={setShowDialog}
          mode="add"
          onSubmit={handleAddSubmit}
        />
      </div>
    )
  }

  const totalParagraphs = chapters.reduce((sum, ch) => sum + ch.paragraphs.length, 0)
  const totalWords = chapters.reduce((sum, ch) => sum + ch.wordCount, 0)

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>{chapters.length} 个章节</span>
          <span>{totalParagraphs} 个段落</span>
          <span>{totalWords.toLocaleString()} 字</span>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowDialog(true)}>
          <Plus className="size-4 mr-1" />
          添加章节
        </Button>
      </div>

      <ScrollArea className="max-h-[400px] overflow-y-auto">
        <div className="flex flex-col gap-2">
          {chapters.map((ch) => (
            <ChapterItem
              key={ch.id}
              chapter={ch}
              onEdit={handleEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </ScrollArea>

      <ChapterDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        mode="add"
        onSubmit={handleAddSubmit}
      />

      <ChapterDialog
        key={editingChapter?.id}
        open={!!editingChapter}
        onOpenChange={(open) => { if (!open) setEditingChapter(null) }}
        mode="edit"
        initialData={
          editingChapter
            ? { title: editingChapter.title ?? "", content: editingChapter.content ?? "" }
            : undefined
        }
        onSubmit={handleEditSubmit}
      />
    </>
  )
}
