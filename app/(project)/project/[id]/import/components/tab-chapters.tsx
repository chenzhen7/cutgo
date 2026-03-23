"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Trash2, Plus, Check, X, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { countWords, formatChapterOrdinalLabel } from "@/lib/novel-utils"
import type { Chapter } from "@/lib/types"

interface TabChaptersProps {
  chapters: Chapter[]
  onAdd: (data: { title?: string; content?: string }) => Promise<void>
  onUpdate: (chapterId: string, data: { title?: string; content?: string }) => Promise<void>
  onDelete: (chapterId: string) => Promise<void>
}

function AddChapterDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { title: string; content: string }) => Promise<void>
}) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleOpenChange = (v: boolean) => {
    if (!v) { setTitle(""); setContent("") }
    onOpenChange(v)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await onSubmit({ title: title.trim(), content: content.trim() })
      setTitle(""); setContent("")
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>添加章节</DialogTitle>
          <DialogDescription>输入章节标题和内容来创建新章节</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="add-title">章节标题</Label>
            <Input
              id="add-title"
              placeholder="如：第一章 重生"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="add-content">章节内容</Label>
              {content.length > 0 && (
                <span className="text-xs text-muted-foreground">{content.length.toLocaleString()} 字</span>
              )}
            </div>
            <Textarea
              id="add-content"
              placeholder="输入章节正文内容（可选）"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              className="resize-y overflow-y-auto max-h-[320px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>取消</Button>
          <Button onClick={handleSubmit} disabled={submitting || !title.trim()}>
            {submitting ? "添加中..." : "添加"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ChapterEditor({
  chapter,
  onUpdate,
  onDelete,
}: {
  chapter: Chapter
  onUpdate: (chapterId: string, data: { title?: string; content?: string }) => Promise<void>
  onDelete: (chapterId: string) => Promise<void>
}) {
  const [title, setTitle] = useState(chapter.title ?? "")
  const [content, setContent] = useState(chapter.content ?? "")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showDelete, setShowDelete] = useState(false)

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const gutterRef = useRef<HTMLDivElement>(null)
  const isDirty = title !== (chapter.title ?? "") || content !== (chapter.content ?? "")

  useEffect(() => {
    setTitle(chapter.title ?? "")
    setContent(chapter.content ?? "")
    setSaved(false)
  }, [chapter.id, chapter.title, chapter.content])

  const triggerAutoSave = useCallback(
    (newTitle: string, newContent: string) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(async () => {
        setSaving(true)
        try {
          await onUpdate(chapter.id, {
            title: newTitle.trim() || undefined,
            content: newContent.trim() || undefined,
          })
          setSaved(true)
          setTimeout(() => setSaved(false), 2000)
        } finally {
          setSaving(false)
        }
      }, 800)
    },
    [chapter.id, onUpdate]
  )

  const handleTitleChange = (v: string) => {
    setTitle(v)
    triggerAutoSave(v, content)
  }

  const handleContentChange = (v: string) => {
    setContent(v)
    triggerAutoSave(title, v)
  }

  const handleSaveNow = async () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    setSaving(true)
    try {
      await onUpdate(chapter.id, {
        title: title.trim() || undefined,
        content: content.trim() || undefined,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const handleDiscard = () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    setTitle(chapter.title ?? "")
    setContent(chapter.content ?? "")
    setSaved(false)
  }

  const wordCount = countWords(content)
  const lineCount = content ? content.split("\n").length : 0
  const lineNumbers = content.split("\n").map((_, i) => i + 1)

  const syncGutterScroll = () => {
    const ta = textareaRef.current
    const g = gutterRef.current
    if (ta && g) g.scrollTop = ta.scrollTop
  }

  return (
    <div className="flex flex-col h-full">
      {/* 编辑区顶栏 */}
      <div className="flex items-center gap-2 px-4 py-3 border-b shrink-0 min-w-0">
        <span className="shrink-0 text-sm font-semibold text-muted-foreground tabular-nums">
          {formatChapterOrdinalLabel(chapter.index)}
        </span>
        <Input
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="标题"
          className="min-w-0 flex-1 border-0 bg-transparent px-0 text-base font-semibold shadow-none focus-visible:ring-0 placeholder:font-normal placeholder:text-muted-foreground/60"
        />
        <div className="flex items-center gap-1.5 shrink-0">
          {saving && (
            <span className="text-xs text-muted-foreground">保存中...</span>
          )}
          {saved && !saving && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Check className="size-3" />已保存
            </span>
          )}
          {isDirty && !saving && !saved && (
            <>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={handleSaveNow}>
                <Check className="size-3 mr-1" />保存
              </Button>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground" onClick={handleDiscard}>
                <X className="size-3 mr-1" />放弃
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-destructive"
            onClick={() => setShowDelete(true)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* 正文编辑区（与剧本编辑区一致：行号栏 + 文本） */}
      <div className="flex-1 flex min-h-0 overflow-hidden bg-background">
        <div
          ref={gutterRef}
          className="pointer-events-none shrink-0 w-11 select-none overflow-y-auto overflow-x-hidden border-r border-border/60 bg-muted/25 py-3 pl-2 pr-1.5 text-right font-mono text-sm leading-relaxed text-muted-foreground/80 tabular-nums [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-hidden
        >
          {lineNumbers.map((n) => (
            <div key={n} className="min-h-[1.625em] leading-relaxed">
              {n}
            </div>
          ))}
        </div>
        <div className="flex-1 relative min-w-0 min-h-0">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            onScroll={syncGutterScroll}
            placeholder="在此编辑章节正文内容..."
            spellCheck={false}
            className="absolute inset-0 h-full w-full resize-none rounded-none border-0 bg-transparent py-3 pl-2 pr-4 font-mono text-sm leading-relaxed shadow-none focus-visible:ring-0 whitespace-pre overflow-x-auto overflow-y-auto"
          />
        </div>
      </div>

      {/* 底部状态栏 */}
      <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/20 shrink-0">
        <span className="text-xs text-muted-foreground">
          {chapter.paragraphs.length > 0
            ? `${chapter.paragraphs.length} 个段落`
            : "无段落数据"}
        </span>
        <div className="flex items-center gap-2 text-[11px] tabular-nums text-muted-foreground">
          <span>{lineCount > 0 ? `${lineCount} 行` : "空内容"}</span>
          <span className="text-border select-none" aria-hidden>
            ·
          </span>
          <span className="font-medium text-foreground/75">
            {wordCount.toLocaleString()} 字
          </span>
        </div>
      </div>

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除章节</AlertDialogTitle>
            <AlertDialogDescription>
              {`确定要删除「${formatChapterOrdinalLabel(chapter.index)}${chapter.title?.trim() ? ` ${chapter.title.trim()}` : ""}」吗？此操作不可撤销。`}
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

export function TabChapters({ chapters, onAdd, onUpdate, onDelete }: TabChaptersProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)

  const selectedChapter = chapters.find((ch) => ch.id === selectedId) ?? chapters[0] ?? null

  useEffect(() => {
    if (!selectedId && chapters.length > 0) {
      setSelectedId(chapters[0].id)
    }
    if (selectedId && !chapters.find((ch) => ch.id === selectedId)) {
      setSelectedId(chapters[0]?.id ?? null)
    }
  }, [chapters, selectedId])

  const totalWords = chapters.reduce((sum, ch) => sum + ch.wordCount, 0)

  if (chapters.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <BookOpen className="size-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">暂无章节数据</p>
        <Button variant="outline" size="sm" onClick={() => setShowAddDialog(true)}>
          <Plus className="size-4 mr-1" />
          添加章节
        </Button>
        <AddChapterDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onSubmit={async (data) => {
            await onAdd({ title: data.title || undefined, content: data.content || undefined })
          }}
        />
      </div>
    )
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* 左侧章节导航 */}
      <div className="w-56 shrink-0 flex flex-col border-r">
        <div className="flex items-center justify-between px-3 py-2.5 border-b bg-background">
          <span className="text-xs font-medium text-muted-foreground">
            {chapters.length} 章节 · {totalWords.toLocaleString()} 字
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-6 text-muted-foreground hover:text-foreground"
            onClick={() => setShowAddDialog(true)}
            title="添加章节"
          >
            <Plus className="size-3.5" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="flex flex-col py-1">
            {chapters.map((ch) => (
              <button
                key={ch.id}
                onClick={() => setSelectedId(ch.id)}
                className={cn(
                  "flex flex-col gap-0.5 px-3 py-2.5 text-left transition-colors hover:bg-muted/60",
                  selectedChapter?.id === ch.id
                    ? "bg-primary/8 border-r-2 border-r-primary text-foreground"
                    : "text-muted-foreground"
                )}
              >
                <span className={cn(
                  "text-xs font-medium leading-snug line-clamp-2",
                  selectedChapter?.id === ch.id && "text-foreground"
                )}>
                  {formatChapterOrdinalLabel(ch.index)}
                  {ch.title?.trim() ? ` ${ch.title.trim()}` : ""}
                </span>
                <span className="text-[10px] text-muted-foreground/70">
                  {ch.wordCount.toLocaleString()} 字
                </span>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* 右侧编辑区 */}
      <div className="flex-1 overflow-hidden">
        {selectedChapter ? (
          <ChapterEditor
            key={selectedChapter.id}
            chapter={selectedChapter}
            onUpdate={onUpdate}
            onDelete={async (id) => {
              await onDelete(id)
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            选择左侧章节开始编辑
          </div>
        )}
      </div>

      <AddChapterDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSubmit={async (data) => {
          await onAdd({ title: data.title || undefined, content: data.content || undefined })
        }}
      />
    </div>
  )
}
