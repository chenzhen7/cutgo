"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Check, X, Pencil } from "lucide-react"
import { parseJsonArray } from "@/lib/utils"
import type {
  AssetCharacter,
  AssetProp,
  AssetScene,
  Episode,
} from "@/lib/types"
import { countWords } from "@/lib/novel-utils"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import {
  CharacterFormDialog,
  SceneFormDialog,
  PropFormDialog,
} from "@/components/asset-form-dialogs"
import { useAssetStore } from "@/store/asset-store"
import { ScriptEditorLeftPanel } from "./script-editor-left-panel"
import { ScriptEditorTextPanel } from "./script-editor-text-panel"

interface ScriptEditorProps {
  episode: Episode
  /** 全项目分集排序后的展示集序号（第 1、2… 集），非数据库 index 字段 */
  episodeDisplayNumber: number
  assetCharacters: AssetCharacter[]
  assetScenes: AssetScene[]
  assetProps: AssetProp[]
  onUpdateScript: (data: {
    content?: string
  }) => Promise<void>
  onUpdateEpisode?: (data: {
    title?: string
    characters?: string
    scenes?: string
    props?: string
  }) => Promise<void>
  isGeneratingScript?: boolean
  onAssetRefresh?: () => void
}

export function ScriptEditor({
  episode,
  episodeDisplayNumber,
  assetCharacters,
  assetScenes,
  assetProps,
  onUpdateScript,
  onUpdateEpisode,
  isGeneratingScript = false,
  onAssetRefresh,
}: ScriptEditorProps) {
  const { updateCharacter, updateScene, updateProp } = useAssetStore()
  const [editingCharacter, setEditingCharacter] = useState<AssetCharacter | null>(null)
  const [editingScene, setEditingScene] = useState<AssetScene | null>(null)
  const [editingProp, setEditingProp] = useState<AssetProp | null>(null)
  const [content, setContent] = useState(episode.script ?? "")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState(episode.title)
  const [savingTitle, setSavingTitle] = useState(false)
  const titleInputRef = useRef<HTMLInputElement>(null)

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const gutterRef = useRef<HTMLDivElement>(null)
  const isDirty = content !== (episode.script ?? "")

  const characterIds = parseJsonArray(episode.characters)
  const sceneIds = parseJsonArray(episode.scenes)
  const propIds = parseJsonArray(episode.props)
  const boundScenes = assetScenes.filter((s) => sceneIds.includes(s.id))
  const boundCharacters = assetCharacters.filter((c) => characterIds.includes(c.id))
  const boundProps = assetProps.filter((p) => propIds.includes(p.id))

  useEffect(() => {
    setContent(episode.script ?? "")
    setSaved(false)
  }, [episode.id, episode.script])

  useEffect(() => {
    setTitleValue(episode.title)
  }, [episode.id, episode.title])

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  const triggerAutoSave = useCallback(
    (newContent: string) => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
        saveTimerRef.current = null
      }
      const server = episode.script ?? ""
      if (newContent === server) return
      saveTimerRef.current = setTimeout(async () => {
        setSaving(true)
        try {
          await onUpdateScript({ content: newContent.trim() || undefined })
          setSaved(true)
          setTimeout(() => setSaved(false), 2000)
        } finally {
          setSaving(false)
        }
      }, 800)
    },
    [episode.script, onUpdateScript]
  )

  const handleContentChange = (v: string) => {
    setContent(v)
    triggerAutoSave(v)
  }

  const handleSaveNow = async () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = null
    setSaving(true)
    try {
      await onUpdateScript({ content: content.trim() || undefined })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const handleDiscard = () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    setContent(episode.script ?? "")
    setSaved(false)
  }

  const handleToggleCharacter = async (characterId: string) => {
    if (!onUpdateEpisode) return
    const next = characterIds.includes(characterId)
      ? characterIds.filter((id) => id !== characterId)
      : [...characterIds, characterId]
    await onUpdateEpisode({ characters: JSON.stringify(next) })
  }

  const handleToggleScene = async (sceneId: string) => {
    if (!onUpdateEpisode) return
    const next = sceneIds.includes(sceneId)
      ? sceneIds.filter((id) => id !== sceneId)
      : [...sceneIds, sceneId]
    await onUpdateEpisode({ scenes: JSON.stringify(next) })
  }

  const handleToggleProp = async (propId: string) => {
    if (!onUpdateEpisode) return
    const next = propIds.includes(propId)
      ? propIds.filter((id) => id !== propId)
      : [...propIds, propId]
    await onUpdateEpisode({ props: JSON.stringify(next) })
  }

  const handleTitleEdit = () => {
    if (!onUpdateEpisode) return
    setEditingTitle(true)
    setTimeout(() => titleInputRef.current?.select(), 0)
  }

  const handleTitleSave = async () => {
    const trimmed = titleValue.trim()
    if (!trimmed || trimmed === episode.title) {
      setEditingTitle(false)
      setTitleValue(episode.title)
      return
    }
    setSavingTitle(true)
    try {
      await onUpdateEpisode?.({ title: trimmed })
    } finally {
      setSavingTitle(false)
      setEditingTitle(false)
    }
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleTitleSave()
    if (e.key === "Escape") {
      setEditingTitle(false)
      setTitleValue(episode.title)
    }
  }

  const wordCount = countWords(content)
  const lineCount = content ? content.split("\n").length : 0

  const lineNumbers = content.split("\n").map((_, i) => i + 1)

  const syncGutterScroll = () => {
    const ta = textareaRef.current
    const g = gutterRef.current
    if (ta && g) g.scrollTop = ta.scrollTop
  }

  return (
    <>
      <div className="flex flex-col h-full">
        {/* 顶栏 */}
        <div className="flex items-center gap-2 px-4 h-[52px] border-b shrink-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-xs font-bold text-primary bg-primary/10 rounded px-2 py-0.5 shrink-0">
              第{episodeDisplayNumber}集
            </span>
            {editingTitle ? (
              <input
                ref={titleInputRef}
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={handleTitleKeyDown}
                disabled={savingTitle}
                className="flex-1 min-w-0 text-sm font-semibold bg-transparent border-b border-primary outline-none px-0.5 py-0 truncate"
                autoFocus
              />
            ) : (
              <button
                type="button"
                onClick={handleTitleEdit}
                disabled={!onUpdateEpisode}
                className="group flex items-center gap-1 min-w-0 text-left"
                title={onUpdateEpisode ? "点击修改标题" : undefined}
              >
                <h3 className="text-sm font-semibold truncate">{episode.title}</h3>
                {onUpdateEpisode && (
                  <Pencil className="size-3 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {saving && (
              <span className="text-xs text-muted-foreground">保存中...</span>
            )}
            {saved && !saving && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Check className="size-3" />
                已保存
              </span>
            )}
            {isDirty && !saving && !saved && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={handleSaveNow}
                >
                  <Check className="size-3 mr-1" />
                  保存
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground"
                  onClick={handleDiscard}
                >
                  <X className="size-3 mr-1" />
                  放弃
                </Button>
              </>
            )}
          </div>
        </div>

        {/* 左右可拖拽布局：左侧资产区，右侧剧本编辑区 */}
        <ResizablePanelGroup
          orientation="horizontal"
          className="flex-1 min-h-0"
        >
          <ResizablePanel
            defaultSize={"40%"}
            minSize={"30%"}
            maxSize={"60%"}
            className="min-w-0 flex flex-col"
          >
            <ScriptEditorLeftPanel
              episode={episode}
              assetCharacters={assetCharacters}
              assetScenes={assetScenes}
              assetProps={assetProps}
              characterIds={characterIds}
              sceneIds={sceneIds}
              propIds={propIds}
              boundCharacters={boundCharacters}
              boundScenes={boundScenes}
              boundProps={boundProps}
              onToggleCharacter={handleToggleCharacter}
              onToggleScene={handleToggleScene}
              onToggleProp={handleToggleProp}
              onPickCharacter={setEditingCharacter}
              onPickScene={setEditingScene}
              onPickProp={setEditingProp}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel className="min-w-0">
            <ScriptEditorTextPanel
              content={content}
              lineNumbers={lineNumbers}
              lineCount={lineCount}
              wordCount={wordCount}
              isGeneratingScript={isGeneratingScript}
              textareaRef={textareaRef}
              gutterRef={gutterRef}
              onChange={handleContentChange}
              onScrollSync={syncGutterScroll}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Asset Edit Dialogs */}
      <CharacterFormDialog
        open={!!editingCharacter}
        onOpenChange={(open) => { if (!open) setEditingCharacter(null) }}
        character={editingCharacter}
        onSave={async (data) => {
          if (!editingCharacter) return
          await updateCharacter(editingCharacter.id, data)
          setEditingCharacter(null)
          onAssetRefresh?.()
        }}
      />
      <SceneFormDialog
        open={!!editingScene}
        onOpenChange={(open) => { if (!open) setEditingScene(null) }}
        scene={editingScene}
        onSave={async (data) => {
          if (!editingScene) return
          await updateScene(editingScene.id, data)
          setEditingScene(null)
          onAssetRefresh?.()
        }}
      />
      <PropFormDialog
        open={!!editingProp}
        onOpenChange={(open) => { if (!open) setEditingProp(null) }}
        prop={editingProp}
        onSave={async (data) => {
          if (!editingProp) return
          await updateProp(editingProp.id, data)
          setEditingProp(null)
          onAssetRefresh?.()
        }}
      />
    </>
  )
}
