"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useNovelStore } from "@/store/novel-store"
import { TextInputPanel } from "./components/text-input-panel"
import { AnalysisProgress } from "./components/analysis-progress"
import { AnalysisResultPanel } from "./components/analysis-result-panel"
import { ConfirmImportDialog } from "./components/confirm-import-dialog"
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

export default function ImportPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const {
    novel,
    chapters,
    characters,
    events,
    analysisStatus,
    analysisError,
    fetchNovel,
    importNovel,
    analyzeNovel,
    confirmImport,
    updateSynopsis,
    addCharacter,
    updateCharacter,
    deleteCharacter,
    addEvent,
    updateEvent,
    deleteEvent,
    toggleChapterSelection,
  } = useNovelStore()

  const [text, setText] = useState("")
  const [fileName, setFileName] = useState<string | null>(null)
  const [showReanalyze, setShowReanalyze] = useState(false)

  useEffect(() => {
    fetchNovel(projectId)
  }, [projectId, fetchNovel])

  useEffect(() => {
    if (novel?.rawText) {
      setText(novel.rawText)
      setFileName(novel.fileName ?? null)
    }
  }, [novel?.rawText, novel?.fileName])

  const handleStartAnalysis = useCallback(async () => {
    if (novel && (novel.status === "analyzed" || novel.status === "confirmed")) {
      setShowReanalyze(true)
      return
    }
    await doAnalysis()
  }, [novel, text, projectId]) // eslint-disable-line react-hooks/exhaustive-deps

  const doAnalysis = useCallback(async () => {
    const imported = await importNovel({
      projectId,
      title: fileName || undefined,
      rawText: text,
      source: fileName ? "file" : "paste",
      fileName: fileName || undefined,
    })
    await analyzeNovel(imported.id)
  }, [projectId, text, fileName, importNovel, analyzeNovel])

  const handleConfirm = useCallback(async () => {
    if (!novel) return
    await confirmImport(novel.id)
    router.push(`/project/${projectId}/outline`)
  }, [novel, confirmImport, router, projectId])

  const handleToggleChapter = useCallback(
    (chapterId: string, selected: boolean) => {
      if (novel) toggleChapterSelection(novel.id, chapterId, selected)
    },
    [novel, toggleChapterSelection]
  )

  const isAnalyzed = analysisStatus === "completed"
  const isAnalyzing = analysisStatus === "analyzing"

  return (
    <div className="flex flex-col gap-6 p-6 pb-24">
      <div>
        <h2 className="text-xl font-semibold text-foreground">小说导入</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          粘贴小说文本或上传 txt 文件，系统将自动分析剧情结构
        </p>
      </div>

      <TextInputPanel
        text={text}
        onTextChange={setText}
        onStartAnalysis={handleStartAnalysis}
        analyzing={isAnalyzing}
        fileName={fileName}
        onFileNameChange={setFileName}
      />

      {isAnalyzing && <AnalysisProgress />}

      {analysisStatus === "error" && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">
            {analysisError || "分析失败，请重试"}
          </p>
          <button
            onClick={doAnalysis}
            className="mt-2 text-sm text-destructive underline hover:no-underline"
          >
            重新分析
          </button>
        </div>
      )}

      {isAnalyzed && novel && (
        <AnalysisResultPanel
          novel={novel}
          chapters={chapters}
          characters={characters}
          events={events}
          onUpdateSynopsis={(synopsis) => updateSynopsis(novel.id, synopsis)}
          onAddCharacter={(data) => addCharacter(novel.id, data)}
          onUpdateCharacter={updateCharacter}
          onDeleteCharacter={(id) => deleteCharacter(novel.id, id)}
          onAddEvent={(data) => addEvent(novel.id, data)}
          onUpdateEvent={updateEvent}
          onDeleteEvent={(id) => deleteEvent(novel.id, id)}
          onToggleChapter={handleToggleChapter}
          onToggleAllChapters={(selected) => {
            chapters.forEach((ch) => {
              if (ch.selected !== selected) {
                toggleChapterSelection(novel.id, ch.id, selected)
              }
            })
          }}
        />
      )}

      {isAnalyzed && novel && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur-sm px-6 py-4">
          <div className="mx-auto max-w-3xl">
            <ConfirmImportDialog
              wordCount={novel.wordCount}
              chapters={chapters}
              characters={characters}
              events={events}
              onConfirm={handleConfirm}
            />
          </div>
        </div>
      )}

      {/* 空状态 */}
      {!isAnalyzing && !isAnalyzed && analysisStatus !== "error" && !novel && (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">
            粘贴或上传小说文本后，点击"开始分析"，分析结果将在这里展示
          </p>
        </div>
      )}

      {/* 重新分析确认 */}
      <AlertDialog open={showReanalyze} onOpenChange={setShowReanalyze}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>重新分析</AlertDialogTitle>
            <AlertDialogDescription>
              当前项目已有分析数据，重新分析将覆盖原有内容。是否继续？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                setShowReanalyze(false)
                await doAnalysis()
              }}
            >
              确认重新分析
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
