"use client"

import { useEffect, useState, useMemo } from "react"
import { useDefaultLayout } from "react-resizable-panels"
import { useParams } from "next/navigation"
import { useStoryboardStore } from "@/store/storyboard-store"
import { useVideoEditorStore } from "@/store/video-editor-store"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Download, Film, Music, Type, Settings2, Clapperboard } from "lucide-react"
import { VideoPreview } from "./components/video-preview"
import { TimelineEditor } from "./components/timeline-editor"
import { ClipPropertiesPanel } from "./components/clip-properties-panel"
import { BgmPanel } from "./components/bgm-panel"
import { ExportDialog } from "./components/export-dialog"
import { EpisodeSelector } from "./components/episode-selector"
import { AssetLibrary } from "./components/asset-library"

export default function VideoPage() {
  const params = useParams()
  const projectId = params.id as string

  const [loading, setLoading] = useState(true)
  const [exportOpen, setExportOpen] = useState(false)
  const [rightTab, setRightTab] = useState<string>("properties")

  const fetchStoryboards = useStoryboardStore(s => s.fetchStoryboards)
  const fetchEpisodes = useStoryboardStore(s => s.fetchEpisodes)
  const storyboards = useStoryboardStore(s => s.storyboards)
  const episodes = useStoryboardStore(s => s.episodes)

  const videoClips = useVideoEditorStore(s => s.videoClips)
  const selectedClipId = useVideoEditorStore(s => s.selectedClipId)
  const duration = useVideoEditorStore(s => s.duration)
  const initFromStoryboards = useVideoEditorStore(s => s.initFromStoryboards)
  const setActiveEpisodeId = useVideoEditorStore(s => s.setActiveEpisodeId)

  const activeEpisodeId = useVideoEditorStore(s => s.activeEpisodeId)

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await Promise.all([
        fetchEpisodes(projectId),
        fetchStoryboards(projectId),
      ])
      setLoading(false)
    }
    init()
  }, [projectId, fetchEpisodes, fetchStoryboards])

  useEffect(() => {
    if (storyboards.length > 0 && episodes.length > 0 && !activeEpisodeId) {
      // 如果没有选择分集，且当前没有激活的分集，默认选择第一个分集
      const defaultEpisodeId = episodes[0]?.id
      initFromStoryboards(storyboards, episodes, defaultEpisodeId)
    }
  }, [storyboards, episodes, activeEpisodeId, initFromStoryboards, setActiveEpisodeId])

  useEffect(() => {
    if (selectedClipId) {
      setRightTab("properties")
    }
  }, [selectedClipId])

  const verticalLayout = useDefaultLayout({ id: "video-editor-vertical" })
  const horizontalLayout = useDefaultLayout({
    id: "video-editor-horizontal",
    panelIds: ["asset-library", "preview", "properties"],
  })

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, "0")}`
  }

  const hasVideoShots = useMemo(() =>
    storyboards.some((sb) => sb.shots.some((s) => s.videoUrl)),
    [storyboards]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">加载视频数据...</p>
        </div>
      </div>
    )
  }

  if (!hasVideoShots) {
    return (
      <div className="flex h-full flex-col">
        <div className="shrink-0 border-b px-6 py-4">
          <h2 className="text-xl font-semibold text-foreground">视频合成</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            剪辑、编辑、预览视频，添加BGM并合成最终视频
          </p>
        </div>
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="max-w-md text-center">
            <div className="size-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Clapperboard className="size-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">暂无可编辑的视频</h3>
            <p className="text-sm text-muted-foreground mb-4">
              请先在「分镜生成」模块中为镜头生成视频，然后回到此处进行剪辑和合成。
            </p>
            <Button
              variant="outline"
              onClick={() => window.history.back()}
            >
              返回分镜生成
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top toolbar */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2 border-b bg-background">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-foreground">视频合成</h2>
          <div className="w-px h-4 bg-border" />
          <EpisodeSelector />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Film className="size-3.5" />
            <span>{videoClips.length} 个片段</span>
            <span className="text-border">·</span>
            <span>总时长 {formatDuration(duration)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="h-8 gap-1.5"
            onClick={() => setExportOpen(true)}
            disabled={videoClips.length === 0}
          >
            <Download className="size-3.5" />
            导出视频
          </Button>
        </div>
      </div>

      {/* Main editor area */}
      <div className="flex-1 min-h-0">
        <ResizablePanelGroup
          orientation="vertical"
          defaultLayout={verticalLayout.defaultLayout}
          onLayoutChanged={verticalLayout.onLayoutChanged}
        >
          {/* Top section: Asset Library + Preview + Properties */}
          <ResizablePanel defaultSize={60} minSize="40%">
            <ResizablePanelGroup
              orientation="horizontal"
              defaultLayout={horizontalLayout.defaultLayout}
              onLayoutChanged={horizontalLayout.onLayoutChanged}
            >
              {/* Asset Library */}
              <ResizablePanel id="asset-library" defaultSize={18} minSize="14%" maxSize="600px">
                <div className="h-full bg-background overflow-hidden">
                  <AssetLibrary />
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Preview */}
              <ResizablePanel id="preview" defaultSize={52} minSize="25%">
                <div className="h-full p-2 bg-muted/10">
                  <VideoPreview />
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Properties / BGM */}
              <ResizablePanel id="properties" defaultSize={30} minSize="18%">
                <div className="h-full ">
                  <Tabs value={rightTab} onValueChange={setRightTab} className="h-full flex flex-col">
                    <TabsList className="shrink-0 w-full justify-start rounded-none border-b bg-transparent h-9 px-2">
                      <TabsTrigger value="properties" className="text-xs h-7 gap-1 data-[state=active]:bg-muted">
                        <Settings2 className="size-3" />
                        属性
                      </TabsTrigger>
                      <TabsTrigger value="bgm" className="text-xs h-7 gap-1 data-[state=active]:bg-muted">
                        <Music className="size-3" />
                        BGM
                      </TabsTrigger>
                      <TabsTrigger value="subtitle" className="text-xs h-7 gap-1 data-[state=active]:bg-muted">
                        <Type className="size-3" />
                        字幕
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="properties" className="flex-1 min-h-0 mt-0">
                      <ClipPropertiesPanel />
                    </TabsContent>
                    <TabsContent value="bgm" className="flex-1 min-h-0 mt-0">
                      <BgmPanel />
                    </TabsContent>
                    <TabsContent value="subtitle" className="flex-1 min-h-0 mt-0">
                      <SubtitleOverview />
                    </TabsContent>
                  </Tabs>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Bottom section: Timeline */}
          <ResizablePanel defaultSize={45} minSize="20%">
            <div className="h-full pt-0">
              <TimelineEditor />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Export dialog */}
      <ExportDialog open={exportOpen} onOpenChange={setExportOpen} />
    </div>
  )
}

function SubtitleOverview() {
  const subtitleClips = useVideoEditorStore(s => s.subtitleClips)
  const updateSubtitleClip = useVideoEditorStore(s => s.updateSubtitleClip)
  const removeSubtitleClip = useVideoEditorStore(s => s.removeSubtitleClip)
  const selectClip = useVideoEditorStore(s => s.selectClip)
  const addSubtitleClip = useVideoEditorStore(s => s.addSubtitleClip)
  const duration = useVideoEditorStore(s => s.duration)

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, "0")}`
  }

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 px-4 py-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Type className="size-4 text-amber-500" />
          <span className="text-sm font-medium">字幕管理</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={() => {
            addSubtitleClip({
              trackId: "subtitle-main",
              startTime: duration > 0 ? duration - 3 : 0,
              duration: 3,
              text: "新字幕",
              style: {
                fontSize: 36,
                fontColor: "#FFFFFF",
                backgroundColor: "rgba(0,0,0,0.5)",
                position: "bottom",
              },
            })
          }}
        >
          添加字幕
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
        {subtitleClips.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Type className="size-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">暂无字幕</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              字幕会从分镜的对白文本自动生成
            </p>
          </div>
        ) : (
          subtitleClips.map((clip, i) => (
            <div
              key={clip.id}
              className="p-3 rounded-lg border hover:border-amber-500/50 cursor-pointer transition-colors"
              onClick={() => selectClip(clip.id, "subtitle")}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">
                  {formatTime(clip.startTime)} - {formatTime(clip.startTime + clip.duration)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeSubtitleClip(clip.id)
                  }}
                >
                  <span className="text-xs">×</span>
                </Button>
              </div>
              <p className="text-sm line-clamp-2">{clip.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
