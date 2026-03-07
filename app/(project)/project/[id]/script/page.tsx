"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useScriptStore } from "@/store/script-store"
import { Button } from "@/components/ui/button"
import { Loader2, FileText } from "lucide-react"
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
import { ScriptEmptyState } from "./components/script-empty-state"
import { ScriptStatsPanel } from "./components/script-stats-panel"
import { GenerateScriptDropdown } from "./components/generate-script-dropdown"
import { EpisodeSelectDialog } from "./components/episode-select-dialog"
import { EpisodeNavList } from "./components/episode-nav-list"
import { ScriptEditor } from "./components/script-editor"
import { ConfirmScriptDialog } from "./components/confirm-script-dialog"

export default function ScriptPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const {
    scripts,
    episodes,
    generateStatus,
    generateError,
    activeScriptId,
    fetchScripts,
    fetchEpisodes,
    generateScripts,
    addScene,
    updateScene,
    deleteScene,
    addLine,
    updateLine,
    deleteLine,
    setActiveScriptId,
    confirmScripts,
  } = useScriptStore()

  const [showEpisodeSelect, setShowEpisodeSelect] = useState(false)
  const [outlineConfirmed, setOutlineConfirmed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [deletingSceneId, setDeletingSceneId] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await fetchEpisodes(projectId)
      await fetchScripts(projectId)

      const res = await fetch(`/api/projects/${projectId}`)
      if (res.ok) {
        const project = await res.json()
        setOutlineConfirmed(project.step >= 3)
      }
      setLoading(false)
    }
    init()
  }, [projectId, fetchEpisodes, fetchScripts])

  // Auto-select first script
  useEffect(() => {
    if (scripts.length > 0 && !activeScriptId) {
      setActiveScriptId(scripts[0].id)
    }
  }, [scripts, activeScriptId, setActiveScriptId])

  const handleGenerateAll = useCallback(
    async (mode: "skip_existing" | "overwrite") => {
      await generateScripts(projectId, undefined, mode)
    },
    [projectId, generateScripts]
  )

  const handleGenerateSelected = useCallback(
    async (episodeIds: string[]) => {
      await generateScripts(projectId, episodeIds, "overwrite")
    },
    [projectId, generateScripts]
  )

  const handleGenerateEpisode = useCallback(
    async (episodeId: string) => {
      await generateScripts(projectId, [episodeId], "overwrite")
    },
    [projectId, generateScripts]
  )

  const handleConfirm = useCallback(async () => {
    await confirmScripts(projectId)
    router.push(`/project/${projectId}/characters`)
  }, [projectId, confirmScripts, router])

  const handleDeleteScene = useCallback(
    async (scriptId: string, sceneId: string) => {
      await deleteScene(scriptId, sceneId)
      setDeletingSceneId(null)
    },
    [deleteScene]
  )

  const activeScript = scripts.find((s) => s.id === activeScriptId) || null
  const hasScripts = scripts.length > 0
  const isGenerating = generateStatus === "generating"

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-start justify-between px-6 pt-6 pb-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">剧本生成</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            基于分集大纲，AI 为每一集生成结构化剧本
          </p>
        </div>
        {hasScripts && (
          <GenerateScriptDropdown
            generateStatus={generateStatus}
            onGenerateAll={handleGenerateAll}
            onSelectEpisodes={() => setShowEpisodeSelect(true)}
          />
        )}
      </div>

      {/* Generate error */}
      {generateStatus === "error" && generateError && (
        <div className="mx-6 mb-4 rounded-lg border border-destructive/50 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">{generateError}</p>
          <button
            onClick={() => handleGenerateAll("skip_existing")}
            className="mt-2 text-sm text-destructive underline hover:no-underline"
          >
            重试
          </button>
        </div>
      )}

      {/* Generating progress */}
      {isGenerating && (
        <div className="mx-6 mb-4 rounded-lg border bg-muted/30 p-4 flex items-center gap-3">
          <Loader2 className="size-5 animate-spin text-primary" />
          <div>
            <p className="text-sm font-medium">正在生成剧本...</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              AI 正在为每个分集生成结构化剧本，请稍候
            </p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!hasScripts && !isGenerating && (
        <div className="px-6">
          <ScriptEmptyState
            episodes={episodes}
            outlineConfirmed={outlineConfirmed}
            onGenerateAll={() => handleGenerateAll("skip_existing")}
            onSelectEpisodes={() => setShowEpisodeSelect(true)}
            onGoToOutline={() => router.push(`/project/${projectId}/outline`)}
          />
        </div>
      )}

      {/* Main content: Stats + Two-column layout */}
      {hasScripts && (
        <>
          <div className="px-6 mb-4">
            <ScriptStatsPanel scripts={scripts} episodes={episodes} />
          </div>

          <div className="flex flex-1 min-h-0 px-6 gap-4 pb-20">
            {/* Left: Episode navigation */}
            <div className="w-64 shrink-0 rounded-lg border bg-card">
              <EpisodeNavList
                episodes={episodes}
                scripts={scripts}
                activeScriptId={activeScriptId}
                generateStatus={generateStatus}
                onSelectScript={setActiveScriptId}
                onGenerateEpisode={handleGenerateEpisode}
              />
            </div>

            {/* Right: Script editor */}
            <div className="flex-1 min-w-0 rounded-lg border bg-card">
              {activeScript ? (
                <ScriptEditor
                  script={activeScript}
                  onAddScene={(data) => addScene(activeScript.id, data)}
                  onUpdateScene={(sceneId, data) =>
                    updateScene(activeScript.id, sceneId, data)
                  }
                  onDeleteScene={(sceneId) =>
                    setDeletingSceneId(sceneId)
                  }
                  onAddLine={(sceneId, data) =>
                    addLine(activeScript.id, sceneId, data)
                  }
                  onUpdateLine={(sceneId, lineId, data) =>
                    updateLine(activeScript.id, sceneId, lineId, data)
                  }
                  onDeleteLine={(sceneId, lineId) =>
                    deleteLine(activeScript.id, sceneId, lineId)
                  }
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <FileText className="size-12 text-muted-foreground mb-4" />
                  <h3 className="text-base font-medium mb-2">选择一个分集</h3>
                  <p className="text-sm text-muted-foreground">
                    从左侧列表中选择一个已生成剧本的分集进行查看和编辑
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom bar */}
          <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur-sm px-6 py-4">
            <div className="mx-auto max-w-3xl">
              <ConfirmScriptDialog
                scripts={scripts}
                episodes={episodes}
                onConfirm={handleConfirm}
              />
            </div>
          </div>
        </>
      )}

      {/* Episode select dialog */}
      <EpisodeSelectDialog
        open={showEpisodeSelect}
        onOpenChange={setShowEpisodeSelect}
        episodes={episodes}
        scripts={scripts}
        onGenerate={handleGenerateSelected}
      />

      {/* Delete scene confirmation */}
      <AlertDialog
        open={!!deletingSceneId}
        onOpenChange={(open) => !open && setDeletingSceneId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除场景</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这个场景吗？该场景下的所有剧本行也会一并删除，此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (activeScript && deletingSceneId) {
                  handleDeleteScene(activeScript.id, deletingSceneId)
                }
              }}
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
