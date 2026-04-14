"use client"

import { memo, useState, useMemo, useEffect, useCallback, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Loader2,
  Sparkles,
  User,
  MapPin,
  Package,
  AlertTriangle,
  Check,
  X,
  Pencil,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import { apiFetch } from "@/lib/api-client"
import { cn } from "@/lib/utils"

interface ExtractAssetsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  episodeId: string
  onSuccess?: (stats: { characterCount: number; sceneCount: number; propCount: number }) => void | Promise<void>
}

// ── 提取结果中每个资产的状态 ──
type AssetAction = "save" | "skip" | "rename" | "keep"

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

interface AssetItemState<T> {
  data: T
  conflict: boolean
  action: AssetAction
  newName: string
  editingName: boolean
}

const ROLE_LABEL: Record<string, string> = {
  protagonist: "主角",
  supporting: "配角",
  extra: "路人",
}

const ACTION_LABEL: Record<AssetAction, string> = {
  save: "覆盖保存",
  keep: "使用已有资产",
  skip: "跳过",
  rename: "改名保存",
}

function useAssetItemStates<T extends { name: string }>(
  items: T[],
  existingNames: string[]
): [AssetItemState<T>[], (index: number, patch: Partial<AssetItemState<T>>) => void] {
  const [states, setStates] = useState<AssetItemState<T>[]>([])

  // 使用内容签名替代引用比较，防止上游数组引用不稳定导致状态被反复重置
  const itemsKey = useMemo(() => items.map((i) => i.name).join("\x00"), [items])
  const namesKey = useMemo(() => existingNames.join("\x00"), [existingNames])

  useEffect(() => {
    setStates(
      items.map((item) => ({
        data: item,
        conflict: existingNames.includes(item.name),
        action: existingNames.includes(item.name) ? "keep" : "save",
        newName: item.name,
        editingName: false,
      }))
    )
  }, [itemsKey, namesKey, items, existingNames])

  const update = (index: number, patch: Partial<AssetItemState<T>>) => {
    setStates((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)))
  }

  return [states, update]
}

function buildSavePayload<T extends { name: string }>(states: AssetItemState<T>[]) {
  return states
    .filter((s) => s.action !== "skip")
    .map((s) => ({
      ...s.data,
      name: s.action === "rename" ? s.newName : s.data.name,
      strategy: s.action,
    }))
}

// ── 单个资产行组件 ──
const AssetRow = memo(function AssetRow<T extends { name: string; prompt?: string }>({
  state,
  onUpdate,
  existingNames,
  extra,
}: {
  state: AssetItemState<T>
  onUpdate: (patch: Partial<AssetItemState<T>>) => void
  /** 同类型已入库名称，用于改名后重新校验是否仍冲突 */
  existingNames: string[]
  extra?: React.ReactNode
}) {
  const { data, conflict, action, newName, editingName } = state

  const finishRename = () => {
    const trimmed = newName.trim()
    onUpdate({
      editingName: false,
      action: "rename",
      newName: trimmed,
      conflict: existingNames.includes(trimmed),
    })
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 rounded-lg border px-3 py-2.5 text-sm transition-colors",
        action === "skip"
          ? "border-border/40 bg-muted/20 opacity-60"
          : conflict
          ? "border-amber-300/60 bg-amber-50/30 dark:bg-amber-950/10"
          : "border-border/60 bg-background"
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        {/* 冲突标记 */}
        {conflict && action !== "skip" && (
          <AlertTriangle className="size-3.5 shrink-0 text-amber-500" />
        )}

        {/* 名称 / 重命名输入框 */}
        {editingName ? (
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <Input
              className="h-6 text-xs px-1.5 py-0 flex-1"
              value={newName}
              autoFocus
              onChange={(e) => onUpdate({ newName: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter") finishRename()
                if (e.key === "Escape") onUpdate({ editingName: false, newName: data.name })
              }}
            />
            <button
              className="text-primary hover:opacity-70 p-0.5"
              onClick={finishRename}
            >
              <Check className="size-3.5" />
            </button>
            <button
              className="text-muted-foreground hover:opacity-70 p-0.5"
              onClick={() => onUpdate({ editingName: false, newName: data.name })}
            >
              <X className="size-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <span className={cn("font-medium truncate", action === "skip" && "line-through text-muted-foreground")}>
              {action === "rename" ? newName : data.name}
            </span>
            {action === "rename" && newName !== data.name && (
              <span className="text-xs text-muted-foreground truncate">（原名：{data.name}）</span>
            )}
            {extra}
          </div>
        )}

        {/* 操作按钮组 */}
        {!editingName && (
          <div className="flex items-center gap-1 shrink-0 ml-auto">
            {action === "skip" ? (
              <button
                className="text-xs text-primary hover:underline"
                onClick={() => onUpdate({ action: conflict ? "keep" : "save" })}
              >
                恢复
              </button>
            ) : (
              <>
                {conflict && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="text-[10px] px-1.5 py-0.5 rounded bg-muted hover:bg-muted/80 transition-colors">
                        {ACTION_LABEL[action]}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-24">
                      <DropdownMenuItem onClick={() => onUpdate({ action: "keep" })}>
                        {action === "keep" && <Check className="size-3.5 mr-1" />}
                        使用已有资产
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onUpdate({ action: "save" })}>
                        {action === "save" && <Check className="size-3.5 mr-1" />}
                        覆盖保存
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onUpdate({ action: "rename", editingName: true })}>
                        {action === "rename" && <Check className="size-3.5 mr-1" />}
                        改名保存
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <button
                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  title="改名保存"
                  onClick={() => onUpdate({ editingName: true })}
                >
                  <Pencil className="size-3" />
                </button>
                <button
                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  title="跳过此资产"
                  onClick={() => onUpdate({ action: "skip" })}
                >
                  <X className="size-3" />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* 提示词 */}
      {data.prompt && action !== "skip" && (
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 pl-0.5">
          {data.prompt}
        </p>
      )}
    </div>
  )
}) as <T extends { name: string; prompt?: string }>(props: {
  state: AssetItemState<T>
  onUpdate: (patch: Partial<AssetItemState<T>>) => void
  existingNames: string[]
  extra?: React.ReactNode
}) => React.JSX.Element

// ── 资产分组折叠区块 ──
const AssetGroup = memo(function AssetGroup({
  icon,
  label,
  count,
  conflictCount,
  skipCount,
  children,
}: {
  icon: React.ReactNode
  label: string
  count: number
  conflictCount: number
  skipCount: number
  children: React.ReactNode
}) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="flex flex-col gap-1">
      <button
        className="flex items-center gap-2 py-1 px-1 rounded-md hover:bg-muted/50 transition-colors text-left w-full"
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? <ChevronDown className="size-3.5 text-muted-foreground" /> : <ChevronRight className="size-3.5 text-muted-foreground" />}
        <span className="text-muted-foreground">{icon}</span>
        <span className="font-medium text-sm">{label}</span>
        <Badge variant="secondary" className="text-[10px] h-4 px-1.5 py-0">{count}</Badge>
        {conflictCount > 0 && (
          <Badge className="text-[10px] h-4 px-1.5 py-0 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0">
            {conflictCount} 冲突
          </Badge>
        )}
        {skipCount > 0 && (
          <Badge variant="outline" className="text-[10px] h-4 px-1.5 py-0 text-muted-foreground">
            {skipCount} 跳过
          </Badge>
        )}
      </button>
      {expanded && (
        <div className="flex flex-col gap-1.5 pl-2">
          {children}
        </div>
      )}
    </div>
  )
})

export function ExtractAssetsDialog({
  open,
  onOpenChange,
  projectId,
  episodeId,
  onSuccess,
}: ExtractAssetsDialogProps) {
  // ── 步骤：extracting → review ──
  const [step, setStep] = useState<"extracting" | "review">("extracting")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // 提取结果
  const [extractedCharacters, setExtractedCharacters] = useState<ExtractedCharacter[]>([])
  const [extractedScenes, setExtractedScenes] = useState<ExtractedScene[]>([])
  const [extractedProps, setExtractedProps] = useState<ExtractedProp[]>([])
  const [existingNames, setExistingNames] = useState<{ characters: string[]; scenes: string[]; props: string[] }>({
    characters: [],
    scenes: [],
    props: [],
  })

  // 各类型资产状态
  const [charStates, updateChar] = useAssetItemStates(extractedCharacters, existingNames.characters)
  const [sceneStates, updateScene] = useAssetItemStates(extractedScenes, existingNames.scenes)
  const [propStates, updateProp] = useAssetItemStates(extractedProps, existingNames.props)

  const extractLockRef = useRef(false)

  const runExtract = useCallback(async () => {
    if (extractLockRef.current) return
    extractLockRef.current = true
    setStep("extracting")
    setError(null)
    try {
      const data = await apiFetch<{
        characters: ExtractedCharacter[]
        scenes: ExtractedScene[]
        props: ExtractedProp[]
        existingNames: { characters: string[]; scenes: string[]; props: string[] }
      }>("/api/episodes/extract-assets", {
        method: "POST",
        body: { episodeIds: [episodeId] },
      })
      setExtractedCharacters(data.characters ?? [])
      setExtractedScenes(data.scenes ?? [])
      setExtractedProps(data.props ?? [])
      setExistingNames(data.existingNames ?? { characters: [], scenes: [], props: [] })
      setStep("review")
    } catch (err) {
      setError(err instanceof Error ? err.message : "请求失败")
      setStep("review")
    } finally {
      extractLockRef.current = false
    }
  }, [episodeId])

  useEffect(() => {
    if (!open) {
      extractLockRef.current = false
      setStep("extracting")
      setError(null)
      setExtractedCharacters([])
      setExtractedScenes([])
      setExtractedProps([])
      setExistingNames({ characters: [], scenes: [], props: [] })
      return
    }
    void runExtract()
  }, [open, runExtract])

  // 统计（单次遍历，减少渲染时重复 filter）
  const stats = useMemo(() => {
    const countGroup = <T,>(states: AssetItemState<T>[]) => {
      let save = 0
      let conflict = 0
      let skip = 0

      for (const state of states) {
        if (state.action === "skip") {
          skip++
          continue
        }

        save++
        if (state.conflict) conflict++
      }

      return { save, conflict, skip, total: states.length }
    }

    const characters = countGroup(charStates)
    const scenes = countGroup(sceneStates)
    const props = countGroup(propStates)

    return {
      characters,
      scenes,
      props,
      saveCount: characters.save + scenes.save + props.save,
      conflictCount: characters.conflict + scenes.conflict + props.conflict,
      totalCount: characters.total + scenes.total + props.total,
    }
  }, [charStates, sceneStates, propStates])

  const handleSave = async () => {
    setSaving(true)
    try {
      const result = await apiFetch<{ stats: { characterCount: number; sceneCount: number; propCount: number } }>(
        "/api/assets/batch-save",
        {
          method: "POST",
          body: {
            projectId,
            episodeId,
            characters: buildSavePayload(charStates),
            scenes: buildSavePayload(sceneStates),
            props: buildSavePayload(propStates),
          },
        }
      )
      await onSuccess?.(result.stats)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "请求失败")
    } finally {
      setSaving(false)
    }
  }

  const isExtracting = step === "extracting"

  return (
    <Dialog open={open} onOpenChange={isExtracting || saving ? undefined : onOpenChange}>
      <DialogContent className={cn("transition-all duration-200", step === "review" ? "sm:max-w-lg" : "sm:max-w-md")}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            {step === "review" ? "确认提取的资产" : "提取资产"}
          </DialogTitle>
          <p className="text-sm text-muted-foreground font-normal pt-1">
            {step === "review"
              ? "以下是 AI 提取的资产，请确认保存哪些。名称冲突的资产会单独标注，默认使用已有资产。"
              : "AI 正在自动从当前分集原文中提取角色、场景和道具资产，请稍候"}
          </p>
        </DialogHeader>

        {/* ── 步骤 1：提取中 ── */}
        {isExtracting && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="size-8 animate-spin text-primary" />
            <div className="text-center">
              <p className="text-sm font-medium">AI 正在分析原文内容...</p>
              <p className="text-xs text-muted-foreground mt-1">正在提取角色、场景和道具，请稍候</p>
            </div>
          </div>
        )}

        {/* ── 步骤 2：确认资产 ── */}
        {step === "review" && (
          <>
            {error && (
              <p className="text-xs text-destructive bg-destructive/5 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            {!error && stats.conflictCount > 0 && (
              <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 px-3 py-2.5 text-xs text-amber-700 dark:text-amber-400">
                <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
                <span>
                  有 <strong>{stats.conflictCount}</strong> 个资产名称已存在。默认<strong>使用已有资产</strong>并绑定到本集；你也可以选择覆盖保存、改名保存，或点击 × 跳过。
                </span>
              </div>
            )}

            <ScrollArea className="max-h-[380px] pr-1">
              <div className="flex flex-col gap-4">
                {charStates.length > 0 && (
                  <AssetGroup
                    icon={<User className="size-3.5" />}
                    label="角色"
                    count={stats.characters.total}
                    conflictCount={stats.characters.conflict}
                    skipCount={stats.characters.skip}
                  >
                    {charStates.map((state, i) => (
                      <AssetRow
                        key={i}
                        state={state}
                        onUpdate={(patch) => updateChar(i, patch)}
                        existingNames={existingNames.characters}
                        extra={
                          <div className="flex items-center gap-1 shrink-0">
                            <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5">
                              {ROLE_LABEL[state.data.role] ?? state.data.role}
                            </Badge>
                            {state.data.gender && (
                              <span className="text-[10px] text-muted-foreground">{state.data.gender}</span>
                            )}
                          </div>
                        }
                      />
                    ))}
                  </AssetGroup>
                )}

                {sceneStates.length > 0 && (
                  <AssetGroup
                    icon={<MapPin className="size-3.5" />}
                    label="场景"
                    count={stats.scenes.total}
                    conflictCount={stats.scenes.conflict}
                    skipCount={stats.scenes.skip}
                  >
                    {sceneStates.map((state, i) => (
                      <AssetRow
                        key={i}
                        state={state}
                        onUpdate={(patch) => updateScene(i, patch)}
                        existingNames={existingNames.scenes}
                        extra={
                          state.data.tags ? (
                            <span className="text-[10px] text-muted-foreground shrink-0">{state.data.tags}</span>
                          ) : undefined
                        }
                      />
                    ))}
                  </AssetGroup>
                )}

                {propStates.length > 0 && (
                  <AssetGroup
                    icon={<Package className="size-3.5" />}
                    label="道具"
                    count={stats.props.total}
                    conflictCount={stats.props.conflict}
                    skipCount={stats.props.skip}
                  >
                    {propStates.map((state, i) => (
                      <AssetRow
                        key={i}
                        state={state}
                        onUpdate={(patch) => updateProp(i, patch)}
                        existingNames={existingNames.props}
                      />
                    ))}
                  </AssetGroup>
                )}
              </div>
            </ScrollArea>

            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
              <span>共 {stats.totalCount} 个资产</span>
              <span>将保存/绑定 <strong className="text-foreground">{stats.saveCount}</strong> 个</span>
            </div>
          </>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExtracting || saving}
          >
            取消
          </Button>

          {step === "review" && (
            <Button
              onClick={() => void handleSave()}
              disabled={stats.saveCount === 0 || saving}
            >
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  保存中...
                </>
              ) : (
                `保存关联 ${stats.saveCount} 个资产`
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
