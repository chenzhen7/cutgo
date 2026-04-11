"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  Star,
  Pencil,
  FlaskConical,
} from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { AI_PROVIDER_OPTIONS_BY_TYPE } from "@/lib/ai/providers"
import { apiFetch, ApiError } from "@/lib/api-client"
import { PreviewableImage } from "@/components/ui/previewable-image"

// ── 类型定义 ──

interface AIModelConfig {
  id: string
  name: string
  type: "llm" | "image" | "video" | "tts"
  provider: string
  model: string
  apiKey: string
  baseUrl: string
  config: Record<string, unknown>
  isDefault: boolean
}

interface Settings {
  activeLLMConfigId: string | null
  activeImageConfigId: string | null
  activeVideoConfigId: string | null
  activeTTSConfigId: string | null
}

// ── 静态数据 ──

const MODEL_TYPE_LABELS: Record<string, string> = {
  llm: "文本大模型",
  image: "图像生成",
  video: "视频生成",
  tts: "语音合成",
}

// ── 空表单初始值 ──
const emptyForm = {
  name: "",
  type: "llm" as AIModelConfig["type"],
  provider: "",
  model: "",
  apiKey: "",
  baseUrl: "",
  isDefault: false,
  config: {} as Record<string, unknown>,
}

// ── 主组件 ──

export default function SettingsPage() {
  const [configs, setConfigs] = useState<AIModelConfig[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [activeTab, setActiveTab] = useState<"llm" | "image" | "video" | "tts">("llm")
  const [loading, setLoading] = useState(true)

  // 对话框状态
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<AIModelConfig | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  // 是否使用自定义模型
  const [useCustomModel, setUseCustomModel] = useState(false)

  // 测试连接状态
  const [testingId, setTestingId] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<Record<string, { ok: boolean; msg: string; imageUrl?: string }>>({})

  // 切换激活中状态
  const [switchingId, setSwitchingId] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [configs, settings] = await Promise.all([
        apiFetch<AIModelConfig[]>("/api/settings/ai-configs").catch(() => null),
        apiFetch<Settings>("/api/settings").catch(() => null),
      ])
      if (configs) setConfigs(configs)
      if (settings) setSettings(settings)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // 当前 tab 下的配置列表
  const tabConfigs = configs.filter((c) => c.type === activeTab)

  // 当前激活的配置 ID
  const activeConfigId = settings
    ? {
      llm: settings.activeLLMConfigId,
      image: settings.activeImageConfigId,
      video: settings.activeVideoConfigId,
      tts: settings.activeTTSConfigId,
    }[activeTab]
    : null

  // 打开新增对话框
  function openAddDialog() {
    setEditingConfig(null)
    setForm({ ...emptyForm, type: activeTab })
    setUseCustomModel(false)
    setDialogOpen(true)
  }

  // 打开编辑对话框
  function openEditDialog(cfg: AIModelConfig) {
    setEditingConfig(cfg)
    setForm({
      name: cfg.name,
      type: cfg.type,
      provider: cfg.provider,
      model: cfg.model,
      apiKey: cfg.apiKey,
      baseUrl: cfg.baseUrl,
      isDefault: cfg.isDefault,
      config: cfg.config || {},
    })

    // 判断是否是自定义模型：如果当前提供商的模型列表中不包含该模型，则认为是自定义
    const providerInfo = AI_PROVIDER_OPTIONS_BY_TYPE[cfg.type]?.[cfg.provider]
    const isKnownModel = providerInfo?.models.some((m) => m.value === cfg.model)
    setUseCustomModel(!isKnownModel)

    setDialogOpen(true)
  }

  // 保存（新增 or 更新）
  async function handleSave() {
    if (!form.name || !form.provider || !form.model) {
      toast.error("请填写配置名称、提供商和模型")
      return
    }
    setSaving(true)
    try {
      const url = editingConfig
        ? `/api/settings/ai-configs/${editingConfig.id}`
        : "/api/settings/ai-configs"
      const method = editingConfig ? "PUT" : "POST"
      await apiFetch(url, { method, body: form })
      toast.success(editingConfig ? "配置已更新" : "配置已添加")
      setDialogOpen(false)
      await fetchAll()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "保存失败")
    } finally {
      setSaving(false)
    }
  }

  // 删除配置
  async function handleDelete(cfg: AIModelConfig) {
    if (!confirm(`确认删除配置「${cfg.name}」？`)) return
    try {
      await apiFetch(`/api/settings/ai-configs/${cfg.id}`, { method: "DELETE" })
      toast.success("已删除")
      await fetchAll()
    } catch {
      toast.error("删除失败")
    }
  }

  // 设为激活（当前使用）
  async function handleSetActive(cfg: AIModelConfig) {
    setSwitchingId(cfg.id)
    try {
      const fieldMap: Record<string, string> = {
        llm: "activeLLMConfigId",
        image: "activeImageConfigId",
        video: "activeVideoConfigId",
        tts: "activeTTSConfigId",
      }
      await apiFetch("/api/settings", {
        method: "PUT",
        body: { [fieldMap[cfg.type]]: cfg.id },
      })
      toast.success(`已切换到「${cfg.name}」`)
      await fetchAll()
    } catch {
      toast.error("切换失败")
    } finally {
      setSwitchingId(null)
    }
  }

  // 测试连接
  async function handleTest(cfg: AIModelConfig) {
    setTestingId(cfg.id)
    setTestResult((prev) => ({ ...prev, [cfg.id]: { ok: false, msg: "测试中..." } }))
    try {
      const data = await apiFetch<{ success: boolean; message: string; imageUrl?: string }>(
        "/api/settings/ai-configs/test",
        {
          method: "POST",
          body: {
            type: cfg.type,
            provider: cfg.provider,
            model: cfg.model,
            apiKey: cfg.apiKey,
            baseUrl: cfg.baseUrl,
          },
        }
      )
      setTestResult((prev) => ({
        ...prev,
        [cfg.id]: { ok: true, msg: data.message, imageUrl: data.imageUrl },
      }))
      toast.success(`「${cfg.name}」连接成功`)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "连接失败"
      setTestResult((prev) => ({ ...prev, [cfg.id]: { ok: false, msg } }))
      toast.error(`「${cfg.name}」${msg}`)
    } finally {
      setTestingId(null)
    }
  }

  // 当提供商变化时，自动填充第一个模型
  function handleProviderChange(provider: string) {
    const providerInfo = AI_PROVIDER_OPTIONS_BY_TYPE[form.type]?.[provider]
    setForm((prev) => ({
      ...prev,
      provider,
      model: providerInfo?.models[0]?.value ?? "",
    }))
    setUseCustomModel(false)
  }

  const currentProviderOptions = AI_PROVIDER_OPTIONS_BY_TYPE[form.type] ?? {}
  const currentModelOptions = currentProviderOptions[form.provider]?.models ?? []

  return (
    <div className="mx-auto w-full space-y-6 p-6 lg:p-8">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">项目设置</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          管理 AI 模型配置，可为每种能力保存多套配置并随时切换
        </p>
      </div>

      <Separator />

      {/* AI 模型配置 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">AI 模型配置</CardTitle>
          <CardDescription>
            为文本生成、图像生成、视频生成、语音合成分别配置 AI 服务。每种类型可保存多套配置，绿色标记为当前使用的配置。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList className="mb-4">
              {(["llm", "image", "video", "tts"] as const).map((t) => (
                <TabsTrigger key={t} value={t}>
                  {MODEL_TYPE_LABELS[t]}
                </TabsTrigger>
              ))}
            </TabsList>

            {(["llm", "image", "video", "tts"] as const).map((tabType) => (
              <TabsContent key={tabType} value={tabType} className="space-y-3">
                {loading ? (
                  <div className="flex items-center gap-2 py-6 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">加载中...</span>
                  </div>
                ) : tabConfigs.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                    暂无配置，点击下方按钮添加
                  </div>
                ) : (
                  tabConfigs.map((cfg) => {
                    const isActive = cfg.id === activeConfigId
                    const result = testResult[cfg.id]
                    const providerInfo = AI_PROVIDER_OPTIONS_BY_TYPE[cfg.type]?.[cfg.provider]
                    const logo = providerInfo?.logo

                    return (
                      <div
                        key={cfg.id}
                        className={`flex items-start justify-between rounded-lg border p-4 transition-colors ${isActive ? "border-green-500 bg-green-50 dark:bg-green-950/20" : ""
                          }`}
                      >
                        <div className="flex min-w-0 flex-1 gap-3">
                          {logo && (
                            <div className="relative mt-1 h-8 w-8 shrink-0 overflow-hidden rounded-md p-1">
                              <Image
                                src={logo}
                                alt={providerInfo?.label || cfg.provider}
                                fill
                                className="object-contain"
                              />
                            </div>
                          )}
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{cfg.name}</span>
                              {isActive && (
                                <Badge variant="default" className="bg-green-600 text-xs">
                                  使用中
                                </Badge>
                              )}
                              {cfg.isDefault && !isActive && (
                                <Badge variant="outline" className="text-xs">
                                  默认
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {providerInfo?.label ?? cfg.provider}
                              {" · "}
                              {cfg.model}
                              {cfg.baseUrl && ` · ${cfg.baseUrl}`}
                            </p>
                            {result && (
                              <p
                                className={`flex items-center gap-1 text-xs ${result.ok ? "text-green-600" : "text-red-500"
                                  }`}
                              >
                                {result.ok ? (
                                  <CheckCircle2 className="h-3 w-3" />
                                ) : (
                                  <XCircle className="h-3 w-3" />
                                )}
                                {result.msg}
                              </p>
                            )}
                            {result?.imageUrl && (
                              <div className="mt-2 h-24 w-24 overflow-hidden rounded border bg-muted shadow-sm">
                                <PreviewableImage
                                  src={result.imageUrl}
                                  alt="Test result"
                                  className="h-full w-full cursor-zoom-in object-cover transition-transform hover:scale-105"
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="ml-3 flex shrink-0 items-center gap-1">
                          {/* 测试连接 */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="测试连接"
                            disabled={testingId === cfg.id}
                            onClick={() => handleTest(cfg)}
                          >
                            {testingId === cfg.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <FlaskConical className="h-4 w-4" />
                            )}
                          </Button>

                          {/* 设为激活 */}
                          {!isActive && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="设为当前使用"
                              disabled={switchingId === cfg.id}
                              onClick={() => handleSetActive(cfg)}
                            >
                              {switchingId === cfg.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Star className="h-4 w-4" />
                              )}
                            </Button>
                          )}

                          {/* 编辑 */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="编辑"
                            onClick={() => openEditDialog(cfg)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>

                          {/* 删除 */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            title="删除"
                            onClick={() => handleDelete(cfg)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })
                )}

                <Button variant="outline" size="sm" onClick={openAddDialog}>
                  <Plus className="mr-1.5 h-4 w-4" />
                  添加{MODEL_TYPE_LABELS[tabType]}配置
                </Button>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* 新增/编辑对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingConfig ? "编辑配置" : "添加模型配置"}</DialogTitle>
            <DialogDescription>
              配置 {MODEL_TYPE_LABELS[form.type]} 的服务商和 API 信息
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* 配置名称 */}
            <div className="space-y-1.5">
              <Label>配置名称</Label>
              <Input
                placeholder="如：我的 DeepSeek"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>

            {/* 提供商 */}
            <div className="space-y-1.5">
              <Label>提供商</Label>
              <Select value={form.provider} onValueChange={handleProviderChange}>
                <SelectTrigger>
                  <SelectValue placeholder="选择提供商" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(currentProviderOptions).map(([key, info]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        {info.logo && (
                          <div className="relative h-4 w-4 shrink-0 overflow-hidden">
                            <Image
                              src={info.logo}
                              alt={info.label}
                              fill
                              className="object-contain"
                            />
                          </div>
                        )}
                        <span>{info.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 模型 */}
            {form.provider && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>模型</Label>
                  {currentModelOptions.length > 0 && (
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs"
                      onClick={() => setUseCustomModel(!useCustomModel)}
                    >
                      {useCustomModel ? "选择已有模型" : "手动输入型号"}
                    </Button>
                  )}
                </div>
                {useCustomModel || currentModelOptions.length === 0 ? (
                  <Input
                    placeholder="请输入模型型号，如：gpt-4o"
                    value={form.model}
                    onChange={(e) => setForm((p) => ({ ...p, model: e.target.value }))}
                  />
                ) : (
                  <Select
                    value={form.model}
                    onValueChange={(v) => setForm((p) => ({ ...p, model: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择模型" />
                    </SelectTrigger>
                    <SelectContent>
                      {currentModelOptions.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {/* API Key */}
            {form.provider !== "edge-tts" && form.provider !== "comfyui" && (
              <div className="space-y-1.5">
                <Label>API Key</Label>
                <Input
                  type="password"
                  placeholder="sk-..."
                  value={form.apiKey}
                  onChange={(e) => setForm((p) => ({ ...p, apiKey: e.target.value }))}
                />
              </div>
            )}

            {/* Base URL */}
            <div className="space-y-1.5">
              <Label>
                {form.provider === "comfyui" ? "ComfyUI 服务地址" : "Base URL"}
                <span className="ml-1 text-xs text-muted-foreground">（可选，留空使用默认地址）</span>
              </Label>
              <Input
                type="url"
                placeholder={
                  currentProviderOptions[form.provider]?.defaultBaseUrl ||
                  "https://api.example.com/v1"
                }
                value={form.baseUrl}
                onChange={(e) => setForm((p) => ({ ...p, baseUrl: e.target.value }))}
              />
            </div>

            {/* 设为默认 */}
            {form.type === "video" && (form.provider === "doubao" || form.provider === "vidu") && (
              <div className="space-y-1.5">
                <Label>视频分辨率</Label>
                <Select
                  value={(form.config?.resolution as string) || "720p"}
                  onValueChange={(v) => setForm((p) => ({ ...p, config: { ...p.config, resolution: v } }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择视频分辨率" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="720p">720p</SelectItem>
                    <SelectItem value="1080p">1080p</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Auth Prefix (for Vidu etc) */}
            {form.provider === "vidu" && (
              <div className="space-y-1.5">
                <Label>
                  Authorization 前缀
                  <span className="ml-1 text-xs text-muted-foreground">（vidu 默认为 Token，可改为 Bearer 等）</span>
                </Label>
                <Input
                  placeholder="Token"
                  value={(form.config?.authPrefix as string) || ""}
                  onChange={(e) => setForm((p) => ({ ...p, config: { ...p.config, authPrefix: e.target.value } }))}
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                id="isDefault"
                type="checkbox"
                className="h-4 w-4 rounded border"
                checked={form.isDefault}
                onChange={(e) => setForm((p) => ({ ...p, isDefault: e.target.checked }))}
              />
              <Label htmlFor="isDefault" className="cursor-pointer font-normal">
                设为该类型的默认配置
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingConfig ? "保存更改" : "添加配置"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
