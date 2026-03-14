"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useScriptStore } from "@/store/script-store"
import { Loader2 } from "lucide-react"
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
    updateScript,
    setActiveScriptId,
    confirmScripts,
  } = useScriptStore()

  const [showEpisodeSelect, setShowEpisodeSelect] = useState(false)
  const [outlineConfirmed, setOutlineConfirmed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await fetchEpisodes(projectId)
      await fetchScripts(projectId)

      const res = await fetch(`/api/projects/${projectId}`)
      if (res.ok) {
        const project = await res.json()
        setOutlineConfirmed(project.step >= 4)
      }
      setLoading(false)
    }
    init()
  }, [projectId, fetchEpisodes, fetchScripts])

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
    router.push(`/project/${projectId}/storyboard`)
  }, [projectId, confirmScripts, router])

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
            基于分集大纲，AI 为每一集生成剧本文本
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
              AI 正在为每个分集生成剧本，请稍候
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

      {/* Main content */}
      {hasScripts && (
        <>
          <div className="px-6 mb-4">
            <ScriptStatsPanel scripts={scripts} episodes={episodes} />
          </div>

          <div className="flex flex-1 min-h-0 px-6 gap-4">
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
                  projectId={projectId}
                  onUpdateScript={(data) => updateScript(activeScript.id, data)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <h3 className="text-base font-medium mb-2">选择一个分集</h3>
                  <p className="text-sm text-muted-foreground">
                    从左侧列表中选择一个已生成剧本的分集进行查看和编辑
                  </p>
                </div>
              )}
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
    </div>
  )
}
