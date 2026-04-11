"use client"

import React, { useEffect, useState } from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Upload, Sparkles } from "lucide-react"
import { apiFetch, ApiError } from "@/lib/api-client"
import { useAssetStore } from "@/store/asset-store"
import type {
  AssetCharacter,
  AssetScene,
  AssetProp,
  AssetCharacterInput,
  AssetSceneInput,
  AssetPropInput,
} from "@/lib/types"

// ── ImagePreviewUploader ──

export function ImagePreviewUploader({
  imageUrl,
  onChange,
  title,
  secondAction,
  isGenerating,
}: {
  imageUrl: string
  onChange: (value: string) => void
  title: string
  secondAction?: React.ReactNode
  isGenerating?: boolean
}) {
  const [readingFile, setReadingFile] = useState(false)

  const handleFileChange = async (file: File | undefined) => {
    if (!file) return
    setReadingFile(true)
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "")
        reader.onerror = () => reject(new Error("读取图片失败，请重试"))
        reader.readAsDataURL(file)
      })
      if (!dataUrl) throw new Error("读取图片失败，请重试")
      onChange(dataUrl)
    } finally {
      setReadingFile(false)
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={`${title}-upload`} className="block cursor-pointer">
        <div className="group relative aspect-square rounded-lg border bg-muted/30 overflow-hidden flex items-center justify-center">
          {isGenerating ? (
            <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
              <Loader2 className="size-6 animate-spin" />
              <span className="text-xs">生成中...</span>
            </div>
          ) : imageUrl ? (
            <>
              <img
                src={imageUrl}
                alt={title}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                {readingFile ? (
                  <Loader2 className="size-5 text-white animate-spin" />
                ) : (
                  <>
                    <Upload className="size-5 text-white" />
                    <span className="text-xs text-white">点击更换</span>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-1.5 text-muted-foreground group-hover:text-foreground transition-colors">
              {readingFile ? (
                <Loader2 className="size-6 animate-spin" />
              ) : (
                <>
                  <Upload className="size-6" />
                  <span className="text-xs">点击上传</span>
                </>
              )}
            </div>
          )}
        </div>
      </Label>
      <Input
        id={`${title}-upload`}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          void handleFileChange(e.target.files?.[0])
          e.currentTarget.value = ""
        }}
      />
      {secondAction && (
        <div className="w-full [&>button]:w-full">{secondAction}</div>
      )}
    </div>
  )
}

// ── 生成图片按钮（仅编辑模式可用）──

function GenerateImageButton({
  assetType,
  assetId,
  projectId,
  onSuccess,
}: {
  assetType: "character" | "scene" | "prop"
  assetId: string
  projectId: string
  onSuccess?: (imageUrl: string) => void
}) {
  const { setGeneratingAsset, fetchAssets, generatingAssets } = useAssetStore()
  const isGenerating = generatingAssets[assetId]

  const handleGenerate = async () => {
    if (isGenerating) return
    setGeneratingAsset(assetId, true)
    toast.success("已开始生成图片")
    try {
      const res = await apiFetch<{ success: boolean; imageUrl: string }>("/api/assets/generate-images", {
        method: "POST",
        body: { type: assetType, id: assetId },
      })
      if (res.success) {
        await fetchAssets(projectId)
        onSuccess?.(res.imageUrl)
      } else {
        toast.error("图片生成失败")
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "提交失败，请稍后重试")
    } finally {
      setGeneratingAsset(assetId, false)
    }
  }

  return (
    <Button
      type="button"
      size="sm"
      onClick={() => void handleGenerate()}
      disabled={isGenerating}
    >
      {isGenerating ? (
        <Loader2 className="mr-1.5 size-3.5 animate-spin" />
      ) : (
        <Sparkles className="mr-1.5 size-3.5" />
      )}
      生成图片
    </Button>
  )
}

// ── CharacterFormDialog ──

export function CharacterFormDialog({
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
  const normalizeGender = (
    gender: string | null | undefined
  ): "male" | "female" | "other" | "" => {
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
  const [imageUrl, setImageUrl] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (character) {
      setName(character.name)
      setRole(character.role as "protagonist" | "supporting" | "extra")
      setGender(normalizeGender(character.gender))
      setPrompt(character.prompt || "")
      setImageUrl(character.imageUrl || "")
    } else {
      setName("")
      setRole("supporting")
      setGender("")
      setPrompt("")
      setImageUrl("")
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
        imageUrl: imageUrl || undefined,
      })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const { generatingAssets } = useAssetStore()
  const isGenerating = character ? generatingAssets[character.id] : false

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{character ? "编辑角色" : "添加角色"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-1 sm:grid-cols-[160px_minmax(0,1fr)]">
          <ImagePreviewUploader
            imageUrl={imageUrl}
            onChange={setImageUrl}
            title="角色图片"
            isGenerating={isGenerating}
            secondAction={
              character ? (
                <GenerateImageButton assetType="character" assetId={character.id} projectId={character.projectId} onSuccess={setImageUrl} />
              ) : undefined
            }
          />
          <div className="grid gap-3 content-start">
            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">角色名 *</Label>
                <Input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    setError("")
                  }}
                  placeholder="角色名称"
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">角色类型</Label>
                <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="protagonist">主角</SelectItem>
                    <SelectItem value="supporting">配角</SelectItem>
                    <SelectItem value="extra">群演</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">性别</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">男</SelectItem>
                    <SelectItem value="female">女</SelectItem>
                    <SelectItem value="other">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">提示词</Label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="角色简介（可包含外貌特征、身份背景等）"
                rows={5}
              />
            </div>
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={() => void handleSave()} disabled={!name.trim() || saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── SceneFormDialog ──

export function SceneFormDialog({
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
  const [imageUrl, setImageUrl] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (scene) {
      setName(scene.name)
      setPrompt(scene.prompt || "")
      setTags(scene.tags || "")
      setImageUrl(scene.imageUrl || "")
    } else {
      setName("")
      setPrompt("")
      setTags("")
      setImageUrl("")
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
        imageUrl: imageUrl || undefined,
      })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const { generatingAssets } = useAssetStore()
  const isGenerating = scene ? generatingAssets[scene.id] : false

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{scene ? "编辑场景" : "添加场景"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-1 sm:grid-cols-[160px_minmax(0,1fr)]">
          <ImagePreviewUploader
            imageUrl={imageUrl}
            onChange={setImageUrl}
            title="场景图片"
            isGenerating={isGenerating}
            secondAction={
              scene ? (
                <GenerateImageButton assetType="scene" assetId={scene.id} projectId={scene.projectId} onSuccess={setImageUrl} />
              ) : undefined
            }
          />
          <div className="grid gap-3 content-start">
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">场景名称 *</Label>
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setError("")
                }}
                placeholder="如 总裁办公室"
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">提示词</Label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="场景生图提示词"
                rows={4}
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">标签</Label>
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="用逗号分隔，如 室内,现代,豪华"
              />
            </div>
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={() => void handleSave()} disabled={!name.trim() || saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── PropFormDialog ──

export function PropFormDialog({
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
  const [imageUrl, setImageUrl] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (prop) {
      setName(prop.name)
      setPrompt(prop.prompt || "")
      setImageUrl(prop.imageUrl || "")
    } else {
      setName("")
      setPrompt("")
      setImageUrl("")
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
        imageUrl: imageUrl || undefined,
      })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const { generatingAssets } = useAssetStore()
  const isGenerating = prop ? generatingAssets[prop.id] : false

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{prop ? "编辑道具" : "添加道具"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-1 sm:grid-cols-[160px_minmax(0,1fr)]">
          <ImagePreviewUploader
            imageUrl={imageUrl}
            onChange={setImageUrl}
            title="道具图片"
            isGenerating={isGenerating}
            secondAction={
              prop ? (
                <GenerateImageButton assetType="prop" assetId={prop.id} projectId={prop.projectId} onSuccess={setImageUrl} />
              ) : undefined
            }
          />
          <div className="grid gap-3 content-start">
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">道具名称 *</Label>
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setError("")
                }}
                placeholder="如 合同文件"
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">提示词</Label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="道具生图提示词"
                rows={5}
              />
            </div>
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={() => void handleSave()} disabled={!name.trim() || saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
