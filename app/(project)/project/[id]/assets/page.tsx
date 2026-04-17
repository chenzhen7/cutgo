"use client"

import { memo, useCallback, useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import {
  FolderOpen,
  Users,
  MapPin,
  Box,
  Plus,
  Search,
  Loader2,
  Trash2,
  Lock,
  Unlock,
  ImageIcon,
  Image,
  CheckSquare,
  Square,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useAssetStore } from "@/store/asset-store"
import { apiFetch } from "@/lib/api-client"
import { PreviewableImage } from "@/components/ui/previewable-image"
import {
  CharacterFormDialog,
  SceneFormDialog,
  PropFormDialog,
} from "@/components/asset-form-dialogs"
import type {
  AssetCharacter,
  AssetScene,
  AssetProp,
} from "@/lib/types"

type AssetTab = "characters" | "scenes" | "props"

type AssetGenerateType = "character" | "scene" | "prop"

interface GenerateItem {
  type: AssetGenerateType
  id: string
  name: string
  hasImage: boolean
  selected: boolean
  isGenerating: boolean
}

export default function AssetsPage() {
  const params = useParams()
  const projectId = params.id as string

  const {
    characters,
    scenes,
    props,
    fetchAssets,
    addCharacter,
    updateCharacter,
    deleteCharacter,
    deleteCharacters,
    addScene,
    updateScene,
    deleteScene,
    deleteScenes,
    addProp,
    updateProp,
    deleteProp,
    deleteProps,
  } = useAssetStore()

  const [activeTab, setActiveTab] = useState<AssetTab>("characters")
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  const [showCharacterForm, setShowCharacterForm] = useState(false)
  const [editingCharacter, setEditingCharacter] = useState<AssetCharacter | null>(null)
  const [deletingCharacterId, setDeletingCharacterId] = useState<string | null>(null)

  const [showSceneForm, setShowSceneForm] = useState(false)
  const [editingScene, setEditingScene] = useState<AssetScene | null>(null)
  const [deletingSceneId, setDeletingSceneId] = useState<string | null>(null)

  const [showPropForm, setShowPropForm] = useState(false)
  const [editingProp, setEditingProp] = useState<AssetProp | null>(null)
  const [deletingPropId, setDeletingPropId] = useState<string | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showBatchDeleteDialog, setShowBatchDeleteDialog] = useState(false)
  const [isBatchMode, setIsBatchMode] = useState(false)

  // 切换 tab 时退出批量模式并清空选择
  useEffect(() => {
    setIsBatchMode(false)
    setSelectedIds(new Set())
  }, [activeTab])

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await fetchAssets(projectId)
      setLoading(false)
    }
    init()
  }, [projectId, fetchAssets])
  const handleToggleCharacterLock = useCallback(
    (id: string, locked: boolean) => {
      void updateCharacter(id, { locked })
    },
    [updateCharacter]
  )

  const totalAssets = characters.length + scenes.length + props.length

  const currentTabAssets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (activeTab === "characters") {
      return characters.filter((c) =>
        !q || c.name.toLowerCase().includes(q) || c.prompt?.toLowerCase().includes(q) || c.role.toLowerCase().includes(q)
      )
    }
    if (activeTab === "scenes") {
      return scenes.filter((s) => !q || s.name.toLowerCase().includes(q) || s.prompt?.toLowerCase().includes(q))
    }
    return props.filter((p) => !q || p.name.toLowerCase().includes(q) || p.prompt?.toLowerCase().includes(q))
  }, [activeTab, characters, scenes, props, searchQuery])

  const currentTabSelectedIds = useMemo(
    () => currentTabAssets.map((a) => a.id).filter((id) => selectedIds.has(id)),
    [currentTabAssets, selectedIds]
  )

  const allCurrentSelected = currentTabAssets.length > 0 && currentTabAssets.every((a) => selectedIds.has(a.id))

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (allCurrentSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        currentTabAssets.forEach((a) => next.delete(a.id))
        return next
      })
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        currentTabAssets.forEach((a) => next.add(a.id))
        return next
      })
    }
  }

  const handleBatchDelete = async () => {
    if (currentTabSelectedIds.length === 0) return
    setDeleteSubmitting(true)
    try {
      if (activeTab === "characters") await deleteCharacters(currentTabSelectedIds)
      else if (activeTab === "scenes") await deleteScenes(currentTabSelectedIds)
      else await deleteProps(currentTabSelectedIds)
      setSelectedIds(new Set())
      setShowBatchDeleteDialog(false)
    } finally {
      setDeleteSubmitting(false)
    }
  }

  const TABS = [
    { key: "characters" as const, label: "角色库", icon: Users, count: characters.length },
    { key: "scenes" as const, label: "场景库", icon: MapPin, count: scenes.length },
    { key: "props" as const, label: "道具库", icon: Box, count: props.length },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <FolderOpen className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-foreground">资产库</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              项目全局共享的角色、场景与道具库，剧本与分镜等环节均可引用；支持手动维护与图片生成
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button

            onClick={() => setShowGenerateDialog(true)}
            disabled={totalAssets === 0}
          >
            <Image className="size-4" />
            生成图片
          </Button>
        </div>
      </div>



      {/* Tabs */}
      <div className="mt-6 flex items-center gap-1 border-b border-border">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm transition-colors -mb-px",
                isActive
                  ? "border-primary text-foreground font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              <Badge
                variant="secondary"
                className="h-5 min-w-[20px] text-[10px] px-1.5"
              >
                {tab.count}
              </Badge>
            </button>
          )
        })}
      </div>

      {/* Toolbar */}
      <div className="mt-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索资产..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {isBatchMode ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              已选择 {currentTabSelectedIds.length} 项
            </span>
            <Button variant="outline" size="sm" onClick={toggleSelectAll}>
              {allCurrentSelected ? "取消全选" : "全选"}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={currentTabSelectedIds.length === 0}
              onClick={() => setShowBatchDeleteDialog(true)}
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" />
              批量删除
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setIsBatchMode(false); setSelectedIds(new Set()) }}>
              取消
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => {
                if (activeTab === "characters") setShowCharacterForm(true)
                else if (activeTab === "scenes") setShowSceneForm(true)
                else setShowPropForm(true)
              }}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              添加
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsBatchMode(true)}>
              <CheckSquare className="mr-1 h-3.5 w-3.5" />
              批量操作
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="mt-6">
        {/* Empty state */}
        {totalAssets === 0 && (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-16">
            <FolderOpen className="h-12 w-12 text-muted-foreground/30" />
            <h3 className="mt-4 text-sm font-medium">暂无资产数据</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              请前往「小说导入」页面，通过“提取资产”弹窗生成角色、场景和道具
            </p>
          </div>
        )}

        {/* Characters Tab */}
        {activeTab === "characters" && characters.length > 0 && (
          <CharacterList
            characters={characters}
            searchQuery={searchQuery}
            selectedIds={selectedIds}
            isBatchMode={isBatchMode}
            onEdit={setEditingCharacter}
            onDelete={setDeletingCharacterId}
            onToggleLock={handleToggleCharacterLock}
            onToggleSelect={toggleSelect}
          />
        )}
        {activeTab === "characters" && characters.length === 0 && totalAssets > 0 && (
          <EmptyTabState label="角色" onAdd={() => setShowCharacterForm(true)} />
        )}

        {/* Scenes Tab */}
        {activeTab === "scenes" && scenes.length > 0 && (
          <SceneList
            scenes={scenes}
            searchQuery={searchQuery}
            selectedIds={selectedIds}
            isBatchMode={isBatchMode}
            onEdit={setEditingScene}
            onDelete={setDeletingSceneId}
            onToggleSelect={toggleSelect}
          />
        )}
        {activeTab === "scenes" && scenes.length === 0 && totalAssets > 0 && (
          <EmptyTabState label="场景" onAdd={() => setShowSceneForm(true)} />
        )}

        {/* Props Tab */}
        {activeTab === "props" && props.length > 0 && (
          <PropList
            props={props}
            searchQuery={searchQuery}
            selectedIds={selectedIds}
            isBatchMode={isBatchMode}
            onEdit={setEditingProp}
            onDelete={setDeletingPropId}
            onToggleSelect={toggleSelect}
          />
        )}
        {activeTab === "props" && props.length === 0 && totalAssets > 0 && (
          <EmptyTabState label="道具" onAdd={() => setShowPropForm(true)} />
        )}
      </div>

      {/* Character Form Dialog */}
      <CharacterFormDialog
        open={showCharacterForm || !!editingCharacter}
        onOpenChange={(open) => {
          if (!open) {
            setShowCharacterForm(false)
            setEditingCharacter(null)
          }
        }}
        character={editingCharacter}
        onSave={async (data) => {
          if (editingCharacter) {
            await updateCharacter(editingCharacter.id, data)
            setEditingCharacter(null)
          } else {
            await addCharacter(projectId, data)
            setShowCharacterForm(false)
          }
        }}
      />

      {/* Scene Form Dialog */}
      <SceneFormDialog
        open={showSceneForm || !!editingScene}
        onOpenChange={(open) => {
          if (!open) {
            setShowSceneForm(false)
            setEditingScene(null)
          }
        }}
        scene={editingScene}
        onSave={async (data) => {
          if (editingScene) {
            await updateScene(editingScene.id, data)
            setEditingScene(null)
          } else {
            await addScene(projectId, data)
            setShowSceneForm(false)
          }
        }}
      />

      {/* Prop Form Dialog */}
      <PropFormDialog
        open={showPropForm || !!editingProp}
        onOpenChange={(open) => {
          if (!open) {
            setShowPropForm(false)
            setEditingProp(null)
          }
        }}
        prop={editingProp}
        onSave={async (data) => {
          if (editingProp) {
            await updateProp(editingProp.id, data)
            setEditingProp(null)
          } else {
            await addProp(projectId, data)
            setShowPropForm(false)
          }
        }}
      />


      {/* Delete confirmations */}
      <DeleteConfirmDialog
        title="删除角色"
        itemName="角色"
        open={!!deletingCharacterId}
        submitting={deleteSubmitting}
        onOpenChange={(open) => {
          if (!open && !deleteSubmitting) setDeletingCharacterId(null)
        }}
        onConfirm={async () => {
          if (!deletingCharacterId || deleteSubmitting) return
          setDeleteSubmitting(true)
          try {
            await deleteCharacter(deletingCharacterId)
            setDeletingCharacterId(null)
          } finally {
            setDeleteSubmitting(false)
          }
        }}
      />

      <DeleteConfirmDialog
        title="删除场景"
        itemName="场景"
        open={!!deletingSceneId}
        submitting={deleteSubmitting}
        onOpenChange={(open) => {
          if (!open && !deleteSubmitting) setDeletingSceneId(null)
        }}
        onConfirm={async () => {
          if (!deletingSceneId || deleteSubmitting) return
          setDeleteSubmitting(true)
          try {
            await deleteScene(deletingSceneId)
            setDeletingSceneId(null)
          } finally {
            setDeleteSubmitting(false)
          }
        }}
      />

      <DeleteConfirmDialog
        title="删除道具"
        itemName="道具"
        open={!!deletingPropId}
        submitting={deleteSubmitting}
        onOpenChange={(open) => {
          if (!open && !deleteSubmitting) setDeletingPropId(null)
        }}
        onConfirm={async () => {
          if (!deletingPropId || deleteSubmitting) return
          setDeleteSubmitting(true)
          try {
            await deleteProp(deletingPropId)
            setDeletingPropId(null)
          } finally {
            setDeleteSubmitting(false)
          }
        }}
      />

      <DeleteConfirmDialog
        title="批量删除"
        itemName={`已选中的 ${currentTabSelectedIds.length} 个${
          activeTab === "characters" ? "角色" : activeTab === "scenes" ? "场景" : "道具"
        }`}
        open={showBatchDeleteDialog}
        submitting={deleteSubmitting}
        onOpenChange={(open) => {
          if (!open && !deleteSubmitting) setShowBatchDeleteDialog(false)
        }}
        onConfirm={handleBatchDelete}
      />

      <GenerateAssetImagesDialog
        open={showGenerateDialog}
        onOpenChange={setShowGenerateDialog}
        characters={characters}
        scenes={scenes}
        props={props}
        projectId={projectId}
      />
    </div>
  )
}

// ── Generate Asset Images Dialog ──

function GenerateAssetImagesDialog({
  open,
  onOpenChange,
  characters,
  scenes,
  props,
  projectId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  characters: AssetCharacter[]
  scenes: AssetScene[]
  props: AssetProp[]
  projectId: string
}) {
  const { fetchAssets, generatingAssets } = useAssetStore()
  const buildItems = useCallback((): GenerateItem[] => {
    const charItems: GenerateItem[] = characters.map((c) => ({
      type: "character" as const,
      id: c.id,
      name: c.name,
      hasImage: !!c.imageUrl,
      selected: !c.imageUrl && !generatingAssets[c.id],
      isGenerating: !!generatingAssets[c.id],
    }))
    const sceneItems: GenerateItem[] = scenes.map((s) => ({
      type: "scene" as const,
      id: s.id,
      name: s.name,
      hasImage: !!s.imageUrl,
      selected: !s.imageUrl && !generatingAssets[s.id],
      isGenerating: !!generatingAssets[s.id],
    }))
    const propItems: GenerateItem[] = props.map((p) => ({
      type: "prop" as const,
      id: p.id,
      name: p.name,
      hasImage: !!p.imageUrl,
      selected: !p.imageUrl && !generatingAssets[p.id],
      isGenerating: !!generatingAssets[p.id],
    }))
    return [...charItems, ...sceneItems, ...propItems]
  }, [characters, scenes, props, generatingAssets])

  const [draftItems, setDraftItems] = useState<GenerateItem[] | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const items = draftItems ?? buildItems()

  const selectedItems = items.filter((i) => i.selected)

  const allSelected = items.length > 0 && items.filter(i => !i.isGenerating).every((i) => i.selected)
  const noneSelected = items.filter(i => !i.isGenerating).every((i) => !i.selected)

  const toggleAll = () => {
    const newVal = !allSelected
    setDraftItems(items.map((i) => (i.isGenerating ? i : { ...i, selected: newVal })))
  }

  const toggleItem = (id: string) => {
    setDraftItems(
      items.map((i) => (i.id === id && !i.isGenerating ? { ...i, selected: !i.selected } : i))
    )
  }

  const handleGenerate = async () => {
    const toGenerate = items.filter((i) => i.selected)
    if (toGenerate.length === 0) return
    
    // 立即关闭弹窗
    setSubmitting(true)
    setDraftItems(null)
    onOpenChange(false)
    setSubmitting(false)
    /*

    toast.success(`已开始生成 ${toGenerate.length} 个资产图片`)

    // 在后台并行执行生成请求
    */
    toast.success(`已提交 ${toGenerate.length} 个资产图片生成任务`)

    void Promise.allSettled(
      toGenerate.map(async (item) => {
        try {
          const res = await apiFetch<{ success: boolean }>(`/api/assets/generate-images`, {
            method: "POST",
            body: { type: item.type, id: item.id },
          })
          
          if (res.success) {
            await fetchAssets(projectId)
          } else {
            toast.error(`资产 [${item.name}] 图片生成失败`)
          }
          return res
        } catch (e) {
          toast.error(`资产 [${item.name}] 图片生成失败`)
          throw e
        }
      })
    )
  }

  const typeLabel: Record<AssetGenerateType, string> = {
    character: "角色",
    scene: "场景",
    prop: "道具",
  }

  const typeIcon: Record<AssetGenerateType, React.ReactNode> = {
    character: <Users className="size-3.5 text-violet-500" />,
    scene: <MapPin className="size-3.5 text-blue-500" />,
    prop: <Box className="size-3.5 text-amber-600" />,
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!submitting) {
          if (v) {
            setDraftItems(buildItems())
            setSubmitting(false)
          } else {
            setDraftItems(null)
          }
          onOpenChange(v)
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="size-4" />
            生成资产图片
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
          <span>共 {items.length} 项资产，已勾选 {selectedItems.length} 项</span>
          <button
            onClick={toggleAll}
            className="flex items-center gap-1 text-xs hover:text-foreground transition-colors"
          >
            {allSelected ? (
              <CheckSquare className="size-3.5" />
            ) : (
              <Square className="size-3.5" />
            )}
            {allSelected ? "取消全选" : "全选"}
          </button>
        </div>
        <ScrollArea className="h-72 rounded-md border">
          <div className="p-2 space-y-0.5">
            {items.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">
                暂无资产
              </p>
            )}
            {items.map((item) => (
              <label
                key={item.id}
                className={cn(
                  "flex items-center gap-3 px-2 py-1.5 rounded cursor-pointer hover:bg-muted/60 transition-colors",
                  item.selected && "bg-muted/40",
                  item.isGenerating && "opacity-60 cursor-not-allowed"
                )}
              >
                <Checkbox
                  checked={item.selected}
                  onCheckedChange={() => toggleItem(item.id)}
                  disabled={item.isGenerating}
                />
                <span className="flex items-center gap-1.5 flex-1 min-w-0">
                  {typeIcon[item.type]}
                  <span className={cn("text-sm truncate", item.isGenerating && "text-muted-foreground")}>{item.name}</span>
                  <Badge variant="outline" className="text-[10px] px-1 py-0 shrink-0">
                    {typeLabel[item.type]}
                  </Badge>
                </span>
                {item.isGenerating ? (
                  <span className="text-[10px] text-blue-500 shrink-0 flex items-center gap-1">
                    <Loader2 className="size-3 animate-spin" />
                    生成中
                  </span>
                ) : item.hasImage ? (
                  <span className="text-[10px] text-muted-foreground shrink-0">已有图片</span>
                ) : null}
              </label>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            取消
          </Button>
          <Button
            onClick={() => void handleGenerate()}
            disabled={submitting || noneSelected}
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                提交中…
              </>
            ) : (
              <>
                <ImageIcon className="size-4" />
                生成 {selectedItems.length} 张图片
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Sub-components ──

function EmptyTabState({ label, onAdd }: { label: string; onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-12">
      <p className="text-sm text-muted-foreground">暂无{label}数据</p>
      <Button variant="outline" size="sm" className="mt-3" onClick={onAdd}>
        <Plus className="size-3.5" />
        手动添加{label}
      </Button>
    </div>
  )
}

function DeleteConfirmDialog({
  title,
  itemName,
  open,
  submitting,
  onOpenChange,
  onConfirm,
}: {
  title: string
  itemName: string
  open: boolean
  submitting: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-left">
            确定要删除这个{itemName}吗？此操作无法撤销。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting}>取消</AlertDialogCancel>
          <Button disabled={submitting} onClick={onConfirm}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                删除中…
              </>
            ) : (
              "确认删除"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

const CharacterList = memo(function CharacterList({
  characters,
  searchQuery,
  selectedIds,
  isBatchMode,
  onEdit,
  onDelete,
  onToggleLock,
  onToggleSelect,
}: {
  characters: AssetCharacter[]
  searchQuery: string
  selectedIds: Set<string>
  isBatchMode: boolean
  onEdit: (c: AssetCharacter) => void
  onDelete: (id: string) => void
  onToggleLock: (id: string, locked: boolean) => void
  onToggleSelect: (id: string) => void
}) {
  const { generatingAssets } = useAssetStore()
  const normalizeGender = (gender: string | null | undefined): "male" | "female" | "other" | null => {
    if (!gender) return null
    const value = gender.trim().toLowerCase()
    if (["male", "man", "m", "男", "男性"].includes(value)) return "male"
    if (["female", "woman", "f", "女", "女性"].includes(value)) return "female"
    if (["other", "others", "其他", "未知", "unknown"].includes(value)) return "other"
    return null
  }

  const genderLabel = (gender: string | null | undefined) => {
    const normalized = normalizeGender(gender)
    if (normalized === "male") return "男"
    if (normalized === "female") return "女"
    if (normalized === "other") return "其他"
    return gender
  }

  const filtered = useMemo(
    () =>
      characters.filter(
        (c) =>
          !searchQuery ||
          c.name.includes(searchQuery) ||
          c.prompt?.includes(searchQuery) ||
          c.role.includes(searchQuery)
      ),
    [characters, searchQuery]
  )

  const roleLabel = (role: string) => {
    switch (role) {
      case "protagonist": return "主角"
      case "supporting": return "配角"
      case "extra": return "群演"
      default: return role
    }
  }

  const roleBadgeVariant = (role: string) => {
    switch (role) {
      case "protagonist": return "default" as const
      case "supporting": return "secondary" as const
      default: return "outline" as const
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
      {filtered.map((char) => (
        <Card
          key={char.id}
          className="group relative cursor-pointer"
          onClick={() => onEdit(char)}
        >
          <CardContent className="pt-4">
            {isBatchMode && (
              <div className="absolute top-2 left-2 z-10">
                <Checkbox
                  checked={selectedIds.has(char.id)}
                  onCheckedChange={() => onToggleSelect(char.id)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
            <div className="flex items-start gap-3">
              <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center shrink-0" onClick={(e) => e.stopPropagation()}>
                {generatingAssets[char.id] ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/50" />
                ) : char.imageUrl ? (
                  <PreviewableImage
                    src={char.imageUrl}
                    alt={char.name}
                    className="h-14 w-14 rounded-lg object-cover cursor-zoom-in"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <Users className="h-6 w-6 text-muted-foreground/50" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{char.name}</span>
                  <Badge variant={roleBadgeVariant(char.role)} className="text-[10px] px-1.5 py-0 shrink-0">
                    {roleLabel(char.role)}
                  </Badge>
                </div>
                {char.gender && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {genderLabel(char.gender)}
                  </p>
                )}
                {char.prompt && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {char.prompt}
                  </p>
                )}
              </div>
            </div>
            <div className="absolute top-2 right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleLock(char.id, !char.locked)
                }}
              >
                {char.locked ? <Lock className="size-3" /> : <Unlock className="size-3" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(char.id)
                }}
              >
                <Trash2 className="size-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
})

const SceneList = memo(function SceneList({
  scenes,
  searchQuery,
  selectedIds,
  isBatchMode,
  onEdit,
  onDelete,
  onToggleSelect,
}: {
  scenes: AssetScene[]
  searchQuery: string
  selectedIds: Set<string>
  isBatchMode: boolean
  onEdit: (s: AssetScene) => void
  onDelete: (id: string) => void
  onToggleSelect: (id: string) => void
}) {
  const { generatingAssets } = useAssetStore()
  const filtered = useMemo(
    () =>
      scenes.filter(
        (s) =>
          !searchQuery ||
          s.name.includes(searchQuery) ||
          s.prompt?.includes(searchQuery)
      ),
    [scenes, searchQuery]
  )

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
      {filtered.map((scene) => (
        <Card
          key={scene.id}
          className="group relative cursor-pointer"
          onClick={() => onEdit(scene)}
        >
          <CardContent className="pt-4">
            {isBatchMode && (
              <div className="absolute top-2 left-2 z-10">
                <Checkbox
                  checked={selectedIds.has(scene.id)}
                  onCheckedChange={() => onToggleSelect(scene.id)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
            <div className="h-24 rounded-lg bg-muted flex items-center justify-center mb-3" onClick={(e) => e.stopPropagation()}>
              {generatingAssets[scene.id] ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/50" />
              ) : scene.imageUrl ? (
                <PreviewableImage
                  src={scene.imageUrl}
                  alt={scene.name}
                  className="h-24 w-full rounded-lg object-cover cursor-zoom-in"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
              )}
            </div>
            <span className="text-sm font-medium">{scene.name}</span>
            {scene.prompt && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {scene.prompt}
              </p>
            )}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {scene.tags?.split(",").map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px]">
                  {tag.trim()}
                </Badge>
              ))}
            </div>
            <div className="absolute top-2 right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(scene.id)
                }}
              >
                <Trash2 className="size-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
})

const PropList = memo(function PropList({
  props,
  searchQuery,
  selectedIds,
  isBatchMode,
  onEdit,
  onDelete,
  onToggleSelect,
}: {
  props: AssetProp[]
  searchQuery: string
  selectedIds: Set<string>
  isBatchMode: boolean
  onEdit: (p: AssetProp) => void
  onDelete: (id: string) => void
  onToggleSelect: (id: string) => void
}) {
  const { generatingAssets } = useAssetStore()
  const filtered = useMemo(
    () =>
      props.filter(
        (p) =>
          !searchQuery ||
          p.name.includes(searchQuery) ||
          p.prompt?.includes(searchQuery)
      ),
    [props, searchQuery]
  )

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
      {filtered.map((prop) => (
        <Card
          key={prop.id}
          className="group relative cursor-pointer"
          onClick={() => onEdit(prop)}
        >
          <CardContent className="pt-4">
            {isBatchMode && (
              <div className="absolute top-2 left-2 z-10">
                <Checkbox
                  checked={selectedIds.has(prop.id)}
                  onCheckedChange={() => onToggleSelect(prop.id)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0" onClick={(e) => e.stopPropagation()}>
                {generatingAssets[prop.id] ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/50" />
                ) : prop.imageUrl ? (
                  <PreviewableImage
                    src={prop.imageUrl}
                    alt={prop.name}
                    className="h-12 w-12 rounded-lg object-cover cursor-zoom-in"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <Box className="h-5 w-5 text-muted-foreground/50" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{prop.name}</span>
                </div>
                {prop.prompt && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {prop.prompt}
                  </p>
                )}
              </div>
            </div>
            <div className="absolute top-2 right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(prop.id)
                }}
              >
                <Trash2 className="size-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
})

// ── Form Dialogs (extracted to @/components/asset-form-dialogs) ──
