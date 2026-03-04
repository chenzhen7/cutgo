"use client"

import { useCallback, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, FileText, X, Loader2 } from "lucide-react"
import { countWords, hasChapterStructure } from "@/lib/novel-utils"

const WARN_THRESHOLD = 50000
const MAX_FILE_SIZE = 5 * 1024 * 1024

interface TextInputPanelProps {
  text: string
  onTextChange: (text: string) => void
  onStartAnalysis: () => void
  analyzing: boolean
  disabled?: boolean
  fileName: string | null
  onFileNameChange: (name: string | null) => void
}

export function TextInputPanel({
  text,
  onTextChange,
  onStartAnalysis,
  analyzing,
  disabled,
  fileName,
  onFileNameChange,
}: TextInputPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
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
        onTextChange(content)
        onFileNameChange(file.name.replace(/\.txt$/, ""))
      }
      reader.readAsText(file, "utf-8")
    },
    [onTextChange, onFileNameChange]
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

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">文本输入</CardTitle>
          {fileName && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <FileText className="size-3.5" />
              <span>{fileName}</span>
              <button
                onClick={() => {
                  onFileNameChange(null)
                  onTextChange("")
                }}
                className="hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
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
            rows={14}
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            readOnly={analyzing}
            className="max-h-[400px] resize-none overflow-y-auto font-mono text-sm leading-relaxed"
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
          <div className="flex items-center gap-3">
            <Button
              onClick={onStartAnalysis}
              disabled={!text.trim() || analyzing || disabled}
            >
              {analyzing ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  分析中...
                </>
              ) : (
                "开始分析"
              )}
            </Button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer text-sm text-muted-foreground underline hover:text-foreground"
            >
              <span className="flex items-center gap-1">
                <Upload className="size-3.5" />
                上传 txt 文件
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
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
      </CardContent>
    </Card>
  )
}
