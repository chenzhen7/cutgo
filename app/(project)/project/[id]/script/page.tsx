"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useScriptStore } from "@/store/script-store"
import type { AssetCharacter, AssetProp, AssetScene } from "@/lib/types"
import { Loader2 } from "lucide-react"
import { ScriptEmptyState } from "./components/script-empty-state"
import { ScriptStatsPanel } from "./components/script-stats-panel"
import { GenerateScriptDropdown } from "./components/generate-script-dropdown"
import { EpisodeSelectDialog } from "./components/episode-select-dialog"
import { EpisodeNavList } from "./components/episode-nav-list"
import { ScriptEditor } from "./components/script-editor"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

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
    deleteEpisode,
    reorderEpisodes,
  } = useScriptStore()

  const [showEpisodeSelect, setShowEpisodeSelect] = useState(false)
  const [loading, setLoading] = useState(true)
  const [assetCharacters, setAssetCharacters] = useState<AssetCharacter[]>([])
  const [assetScenes, setAssetScenes] = useState<AssetScene[]>([])
  const [assetProps, setAssetProps] = useState<AssetProp[]>([])

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await fetchEpisodes(projectId)
      await fetchScripts(projectId)
      try {
        const res = await fetch(`/api/assets?projectId=${projectId}`)
        if (res.ok) {
          const data = await res.json()
          setAssetCharacters(data.characters ?? [])
          setAssetScenes(data.scenes ?? [])
          setAssetProps(data.props ?? [])
        }
      } catch {
        setAssetCharacters([])
        setAssetScenes([])
        setAssetProps([])
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
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 px-6 py-3 border-b shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-base font-semibold text-foreground">剧本生成</h2>
          {hasScripts && (
            <ScriptStatsPanel scripts={scripts} episodes={episodes} />
          )}
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
        <div className="px-6 py-2 border-b bg-destructive/5 shrink-0">
          <p className="text-xs text-destructive">{generateError}</p>
          <button
            onClick={() => handleGenerateAll("skip_existing")}
            className="text-xs text-destructive underline hover:no-underline"
          >
            重试
          </button>
        </div>
      )}

      {/* Generating progress */}
      {isGenerating && (
        <div className="px-6 py-2 border-b bg-muted/30 shrink-0 flex items-center gap-3">
          <Loader2 className="size-4 animate-spin text-primary" />
          <div>
            <p className="text-xs font-medium">正在生成剧本...</p>
            <p className="text-xs text-muted-foreground">
              AI 正在为每个分集生成剧本，请稍候
            </p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!hasScripts && !isGenerating && (
        <div className="flex-1 overflow-hidden">
          <ScriptEmptyState
            episodes={episodes}
            onGenerateAll={() => handleGenerateAll("skip_existing")}
            onSelectEpisodes={() => setShowEpisodeSelect(true)}
            onGoToImport={() => router.push(`/project/${projectId}/import`)}
          />
        </div>
      )}

      {/* Main content */}
      {hasScripts && (
        <>
          <div className="flex flex-1 min-h-0 overflow-hidden">
            <ResizablePanelGroup
              orientation="horizontal"
              className="h-full min-h-0 w-full"
            >
              {/* Left: Episode navigation */}
              <ResizablePanel
                defaultSize={300}
                minSize={240}
                maxSize={440}
                className="min-w-0"
              >
                <div className="h-full min-h-0 border-r bg-background overflow-hidden">
                  <EpisodeNavList
                    projectId={projectId}
                    episodes={episodes}
                    scripts={scripts}
                    activeScriptId={activeScriptId}
                    generateStatus={generateStatus}
                    assetCharacters={assetCharacters}
                    assetScenes={assetScenes}
                    assetProps={assetProps}
                    onSelectScript={setActiveScriptId}
                    onGenerateEpisode={handleGenerateEpisode}
                    onDeleteEpisode={deleteEpisode}
                    onReorderEpisodes={reorderEpisodes}
                  />
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Right: Script editor */}
              <ResizablePanel className="min-w-0">
                <div className="h-full min-w-0 overflow-hidden">
                  {activeScript ? (
                    <ScriptEditor
                      script={activeScript}
                      projectId={projectId}
                      assetCharacters={assetCharacters}
                      assetScenes={assetScenes}
                      assetProps={assetProps}
                      onUpdateScript={(data) =>
                        updateScript(activeScript.id, data)
                      }
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
              </ResizablePanel>
            </ResizablePanelGroup>
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
