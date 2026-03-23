"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useNovelStore } from "@/store/novel-store"
import { ImportNovelDialog } from "./components/import-novel-dialog"
import { TabChapters } from "./components/tab-chapters"
import { Button } from "@/components/ui/button"
import { BookOpen, Upload, ArrowRight } from "lucide-react"

const ANALYSIS_STAGES = [
  "正在拆分文本结构...",
  "正在分析章节段落...",
  "正在整理分析结果...",
]

export default function ImportPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const {
    novel,
    chapters,
    analysisStatus,
    analysisError,
    fetchNovel,
    importNovel,
    analyzeNovel,
    confirmImport,
    addChapter,
    updateChapter,
    deleteChapter,
    reset,
  } = useNovelStore()

  const [showImportDialog, setShowImportDialog] = useState(false)
  const [stageIndex, setStageIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [confirmError, setConfirmError] = useState<string | null>(null)

  const stageIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    fetchNovel(projectId)
  }, [projectId, fetchNovel])

  const isAnalyzing = analysisStatus === "analyzing"

  const startProgressAnimation = useCallback(() => {
    setStageIndex(0)
    setProgress(0)
    stageIntervalRef.current = setInterval(() => {
      setStageIndex((i) => (i < ANALYSIS_STAGES.length - 1 ? i + 1 : i))
    }, 2000)
    progressIntervalRef.current = setInterval(() => {
      setProgress((p) => Math.min(p + 3, 90))
    }, 300)
  }, [])

  const stopProgressAnimation = useCallback(() => {
    if (stageIntervalRef.current) clearInterval(stageIntervalRef.current)
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
    setProgress(100)
  }, [])

  const handleImport = useCallback(
    async (text: string, fileName: string | null) => {
      startProgressAnimation()
      try {
        const imported = await importNovel({
          projectId,
          title: fileName || undefined,
          rawText: text,
          source: fileName ? "file" : "paste",
          fileName: fileName || undefined,
        })
        await analyzeNovel(imported.id)
        stopProgressAnimation()
        setShowImportDialog(false)
      } catch {
        stopProgressAnimation()
      }
    },
    [projectId, importNovel, analyzeNovel, startProgressAnimation, stopProgressAnimation]
  )

  const handleConfirm = useCallback(async () => {
    if (!novel) return
    setConfirmError(null)
    try {
      await confirmImport(novel.id)
      router.push(`/project/${projectId}/script`)
    } catch (e) {
      setConfirmError((e as Error).message)
    }
  }, [novel, confirmImport, router, projectId])

  const isImported = !!novel
  const isEmpty = chapters.length === 0

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* 顶部 header */}
      <div className="flex items-center justify-between gap-4 px-6 py-3 border-b shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-foreground">小说导入</h2>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isEmpty && (
            <Button size="sm" onClick={() => setShowImportDialog(true)}>
              <Upload className="size-4" />
              导入小说
            </Button>
          )}
          {!isEmpty && (
            <Button size="sm" onClick={handleConfirm}>
              确认导入，进入剧本生成
              <ArrowRight className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {/* 通知条 */}
      {analysisStatus === "error" && (
        <div className="px-6 py-2 border-b bg-destructive/5 shrink-0">
          <p className="text-xs text-destructive">{analysisError || "分析失败，请重试"}</p>
        </div>
      )}
      {confirmError && (
        <div className="px-6 py-2 border-b bg-destructive/5 shrink-0">
          <p className="text-xs text-destructive">{confirmError}</p>
        </div>
      )}

      {/* 主体内容区 */}
      <div className="flex-1 overflow-hidden">
        {isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center gap-4">
            <BookOpen className="size-10 text-muted-foreground/40" />
            <div className="text-center">
              <p className="text-sm font-medium">还没有导入小说</p>
              <p className="mt-1 text-xs text-muted-foreground">
                支持粘贴文本或上传 .txt 文件，导入后可管理章节
              </p>
            </div>
            <Button onClick={() => setShowImportDialog(true)}>
              <Upload className="size-4" />
              导入小说
            </Button>
          </div>
        ) : (
          <TabChapters
            chapters={chapters}
            onAdd={(data) => addChapter(novel!.id, data)}
            onUpdate={updateChapter}
            onDelete={(id) => deleteChapter(novel!.id, id)}
          />
        )}
      </div>

      <ImportNovelDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImport={handleImport}
        analyzing={isAnalyzing}
        analysisStageIndex={stageIndex}
        analysisProgress={progress}
      />
    </div>
  )
}
