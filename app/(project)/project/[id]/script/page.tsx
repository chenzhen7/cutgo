"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { useScriptStore } from "@/store/script-store"
import type { AssetCharacter, AssetProp, AssetScene, Episode } from "@/lib/types"
import { Loader2, X, FilePlus } from "lucide-react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { ScriptEmptyState } from "./components/script-empty-state"
import { ScriptStatsPanel } from "./components/script-stats-panel"
import { GenerateScriptButton } from "./components/generate-script-button"
import { ChapterSelectDialog } from "./components/chapter-select-dialog"
import { EpisodeNavList } from "./components/episode-nav-list"
import { ScriptEditor } from "./components/script-editor"
import { CreateEpisodeDialog } from "./components/create-episode-dialog"
import {
  CreateEpisodeProgressDialog,
  type CreateEpisodeProgressStep,
} from "./components/create-episode-progress-dialog"
import { ExtractAssetsDialog } from "./components/extract-assets-dialog"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { buildEpisodeDisplayNumberMap } from "@/lib/episode-display"

interface ExtractedCharacter {
  name: string
  role: "protagonist" | "supporting" | "extra"
  gender?: string
  prompt?: string
}

interface ExtractedScene {
  name: string
  prompt?: string
  tags?: string
}

interface ExtractedProp {
  name: string
  prompt?: string
}

const INITIAL_CREATE_EPISODE_STEPS: CreateEpisodeProgressStep[] = [
  {
    key: "extract",
    label: "提取资产",
    description: "从原文中分析角色、场景和道具。",
    status: "pending",
  },
  {
    key: "save",
    label: "保存资产",
    description: "把识别出的资产写入项目并关联到当前分集。",
    status: "pending",
  },
  {
    key: "script",
    label: "生成剧本",
    description: "基于原文和已提取资产生成当前分集剧本。",
    status: "pending",
  },
]

export default function ScriptPage() {
  const params = useParams()
  const projectId = params.id as string

  const {
    episodes,
    generateStatus,
    generateError,
    fetchEpisodes,
    generateScripts,
    updateScript,
    deleteEpisode,
    reorderEpisodes,
    createEpisodeWithRawText,
    updateEpisode,
    clearGenerateError,
    activeEpisodeId,
    setActiveEpisodeId,
  } = useScriptStore()

  const [showEpisodeSelect, setShowEpisodeSelect] = useState(false)
  const [showCreateEpisodeDialog, setShowCreateEpisodeDialog] = useState(false)
  const [showExtractAssets, setShowExtractAssets] = useState(false)
  const [extractTargetEpisodeId, setExtractTargetEpisodeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [assetCharacters, setAssetCharacters] = useState<AssetCharacter[]>([])
  const [assetScenes, setAssetScenes] = useState<AssetScene[]>([])
  const [assetProps, setAssetProps] = useState<AssetProp[]>([])
  const [showCreateEpisodeProgress, setShowCreateEpisodeProgress] = useState(false)
  const [createEpisodeProgressTitle, setCreateEpisodeProgressTitle] = useState("")
  const [createEpisodeProgressSteps, setCreateEpisodeProgressSteps] = useState<CreateEpisodeProgressStep[]>(
    INITIAL_CREATE_EPISODE_STEPS
  )
  const [createEpisodeStatusMessage, setCreateEpisodeStatusMessage] = useState("准备开始…")
  const [createEpisodeProgressError, setCreateEpisodeProgressError] = useState<string | null>(null)
  const [createEpisodeProgressFinished, setCreateEpisodeProgressFinished] = useState(false)

  const handleAssetRefresh = useCallback(async () => {
    try {
      const data = await apiFetch<{ characters?: AssetCharacter[]; scenes?: AssetScene[]; props?: AssetProp[] }>(`/api/assets?projectId=${projectId}`)
      setAssetCharacters(data.characters ?? [])
      setAssetScenes(data.scenes ?? [])
      setAssetProps(data.props ?? [])
    } catch {
      setAssetCharacters([])
      setAssetScenes([])
      setAssetProps([])
    }
  }, [projectId])

  const updateCreateEpisodeStep = useCallback((
    key: string,
    status: CreateEpisodeProgressStep["status"]
  ) => {
    setCreateEpisodeProgressSteps((prev) =>
      prev.map((step) => (step.key === key ? { ...step, status } : step))
    )
  }, [])

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await fetchEpisodes(projectId)
      await handleAssetRefresh()

      const eps = useScriptStore.getState().episodes
      const currentActiveEpisodeId = useScriptStore.getState().activeEpisodeId
      if (eps && eps.length > 0) {
        const isActiveValid = eps.some(e => e.id === currentActiveEpisodeId)
        if (!isActiveValid) {
          setActiveEpisodeId(null)
        }
      } else {
        setActiveEpisodeId(null)
      }

      setLoading(false)
    }
    init()
  }, [projectId, fetchEpisodes, setActiveEpisodeId, handleAssetRefresh])

  const activeEpisode = useMemo(
    () => episodes.find((ep) => ep.id === activeEpisodeId) ?? null,
    [episodes, activeEpisodeId]
  )

  const handleSelectEpisode = useCallback(
    (ep: Episode) => {
      setActiveEpisodeId(ep.id)
    },
    [setActiveEpisodeId]
  )

  const handleGenerateEpisodes = useCallback(
    async (episodeIdsOrdered: string[]) => {
      try {
        await generateScripts(projectId, episodeIdsOrdered, "overwrite")
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "生成失败")
        throw err
      }
    },
    [projectId, generateScripts]
  )

  const runCreateEpisodeFollowUp = useCallback(
    async (episodeId: string) => {
      try {
        setCreateEpisodeProgressError(null)
        setCreateEpisodeProgressFinished(false)

        setCreateEpisodeStatusMessage("正在提取资产…")
        updateCreateEpisodeStep("extract", "running")

        const extracted = await apiFetch<{
          characters: ExtractedCharacter[]
          scenes: ExtractedScene[]
          props: ExtractedProp[]
        }>("/api/episodes/extract-assets", {
          method: "POST",
          body: { episodeIds: [episodeId] },
        })

        updateCreateEpisodeStep("extract", "completed")
        setCreateEpisodeStatusMessage("正在保存资产…")
        updateCreateEpisodeStep("save", "running")

        await apiFetch("/api/assets/batch-save", {
          method: "POST",
          body: {
            projectId,
            episodeId,
            characters: (extracted.characters ?? []).map((item) => ({
              ...item,
              strategy: "save",
            })),
            scenes: (extracted.scenes ?? []).map((item) => ({
              ...item,
              strategy: "save",
            })),
            props: (extracted.props ?? []).map((item) => ({
              ...item,
              strategy: "save",
            })),
          },
        })

        updateCreateEpisodeStep("save", "completed")
        await handleAssetRefresh()

        setCreateEpisodeStatusMessage("正在生成剧本…")
        updateCreateEpisodeStep("script", "running")

        await generateScripts(projectId, [episodeId], "overwrite")
        const { generateStatus: latestGenerateStatus, generateError: latestGenerateError } =
          useScriptStore.getState()
        if (latestGenerateStatus === "error") {
          throw new Error(latestGenerateError || "剧本生成失败")
        }

        updateCreateEpisodeStep("script", "completed")
        setCreateEpisodeStatusMessage("已完成，资产和剧本都准备好了。")
        setCreateEpisodeProgressFinished(true)
        await fetchEpisodes(projectId)
        toast.success("资产提取和剧本生成已完成")
      } catch (err) {
        setCreateEpisodeProgressError(
          err instanceof Error ? err.message : "自动处理失败，请稍后重试"
        )
        setCreateEpisodeStatusMessage("处理已中断，请查看错误提示。")
        setCreateEpisodeProgressFinished(true)
        setCreateEpisodeProgressSteps((prev) =>
          prev.map((step) =>
            step.status === "running" ? { ...step, status: "error" } : step
          )
        )
        toast.error(err instanceof Error ? err.message : "自动处理失败")
      }
    },
    [fetchEpisodes, generateScripts, handleAssetRefresh, projectId, updateCreateEpisodeStep]
  )

  const handleCreateEpisodeWithRawText = useCallback(
    async (params: { title: string; rawText: string; extractAssets: boolean }) => {
      const result = await createEpisodeWithRawText(projectId, params)

      if (!result.extractAssets) {
        toast.success("分集已创建")
        return
      }

      setCreateEpisodeProgressTitle(params.title)
      setCreateEpisodeProgressSteps(INITIAL_CREATE_EPISODE_STEPS)
      setCreateEpisodeStatusMessage("已创建分集，马上开始处理…")
      setCreateEpisodeProgressError(null)
      setCreateEpisodeProgressFinished(false)
      setShowCreateEpisodeProgress(true)
      toast.success("分集已创建，正在继续提取资产并生成剧本")

      void runCreateEpisodeFollowUp(result.episodeId)
    },
    [projectId, createEpisodeWithRawText, runCreateEpisodeFollowUp]
  )

  const handleOpenExtractAssets = useCallback(() => {
    if (!activeEpisodeId) return
    setExtractTargetEpisodeId(activeEpisodeId)
    setShowExtractAssets(true)
  }, [activeEpisodeId])

  const handleExtractAssetsSuccess = useCallback(async () => {
    toast.success("资产已保存并绑定到本集")
    await handleAssetRefresh()
    await fetchEpisodes(projectId)
    setShowExtractAssets(false)
    setExtractTargetEpisodeId(null)
  }, [handleAssetRefresh, fetchEpisodes, projectId])

  const handleDeleteEpisode = useCallback(
    async (pid: string, eid: string) => {
      try {
        await deleteEpisode(pid, eid)
        if (activeEpisodeId === eid) {
          setActiveEpisodeId(null)
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "删除分集失败")
      }
    },
    [deleteEpisode, activeEpisodeId, setActiveEpisodeId]
  )

  const episodesForProject = useMemo(
    () => episodes.filter((e) => e.projectId === projectId),
    [episodes, projectId]
  )
  const episodeDisplayMap = useMemo(
    () => buildEpisodeDisplayNumberMap(episodesForProject),
    [episodesForProject]
  )
  const isGenerating = generateStatus === "generating"
  const hasAnyEpisodes = episodesForProject.length > 0
  const hasScripts = episodesForProject.some((ep) => ep.script)
  const showScriptWorkspace = hasScripts || hasAnyEpisodes

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
            <ScriptStatsPanel episodes={episodesForProject} />
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreateEpisodeDialog(true)}
            disabled={isGenerating}
          >
            <FilePlus className="size-4" />
            新建分集
          </Button>
          {episodesForProject.length > 0 && (
            <>
              <GenerateScriptButton
                generateStatus={generateStatus}
                onClick={() => setShowEpisodeSelect(true)}
              />
            </>
          )}
        </div>
      </div>

      {/* Generate error */}
      {generateStatus === "error" && generateError && (
        <div className="px-6 py-2 border-b bg-destructive/5 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-destructive break-all">剧本生成失败: {generateError}</p>
              <button
                onClick={() => setShowEpisodeSelect(true)}
                className="text-xs text-destructive underline hover:no-underline"
              >
                重新选择分集
              </button>
            </div>
            <button
              type="button"
              onClick={clearGenerateError}
              className="text-destructive/80 hover:text-destructive"
              aria-label="关闭错误提示"
              title="关闭"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!showScriptWorkspace && !isGenerating && (
        <div className="flex-1 overflow-hidden">
          <ScriptEmptyState
            episodes={episodesForProject}
            onOpenGenerate={() => setShowEpisodeSelect(true)}
            onCreateEpisode={() => setShowCreateEpisodeDialog(true)}
          />
        </div>
      )}

      {/* Main content */}
      {showScriptWorkspace && (
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
                <div className="h-full min-h-0 bg-background overflow-hidden">
                  <EpisodeNavList
                    projectId={projectId}
                    episodes={episodes}
                    activeEpisodeId={activeEpisodeId}
                    generateStatus={generateStatus}
                    assetCharacters={assetCharacters}
                    assetScenes={assetScenes}
                    assetProps={assetProps}
                    onSelectEpisode={handleSelectEpisode}
                    onDeleteEpisode={handleDeleteEpisode}
                    onReorderEpisodes={reorderEpisodes}
                    onAddEpisode={() => setShowCreateEpisodeDialog(true)}
                  />
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Right: Script editor */}
              <ResizablePanel className="min-w-0">
                <div className="h-full min-w-0 overflow-hidden">
                  {activeEpisode ? (
                    <ScriptEditor
                      episode={activeEpisode}
                      episodeDisplayNumber={
                        episodeDisplayMap.get(activeEpisode.id) ?? 1
                      }
                      assetCharacters={assetCharacters}
                      assetScenes={assetScenes}
                      assetProps={assetProps}
                      onUpdateScript={(data) =>
                        updateScript(activeEpisode.id, data)
                      }
                      onUpdateEpisode={(data) =>
                        updateEpisode(activeEpisode.id, data)
                      }
                      isGeneratingScript={isGenerating}
                      onAssetRefresh={() => void handleAssetRefresh()}
                      onExtractAssets={handleOpenExtractAssets}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8 max-w-md mx-auto">
                      <h3 className="text-base font-medium mb-2">选择一个分集</h3>
                      <p className="text-sm text-muted-foreground">
                        点击左侧任意分集即可开始编辑剧本
                      </p>
                    </div>
                  )}
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </>
      )}

      {/* 新建分集 dialog */}
      <CreateEpisodeDialog
        open={showCreateEpisodeDialog}
        onOpenChange={setShowCreateEpisodeDialog}
        onSubmit={handleCreateEpisodeWithRawText}
        nextEpisodeNumber={episodesForProject.length + 1}
      />

      <CreateEpisodeProgressDialog
        open={showCreateEpisodeProgress}
        onOpenChange={setShowCreateEpisodeProgress}
        episodeTitle={createEpisodeProgressTitle}
        steps={createEpisodeProgressSteps}
        statusMessage={createEpisodeStatusMessage}
        errorMessage={createEpisodeProgressError}
        finished={createEpisodeProgressFinished}
      />

      {/* Episode select dialog */}
      <ChapterSelectDialog
        open={showEpisodeSelect}
        onOpenChange={setShowEpisodeSelect}
        episodes={episodesForProject}
        onGenerate={handleGenerateEpisodes}
      />

      {/* Extract assets dialog */}
      {extractTargetEpisodeId && (
        <ExtractAssetsDialog
          open={showExtractAssets}
          onOpenChange={(v) => {
            setShowExtractAssets(v)
            if (!v) setExtractTargetEpisodeId(null)
          }}
          projectId={projectId}
          episodeId={extractTargetEpisodeId}
          onSuccess={handleExtractAssetsSuccess}
        />
      )}
    </div>
  )
}
