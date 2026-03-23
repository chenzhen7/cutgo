"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useScriptStore } from "@/store/script-store"
import type { AssetCharacter, AssetProp, AssetScene, Episode, Script } from "@/lib/types"
import { Loader2, ListOrdered } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ScriptEmptyState } from "./components/script-empty-state"
import { ScriptStatsPanel } from "./components/script-stats-panel"
import { GenerateScriptButton } from "./components/generate-script-button"
import { ChapterSelectDialog } from "./components/chapter-select-dialog"
import { EpisodeOutlineDialog } from "./components/episode-outline-dialog"
import { EpisodeNavList } from "./components/episode-nav-list"
import { ScriptEditor } from "./components/script-editor"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { buildEpisodeDisplayNumberMap } from "@/lib/episode-display"

export default function ScriptPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const {
    scripts,
    episodes,
    generateStatus,
    generateError,
    fetchScripts,
    fetchEpisodes,
    fetchChapters,
    chapters,
    generateScripts,
    updateScript,
    createScript,
    deleteEpisode,
    reorderEpisodes,
    createEpisodeWithScript,
    updateEpisode,
    generateEpisodeOutlines,
  } = useScriptStore()

  const [showEpisodeSelect, setShowEpisodeSelect] = useState(false)
  const [showOutlineDialog, setShowOutlineDialog] = useState(false)
  const [loading, setLoading] = useState(true)
  const [assetCharacters, setAssetCharacters] = useState<AssetCharacter[]>([])
  const [assetScenes, setAssetScenes] = useState<AssetScene[]>([])
  const [assetProps, setAssetProps] = useState<AssetProp[]>([])
  const [activeEpisodeId, setActiveEpisodeId] = useState<string | null>(null)
  const [activeScript, setActiveScript] = useState<Script | null>(null)
  const [creatingScript, setCreatingScript] = useState(false)

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await fetchEpisodes(projectId)
      await fetchChapters(projectId)
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
  }, [projectId, fetchEpisodes, fetchChapters, fetchScripts])

  /** 脚本列表变动时，同步更新当前活跃的 script 对象（保持引用最新） */
  useEffect(() => {
    if (!activeEpisodeId) return
    const found = scripts.find((s) => s.episodeId === activeEpisodeId) ?? null
    setActiveScript(found)
  }, [scripts, activeEpisodeId])

  const handleSelectEpisode = useCallback(
    async (ep: Episode, script: Script | undefined) => {
      setActiveEpisodeId(ep.id)
      if (script) {
        setActiveScript(script)
        return
      }
      // 无剧本时，静默创建一条空剧本记录，让用户直接编辑
      if (creatingScript) return
      setCreatingScript(true)
      setActiveScript(null)
      try {
        await createScript(projectId, ep.id, ep.title)
        // createScript 内部已 set({ scripts: [...] })，上面的 useEffect 会自动同步
      } catch {
        // 如果已存在（409），刷新一次即可
        await fetchScripts(projectId)
      } finally {
        setCreatingScript(false)
      }
    },
    [projectId, createScript, fetchScripts, creatingScript]
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

  const handleCreateEpisodeScript = useCallback(
    async (chapterId: string) => {
      try {
        await createEpisodeWithScript(projectId, chapterId)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "新增分集失败")
      }
    },
    [projectId, createEpisodeWithScript]
  )

  const handleGenerateOutlinesFromChapters = useCallback(
    async (chapterIdsOrdered: string[]) => {
      try {
        await generateEpisodeOutlines(projectId, chapterIdsOrdered)
        toast.success("分集大纲生成完成")
      } catch (err) {
        const code = (err as Error & { code?: string }).code
        if (code === "LLM_NOT_CONFIGURED") {
          toast.error("尚未配置语言模型，无法生成分集大纲", {
            action: {
              label: "去配置",
              onClick: () => router.push("/settings"),
            },
            duration: 8000,
          })
        } else {
          toast.error(err instanceof Error ? err.message : "生成大纲失败")
        }
        throw err
      }
    },
    [projectId, generateEpisodeOutlines, router]
  )

  const handleDeleteEpisode = useCallback(
    async (pid: string, eid: string) => {
      try {
        await deleteEpisode(pid, eid)
        if (activeEpisodeId === eid) {
          setActiveEpisodeId(null)
          setActiveScript(null)
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "删除分集失败")
      }
    },
    [deleteEpisode, activeEpisodeId]
  )

  const hasScripts = scripts.length > 0

  const episodesForProject = useMemo(
    () => episodes.filter((e) => e.projectId === projectId),
    [episodes, projectId]
  )
  const episodeDisplayMap = useMemo(
    () => buildEpisodeDisplayNumberMap(episodesForProject),
    [episodesForProject]
  )
  const isGenerating = generateStatus === "generating"
  /** 已有分集记录（含仅有大纲、尚未生成剧本时）也应显示左侧分集列表，否则会误以为分集未创建 */
  const hasAnyEpisodes = episodesForProject.length > 0
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
            <ScriptStatsPanel scripts={scripts} episodes={episodes} />
          )}
        </div>
        {episodesForProject.length > 0 && (
          <div className="flex items-center gap-2">
            {chapters.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowOutlineDialog(true)}
                disabled={isGenerating}
              >
                <ListOrdered className="size-4" />
                生成分集大纲
              </Button>
            )}
            <GenerateScriptButton
              generateStatus={generateStatus}
              onClick={() => setShowEpisodeSelect(true)}
            />
          </div>
        )}
      </div>

      {/* Generate error */}
      {generateStatus === "error" && generateError && (
        <div className="px-6 py-2 border-b bg-destructive/5 shrink-0">
          <p className="text-xs text-destructive">{generateError}</p>
          <button
            onClick={() => setShowEpisodeSelect(true)}
            className="text-xs text-destructive underline hover:no-underline"
          >
            重新选择分集
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
              AI 正按分集顺序依次生成剧本，请稍候
            </p>
          </div>
        </div>
      )}

      {/* Empty state：无分集且无剧本时引导导入 / 生成分集大纲 */}
      {!showScriptWorkspace && !isGenerating && (
        <div className="flex-1 overflow-hidden">
          <ScriptEmptyState
            episodes={episodesForProject}
            chapters={chapters}
            onGoToImport={() => router.push(`/project/${projectId}/import`)}
            onOpenGenerate={() => setShowEpisodeSelect(true)}
            onOpenOutlineDialog={() => setShowOutlineDialog(true)}
          />
        </div>
      )}

      {/* Main content：有剧本或有分集时展示左侧分集列表 */}
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
                    scripts={scripts}
                    activeEpisodeId={activeEpisodeId}
                    generateStatus={generateStatus}
                    assetCharacters={assetCharacters}
                    assetScenes={assetScenes}
                    assetProps={assetProps}
                    onSelectEpisode={handleSelectEpisode}
                    onDeleteEpisode={handleDeleteEpisode}
                    onReorderEpisodes={reorderEpisodes}
                    onCreateEpisodeScript={handleCreateEpisodeScript}
                  />
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Right: Script editor */}
              <ResizablePanel className="min-w-0">
                <div className="h-full min-w-0 overflow-hidden">
                  {(() => {
                    const activeEpisode = activeScript
                      ? episodes.find((e) => e.id === activeScript.episodeId)
                      : null

                    if (activeScript && activeEpisode) {
                      return (
                        <ScriptEditor
                          script={activeScript}
                          episode={activeEpisode}
                          chapters={chapters}
                          episodeDisplayNumber={
                            episodeDisplayMap.get(activeScript.episodeId) ?? 1
                          }
                          projectId={projectId}
                          assetCharacters={assetCharacters}
                          assetScenes={assetScenes}
                          assetProps={assetProps}
                          onUpdateScript={(data) =>
                            updateScript(activeScript.id, data)
                          }
                          onUpdateEpisode={(data) =>
                            updateEpisode(activeScript.episodeId, data)
                          }
                        />
                      )
                    }

                    if (creatingScript) {
                      return (
                        <div className="flex items-center justify-center h-full gap-2 text-sm text-muted-foreground">
                          <Loader2 className="size-4 animate-spin" />
                          正在准备编辑器...
                        </div>
                      )
                    }

                    return (
                      <div className="flex flex-col items-center justify-center h-full text-center p-8 max-w-md mx-auto">
                        <h3 className="text-base font-medium mb-2">选择一个分集</h3>
                        <p className="text-sm text-muted-foreground">
                          点击左侧任意分集即可开始编辑剧本
                        </p>
                      </div>
                    )
                  })()}
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </>
      )}

      {/* Episode select dialog */}
      <ChapterSelectDialog
        open={showEpisodeSelect}
        onOpenChange={setShowEpisodeSelect}
        episodes={episodesForProject}
        scripts={scripts}
        onGenerate={handleGenerateEpisodes}
      />

      {/* Episode outline dialog */}
      <EpisodeOutlineDialog
        open={showOutlineDialog}
        onOpenChange={setShowOutlineDialog}
        chapters={chapters}
        episodes={episodesForProject}
        onGenerate={handleGenerateOutlinesFromChapters}
      />
    </div>
  )
}
