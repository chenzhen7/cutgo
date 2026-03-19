"use client"

import { useCallback, useRef, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Upload, FileText, X, Loader2 } from "lucide-react"
import { countWords, hasChapterStructure } from "@/lib/novel-utils"

const WARN_THRESHOLD = 50000
const MAX_FILE_SIZE = 5 * 1024 * 1024

const STAGES = [
  "正在拆分文本结构...",
  "正在分析章节段落...",
  "正在整理分析结果...",
]

interface ImportNovelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (text: string, fileName: string | null) => Promise<void>
  analyzing: boolean
  analysisStageIndex: number
  analysisProgress: number
}

export function ImportNovelDialog({
  open,
  onOpenChange,
  onImport,
  analyzing,
  analysisStageIndex,
  analysisProgress,
}: ImportNovelDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [text, setText] = useState("")
  const [fileName, setFileName] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const wordCount = countWords(text)
  const isOverLimit = wordCount > WARN_THRESHOLD
  const isTooShort = wordCount > 0 && wordCount < 100
  const hasChapters = text.length > 0 && hasChapterStructure(text)

  const handleFileRead = useCallback(
    (file: File) => {
      if (!file.name.endsWith(".txt")) {
        alert("仅支持 .txt 格式文件")
        return
      }
      if (file.size > MAX_FILE_SIZE) {
        alert("文件大小不能超过 5MB")
        return
      }
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setText(content)
        setFileName(file.name.replace(/\.txt$/, ""))
      }
      reader.readAsText(file, "utf-8")
    },
    []
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFileRead(file)
    },
    [handleFileRead]
  )

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFileRead(file)
      e.target.value = ""
    },
    [handleFileRead]
  )

  const handleSubmit = async () => {
    await onImport(text, fileName)
  }

  const handleOpenChange = (v: boolean) => {
    if (analyzing) return
    if (!v) {
      setText("")
      setFileName(null)
    }
    onOpenChange(v)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>导入小说</DialogTitle>
          <DialogDescription>
            粘贴小说文本或上传 txt 文件，系统将自动识别章节结构
          </DialogDescription>
        </DialogHeader>

        {analyzing ? (
          <div className="flex flex-col items-center justify-center gap-4 py-10">
            <Loader2 className="size-8 animate-spin text-primary" />
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm font-medium">{STAGES[analysisStageIndex] ?? STAGES[0]}</p>
              <Progress value={analysisProgress} className="w-64 h-2" />
              <p className="text-xs text-muted-foreground">
                正在解析章节结构，这可能需要几秒钟
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {fileName && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <FileText className="size-3.5" />
                <span>{fileName}</span>
                <button
                  onClick={() => {
                    setFileName(null)
                    setText("")
                  }}
                  className="hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            )}

            <div
              className={`relative ${dragOver ? "ring-2 ring-primary ring-offset-2 rounded-lg" : ""}`}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <Textarea
                placeholder="将小说内容粘贴到这里，或拖拽 txt 文件上传..."
                rows={12}
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="max-h-[360px] resize-none overflow-y-auto font-mono text-sm leading-relaxed"
              />
              {dragOver && (
                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-primary/5 border-2 border-dashed border-primary">
                  <div className="flex flex-col items-center gap-2 text-primary">
                    <Upload className="size-8" />
                    <span className="text-sm font-medium">释放文件以上传</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                {hasChapters && (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    检测到章节结构
                  </span>
                )}
                <span className={isOverLimit ? "text-destructive font-medium" : "text-muted-foreground"}>
                  {wordCount.toLocaleString()} 字
                </span>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer text-sm text-muted-foreground underline hover:text-foreground flex items-center gap-1"
              >
                <Upload className="size-3.5" />
                上传 txt 文件
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            {isOverLimit && (
              <p className="text-xs text-destructive">
                建议单次导入不超过 50,000 字，过长的文本可能影响分析质量
              </p>
            )}
            {isTooShort && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                文本内容过短，建议至少导入 100 字以上的小说内容
              </p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                取消
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!text.trim() || analyzing}
              >
                开始导入
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
