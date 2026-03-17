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

const PROVIDER_OPTIONS: Record<string, { label: string; models: { value: string; label: string }[]; defaultBaseUrl: string }> = {
  openai: {
    label: "OpenAI",
    models: [
      { value: "gpt-4o", label: "GPT-4o" },
      { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
      { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
    ],
    defaultBaseUrl: "https://api.openai.com/v1",
  },
  deepseek: {
    label: "DeepSeek",
    models: [
      { value: "deepseek-chat", label: "DeepSeek-V3 (deepseek-chat)" },
      { value: "deepseek-reasoner", label: "DeepSeek-R1 (deepseek-reasoner)" },
    ],
    defaultBaseUrl: "https://api.deepseek.com/v1",
  },
  anthropic: {
    label: "Anthropic (Claude)",
    models: [
      { value: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" },
      { value: "claude-3-opus-20240229", label: "Claude 3 Opus" },
    ],
    defaultBaseUrl: "https://api.anthropic.com/v1",
  },
  qwen: {
    label: "阿里通义千问",
    models: [
      { value: "qwen-max", label: "Qwen-Max" },
      { value: "qwen-plus", label: "Qwen-Plus" },
      { value: "qwen-turbo", label: "Qwen-Turbo" },
    ],
    defaultBaseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  },
}

const IMAGE_PROVIDER_OPTIONS: Record<string, { label: string; models: { value: string; label: string }[]; defaultBaseUrl: string }> = {
  openai: {
    label: "OpenAI (DALL-E)",
    models: [{ value: "dall-e-3", label: "DALL-E 3" }],
    defaultBaseUrl: "https://api.openai.com/v1",
  },
  comfyui: {
    label: "ComfyUI (本地)",
    models: [{ value: "comfyui", label: "ComfyUI 工作流" }],
    defaultBaseUrl: "http://127.0.0.1:8188",
  },
  stability: {
    label: "Stability AI (SDXL)",
    models: [{ value: "stable-diffusion-xl-1024-v1-0", label: "SDXL 1.0" }],
    defaultBaseUrl: "https://api.stability.ai/v1",
  },
}

const VIDEO_PROVIDER_OPTIONS: Record<string, { label: string; models: { value: string; label: string }[]; defaultBaseUrl: string }> = {
  runway: {
    label: "Runway",
    models: [{ value: "gen3a_turbo", label: "Gen-3 Alpha Turbo" }],
    defaultBaseUrl: "https://api.dev.runwayml.com/v1",
  },
  kling: {
    label: "快手可灵",
    models: [{ value: "kling-v1", label: "可灵 v1" }],
    defaultBaseUrl: "https://api.klingai.com/v1",
  },
  minimax: {
    label: "MiniMax 海螺",
    models: [{ value: "video-01", label: "海螺视频 01" }],
    defaultBaseUrl: "https://api.minimax.chat/v1",
  },
}

const TTS_PROVIDER_OPTIONS: Record<string, { label: string; models: { value: string; label: string }[]; defaultBaseUrl: string }> = {
  "edge-tts": {
    label: "Microsoft Edge TTS（免费）",
    models: [
      { value: "zh-CN-XiaoxiaoNeural", label: "晓晓（普通话女声）" },
      { value: "zh-CN-YunxiNeural", label: "云希（普通话男声）" },
      { value: "zh-CN-XiaoyiNeural", label: "晓伊（普通话女声）" },
    ],
    defaultBaseUrl: "",
  },
  openai: {
    label: "OpenAI TTS",
    models: [
      { value: "tts-1", label: "TTS-1" },
      { value: "tts-1-hd", label: "TTS-1 HD" },
    ],
    defaultBaseUrl: "https://api.openai.com/v1",
  },
  elevenlabs: {
    label: "ElevenLabs",
    models: [{ value: "eleven_multilingual_v2", label: "Multilingual v2" }],
    defaultBaseUrl: "https://api.elevenlabs.io/v1",
  },
  minimax: {
    label: "MiniMax 语音合成",
    models: [{ value: "speech-01-turbo", label: "Speech-01 Turbo" }],
    defaultBaseUrl: "https://api.minimax.chat/v1",
  },
}

const PROVIDER_OPTIONS_BY_TYPE: Record<string, Record<string, { label: string; models: { value: string; label: string }[]; defaultBaseUrl: string }>> = {
  llm: PROVIDER_OPTIONS,
  image: IMAGE_PROVIDER_OPTIONS,
  video: VIDEO_PROVIDER_OPTIONS,
  tts: TTS_PROVIDER_OPTIONS,
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

  // 测试连接状态
  const [testingId, setTestingId] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<Record<string, { ok: boolean; msg: string }>>({})

  // 切换激活中状态
  const [switchingId, setSwitchingId] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [cfgRes, settingsRes] = await Promise.all([
        fetch("/api/settings/ai-configs"),
        fetch("/api/settings"),
      ])
      if (cfgRes.ok) setConfigs(await cfgRes.json())
      if (settingsRes.ok) setSettings(await settingsRes.json())
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
    })
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

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? "保存失败")
        return
      }

      toast.success(editingConfig ? "配置已更新" : "配置已添加")
      setDialogOpen(false)
      await fetchAll()
    } finally {
      setSaving(false)
    }
  }

  // 删除配置
  async function handleDelete(cfg: AIModelConfig) {
    if (!confirm(`确认删除配置「${cfg.name}」？`)) return
    const res = await fetch(`/api/settings/ai-configs/${cfg.id}`, { method: "DELETE" })
    if (res.ok) {
      toast.success("已删除")
      await fetchAll()
    } else {
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
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [fieldMap[cfg.type]]: cfg.id }),
      })
      if (res.ok) {
        toast.success(`已切换到「${cfg.name}」`)
        await fetchAll()
      } else {
        toast.error("切换失败")
      }
    } finally {
      setSwitchingId(null)
    }
  }

  // 测试连接
  async function handleTest(cfg: AIModelConfig) {
    setTestingId(cfg.id)
    setTestResult((prev) => ({ ...prev, [cfg.id]: { ok: false, msg: "测试中..." } }))
    try {
      const res = await fetch("/api/settings/ai-configs/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: cfg.type,
          provider: cfg.provider,
          model: cfg.model,
          apiKey: cfg.apiKey,
          baseUrl: cfg.baseUrl,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setTestResult((prev) => ({ ...prev, [cfg.id]: { ok: true, msg: data.message } }))
        toast.success(`「${cfg.name}」连接成功`)
      } else {
        setTestResult((prev) => ({
          ...prev,
          [cfg.id]: { ok: false, msg: data.error ?? "连接失败" },
        }))
        toast.error(`「${cfg.name}」${data.error ?? "连接失败"}`)
      }
    } finally {
      setTestingId(null)
    }
  }

  // 当提供商变化时，自动填充 baseUrl 和第一个模型
  function handleProviderChange(provider: string) {
    const providerInfo = PROVIDER_OPTIONS_BY_TYPE[form.type]?.[provider]
    setForm((prev) => ({
      ...prev,
      provider,
      model: providerInfo?.models[0]?.value ?? "",
      baseUrl: providerInfo?.defaultBaseUrl ?? "",
    }))
  }

  const currentProviderOptions = PROVIDER_OPTIONS_BY_TYPE[form.type] ?? {}
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
                    return (
                      <div
                        key={cfg.id}
                        className={`flex items-start justify-between rounded-lg border p-4 transition-colors ${
                          isActive ? "border-green-500 bg-green-50 dark:bg-green-950/20" : ""
                        }`}
                      >
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
                            {PROVIDER_OPTIONS_BY_TYPE[cfg.type]?.[cfg.provider]?.label ?? cfg.provider}
                            {" · "}
                            {cfg.model}
                            {cfg.baseUrl && ` · ${cfg.baseUrl}`}
                          </p>
                          {result && (
                            <p
                              className={`flex items-center gap-1 text-xs ${
                                result.ok ? "text-green-600" : "text-red-500"
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
        <DialogContent className="max-w-lg">
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
                      {info.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 模型 */}
            {form.provider && currentModelOptions.length > 0 && (
              <div className="space-y-1.5">
                <Label>模型</Label>
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
