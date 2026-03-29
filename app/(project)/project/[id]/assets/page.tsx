"use client"

import { memo, useCallback, useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import {
  FolderOpen,
  Users,
  MapPin,
  Box,
  Plus,
  Search,
  Loader2,
  Sparkles,
  Pencil,
  Trash2,
  Lock,
  Unlock,
  ImageIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useAssetStore } from "@/store/asset-store"
import { useNovelStore } from "@/store/novel-store"
import { ExtractAssetsDialog } from "../import/components/extract-assets-dialog"
import type {
  AssetCharacter,
  AssetScene,
  AssetProp,
  AssetCharacterInput,
  AssetSceneInput,
  AssetPropInput,
} from "@/lib/types"

type AssetTab = "characters" | "scenes" | "props"

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
    addScene,
    updateScene,
    deleteScene,
    addProp,
    updateProp,
    deleteProp,
  } = useAssetStore()
  const { novel, chapters, fetchNovel } = useNovelStore()

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
  const [showExtractDialog, setShowExtractDialog] = useState(false)
  const [extractSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await Promise.all([fetchAssets(projectId), fetchNovel(projectId)])
      setLoading(false)
    }
    init()
  }, [projectId, fetchAssets, fetchNovel])

  const handleExtractSuccess = useCallback(
    async () => {
      await fetchAssets(projectId)
    },
    [projectId, fetchAssets]
  )
  const handleToggleCharacterLock = useCallback(
    (id: string, locked: boolean) => {
      void updateCharacter(id, { locked })
    },
    [updateCharacter]
  )

  const totalAssets = characters.length + scenes.length + props.length

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
              项目全局共享的角色、场景与道具库，剧本与分镜等环节均可引用；支持从大纲 AI 提取与手动维护
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            size="sm"
            onClick={() => setShowExtractDialog(true)}
            disabled={!novel || chapters.length === 0}
          >
            <Sparkles className="size-4" />
            AI 提取资产
          </Button>
        </div>
      </div>

      {extractSuccessMsg && (
        <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
          <p className="text-xs text-primary">{extractSuccessMsg}</p>
        </div>
      )}



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
            onEdit={setEditingCharacter}
            onDelete={setDeletingCharacterId}
            onToggleLock={handleToggleCharacterLock}
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
            onEdit={setEditingScene}
            onDelete={setDeletingSceneId}
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
            onEdit={setEditingProp}
            onDelete={setDeletingPropId}
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
      <AlertDialog
        open={!!deletingCharacterId}
        onOpenChange={(open) => {
          if (!open && !deleteSubmitting) setDeletingCharacterId(null)
        }}
      >
        <AlertDialogContent className="sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>删除角色</AlertDialogTitle>
            <AlertDialogDescription className="text-left">
              确定要删除这个角色吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteSubmitting}>取消</AlertDialogCancel>
            <Button
              disabled={deleteSubmitting}
              onClick={async () => {
                if (!deletingCharacterId || deleteSubmitting) return
                setDeleteSubmitting(true)
                try {
                  await deleteCharacter(deletingCharacterId)
                  setDeletingCharacterId(null)
                } finally {
                  setDeleteSubmitting(false)
                }
              }}
            >
              {deleteSubmitting ? (
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

      <AlertDialog
        open={!!deletingSceneId}
        onOpenChange={(open) => {
          if (!open && !deleteSubmitting) setDeletingSceneId(null)
        }}
      >
        <AlertDialogContent className="sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>删除场景</AlertDialogTitle>
            <AlertDialogDescription className="text-left">
              确定要删除这个场景吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteSubmitting}>取消</AlertDialogCancel>
            <Button
              disabled={deleteSubmitting}
              onClick={async () => {
                if (!deletingSceneId || deleteSubmitting) return
                setDeleteSubmitting(true)
                try {
                  await deleteScene(deletingSceneId)
                  setDeletingSceneId(null)
                } finally {
                  setDeleteSubmitting(false)
                }
              }}
            >
              {deleteSubmitting ? (
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

      <AlertDialog
        open={!!deletingPropId}
        onOpenChange={(open) => {
          if (!open && !deleteSubmitting) setDeletingPropId(null)
        }}
      >
        <AlertDialogContent className="sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>删除道具</AlertDialogTitle>
            <AlertDialogDescription className="text-left">
              确定要删除这个道具吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteSubmitting}>取消</AlertDialogCancel>
            <Button
              disabled={deleteSubmitting}
              onClick={async () => {
                if (!deletingPropId || deleteSubmitting) return
                setDeleteSubmitting(true)
                try {
                  await deleteProp(deletingPropId)
                  setDeletingPropId(null)
                } finally {
                  setDeleteSubmitting(false)
                }
              }}
            >
              {deleteSubmitting ? (
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

      {novel && (
        <ExtractAssetsDialog
          open={showExtractDialog}
          onOpenChange={setShowExtractDialog}
          projectId={projectId}
          novelId={novel.id}
          chapters={chapters}
          onSuccess={() => void handleExtractSuccess()}
        />
      )}
    </div>
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

const CharacterList = memo(function CharacterList({
  characters,
  searchQuery,
  onEdit,
  onDelete,
  onToggleLock,
}: {
  characters: AssetCharacter[]
  searchQuery: string
  onEdit: (c: AssetCharacter) => void
  onDelete: (id: string) => void
  onToggleLock: (id: string, locked: boolean) => void
}) {
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
        <Card key={char.id} className="group relative">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center shrink-0">
                {char.imageUrl ? (
                  <img src={char.imageUrl} alt={char.name} className="h-14 w-14 rounded-lg object-cover" />
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
                onClick={() => onToggleLock(char.id, !char.locked)}
              >
                {char.locked ? <Lock className="size-3" /> : <Unlock className="size-3" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onEdit(char)}
              >
                <Pencil className="size-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onDelete(char.id)}
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
  onEdit,
  onDelete,
}: {
  scenes: AssetScene[]
  searchQuery: string
  onEdit: (s: AssetScene) => void
  onDelete: (id: string) => void
}) {
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
        <Card key={scene.id} className="group relative">
          <CardContent className="pt-4">
            <div className="h-24 rounded-lg bg-muted flex items-center justify-center mb-3">
              {scene.imageUrl ? (
                <img src={scene.imageUrl} alt={scene.name} className="h-24 w-full rounded-lg object-cover" />
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
                onClick={() => onEdit(scene)}
              >
                <Pencil className="size-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onDelete(scene.id)}
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
  onEdit,
  onDelete,
}: {
  props: AssetProp[]
  searchQuery: string
  onEdit: (p: AssetProp) => void
  onDelete: (id: string) => void
}) {
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
        <Card key={prop.id} className="group relative">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                {prop.imageUrl ? (
                  <img src={prop.imageUrl} alt={prop.name} className="h-12 w-12 rounded-lg object-cover" />
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
                onClick={() => onEdit(prop)}
              >
                <Pencil className="size-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onDelete(prop.id)}
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

// ── Form Dialogs ──

function CharacterFormDialog({
  open,
  onOpenChange,
  character,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  character: AssetCharacter | null
  onSave: (data: AssetCharacterInput) => Promise<void>
}) {
  const normalizeGender = (gender: string | null | undefined): "male" | "female" | "other" | "" => {
    if (!gender) return ""
    const value = gender.trim().toLowerCase()
    if (["male", "man", "m", "男", "男性"].includes(value)) return "male"
    if (["female", "woman", "f", "女", "女性"].includes(value)) return "female"
    if (["other", "others", "其他", "未知", "unknown"].includes(value)) return "other"
    return ""
  }

  const [name, setName] = useState("")
  const [role, setRole] = useState<"protagonist" | "supporting" | "extra">("supporting")
  const [gender, setGender] = useState("")
  const [prompt, setPrompt] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (character) {
      setName(character.name)
      setRole(character.role as "protagonist" | "supporting" | "extra")
      setGender(normalizeGender(character.gender))
      setPrompt(character.prompt || "")
    } else {
      setName("")
      setRole("supporting")
      setGender("")
      setPrompt("")
    }
    setError("")
  }, [character, open])

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    setError("")
    try {
      await onSave({
        name: name.trim(),
        role,
        gender: gender || undefined,
        prompt: prompt || undefined,
      })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{character ? "编辑角色" : "添加角色"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>角色名 *</Label>
              <Input value={name} onChange={(e) => { setName(e.target.value); setError("") }} placeholder="角色名称" />
            </div>
            <div className="grid gap-2">
              <Label>角色类型</Label>
              <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="protagonist">主角</SelectItem>
                  <SelectItem value="supporting">配角</SelectItem>
                  <SelectItem value="extra">群演</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>性别</Label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger><SelectValue placeholder="选择性别" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">男</SelectItem>
                <SelectItem value="female">女</SelectItem>
                <SelectItem value="other">其他</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>提示词</Label>
            <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="角色简介（可包含外貌特征、身份背景等）" rows={4} />
          </div>
        </div>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={handleSave} disabled={!name.trim() || saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function SceneFormDialog({
  open,
  onOpenChange,
  scene,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  scene: AssetScene | null
  onSave: (data: AssetSceneInput) => Promise<void>
}) {
  const [name, setName] = useState("")
  const [prompt, setPrompt] = useState("")
  const [tags, setTags] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (scene) {
      setName(scene.name)
      setPrompt(scene.prompt || "")
      setTags(scene.tags || "")
    } else {
      setName("")
      setPrompt("")
      setTags("")
    }
    setError("")
  }, [scene, open])

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    setError("")
    try {
      await onSave({
        name: name.trim(),
        prompt: prompt || undefined,
        tags: tags || undefined,
      })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{scene ? "编辑场景" : "添加场景"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-1">
          <div className="grid gap-2">
            <Label>场景名称 *</Label>
            <Input value={name} onChange={(e) => { setName(e.target.value); setError("") }} placeholder="如 总裁办公室" />
          </div>
          <div className="grid gap-2">
            <Label>提示词</Label>
            <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="场景生图提示词" rows={3} />
          </div>
          <div className="grid gap-2">
            <Label>标签</Label>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="用逗号分隔，如 室内,现代,豪华" />
          </div>
        </div>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={handleSave} disabled={!name.trim() || saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PropFormDialog({
  open,
  onOpenChange,
  prop,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  prop: AssetProp | null
  onSave: (data: AssetPropInput) => Promise<void>
}) {
  const [name, setName] = useState("")
  const [prompt, setPrompt] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (prop) {
      setName(prop.name)
      setPrompt(prop.prompt || "")
    } else {
      setName("")
      setPrompt("")
    }
    setError("")
  }, [prop, open])

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    setError("")
    try {
      await onSave({
        name: name.trim(),
        prompt: prompt || undefined,
      })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{prop ? "编辑道具" : "添加道具"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-1">
          <div className="grid gap-2">
            <Label>道具名称 *</Label>
            <Input value={name} onChange={(e) => { setName(e.target.value); setError("") }} placeholder="如 合同文件" />
          </div>
          <div className="grid gap-2">
            <Label>提示词</Label>
            <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="道具生图提示词" rows={3} />
          </div>
        </div>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={handleSave} disabled={!name.trim() || saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
