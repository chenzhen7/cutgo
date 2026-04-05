"use client"

import { useEffect, useState, useMemo } from "react"
import { useParams } from "next/navigation"
import {
  Paintbrush,
  Upload,
  Check,
  ImageIcon,
  Sparkles,
  Plus,
  Search,
  Monitor,
  Smartphone,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"
import { STYLE_PRESETS, STYLE_PRESET_CATEGORIES, PLATFORM_PRESETS } from "@/lib/types"
import type { Project } from "@/lib/types"

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  douyin: Smartphone,
  youtube: Monitor,
}

export default function StylePage() {
  const params = useParams()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
  const [customStyle, setCustomStyle] = useState("")
  const [aspectRatio, setAspectRatio] = useState("9:16")
  const [resolution, setResolution] = useState("1080x1920")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeCategory, setActiveCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  const isCustom = selectedPreset === "__custom__"

  useEffect(() => {
    fetch(`/api/projects/${projectId}`)
      .then((res) => res.json())
      .then((data: Project) => {
        setProject(data)
        setAspectRatio(data.aspectRatio || "9:16")
        setResolution(data.resolution || "1080x1920")
        if (data.stylePreset) {
          const matched = STYLE_PRESETS.some((s) => s.label === data.stylePreset)
          if (matched) {
            setSelectedPreset(data.stylePreset)
          } else {
            setSelectedPreset("__custom__")
            setCustomStyle(data.stylePreset)
          }
        }
      })
  }, [projectId])

  const filteredPresets = useMemo(() => {
    return STYLE_PRESETS.filter((style) => {
      const matchCategory =
        activeCategory === "all" || style.category === activeCategory
      const q = searchQuery.toLowerCase()
      const matchSearch =
        !searchQuery ||
        style.label.toLowerCase().includes(q) ||
        style.description.toLowerCase().includes(q)
      return matchCategory && matchSearch
    })
  }, [activeCategory, searchQuery])

  const selectedLabel = isCustom
    ? customStyle || "自定义风格"
    : STYLE_PRESETS.find((s) => s.label === selectedPreset)?.label

  const resolvedStyle = isCustom ? customStyle.trim() : selectedPreset

  async function handleSave() {
    setSaving(true)
    try {
      await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stylePreset: resolvedStyle || null,
          aspectRatio,
          resolution,
        }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl w-full px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-5 border-b">
        <div className="flex items-center gap-3">
          <Paintbrush className="h-5 w-5 text-muted-foreground" />
          <div>
            <h1 className="text-xl font-semibold">视觉风格管理器</h1>
            <p className="text-sm text-muted-foreground">
              在项目开始前锁定视觉参数，确保全剧画面调性统一
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saved ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              已保存
            </>
          ) : saving ? (
            "保存中..."
          ) : (
            "保存设置"
          )}
        </Button>
      </div>

      {/* Style Presets Section */}
      <div className="py-6 space-y-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">画面规格</span>
          </div>
        </div>

        <RadioGroup
          value={PLATFORM_PRESETS.find(p => p.aspectRatio === aspectRatio)?.value || "douyin"}
          onValueChange={(val) => {
            const preset = PLATFORM_PRESETS.find(p => p.value === val)
            if (preset) {
              setAspectRatio(preset.aspectRatio)
              setResolution(preset.resolution)
            }
          }}
          className="grid grid-cols-2 gap-3"
        >
          {PLATFORM_PRESETS.map((p) => {
            const Icon = PLATFORM_ICONS[p.value] || Smartphone
            const isSelected = aspectRatio === p.aspectRatio
            return (
              <label
                key={p.value}
                className={cn(
                  "relative flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 p-3 transition-colors",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-foreground/20"
                )}
              >
                <RadioGroupItem value={p.value} className="sr-only" />
                <Icon className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs font-medium">{p.label}</span>
                <span className="text-[10px] text-muted-foreground">
                  {p.aspectRatio} · {p.resolution}
                </span>
              </label>
            )
          })}
        </RadioGroup>
      </div>

      {/* Style Presets Section */}
      <div className="py-6 space-y-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">选择视觉风格</span>
          </div>
          {selectedPreset && (
            <span className="text-xs text-muted-foreground">
              当前：
              <span className="font-medium text-foreground ml-1">
                {selectedLabel}
              </span>
            </span>
          )}
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-1.5">
          {STYLE_PRESET_CATEGORIES.map((cat) => {
            const count =
              cat.value === "all"
                ? STYLE_PRESETS.length
                : STYLE_PRESETS.filter((s) => s.category === cat.value).length
            return (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={cn(
                  "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors",
                  activeCategory === cat.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                )}
              >
                {cat.label}
                <span
                  className={cn(
                    "text-[10px] tabular-nums",
                    activeCategory === cat.value ? "opacity-70" : "opacity-50"
                  )}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Search */}
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="搜索风格名称..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-8 text-sm"
          />
        </div>

        {/* Grid with Scroll Area */}
        <ScrollArea className="h-[520px] pr-4 -mr-4">
          <TooltipProvider delayDuration={300}>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 py-2">
              {filteredPresets.map((style) => {
                const isSelected = selectedPreset === style.label
                return (
                  <Tooltip key={style.label}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedPreset(isSelected ? null : style.label)
                        }
                        className={cn(
                          "relative flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all text-center group",
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40 hover:bg-muted/40"
                        )}
                      >
                        <div className="h-14 w-full rounded-md bg-muted flex items-center justify-center shrink-0">
                          <ImageIcon className="h-5 w-5 text-muted-foreground/40 group-hover:text-muted-foreground/60 transition-colors" />
                        </div>
                        <span className="text-xs font-medium leading-tight line-clamp-1 w-full">
                          {style.label}
                        </span>
                        {isSelected && (
                          <div className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-primary flex items-center justify-center shadow-sm">
                            <Check className="h-2.5 w-2.5 text-primary-foreground" />
                          </div>
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="bottom"
                      className="max-w-sm text-left leading-relaxed"
                    >
                      {style.description}
                    </TooltipContent>
                  </Tooltip>
                )
              })}

              {/* Custom style card — always visible */}
              <button
                type="button"
                onClick={() => setSelectedPreset(isCustom ? null : "__custom__")}
                className={cn(
                  "relative flex flex-col items-center gap-2 rounded-lg border-2 border-dashed p-3 transition-all text-center group",
                  isCustom
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40 hover:bg-muted/40"
                )}
              >
                <div className="h-14 w-full rounded-md bg-muted flex items-center justify-center">
                  <Plus className="h-5 w-5 text-muted-foreground/40 group-hover:text-muted-foreground/60 transition-colors" />
                </div>
                <span className="text-xs font-medium leading-tight">自定义</span>
                {isCustom && (
                  <div className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-primary flex items-center justify-center shadow-sm">
                    <Check className="h-2.5 w-2.5 text-primary-foreground" />
                  </div>
                )}
              </button>
            </div>
          </TooltipProvider>
        </ScrollArea>

        {filteredPresets.length === 0 && searchQuery && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            未找到「{searchQuery}」相关风格，可使用自定义风格
          </div>
        )}

        {isCustom && (
          <div className="flex flex-col gap-2 pt-2 border-t">
            <Label htmlFor="custom-style" className="text-sm">
              输入自定义风格名称
            </Label>
            <Input
              id="custom-style"
              placeholder="例如：复古胶片、赛博水墨、暗黑哥特..."
              value={customStyle}
              onChange={(e) => setCustomStyle(e.target.value)}
              maxLength={50}
              autoFocus
            />
          </div>
        )}
      </div>

      {/* Style Reference Upload Section */}
      <div className="py-6 space-y-3">
        <div className="flex items-center gap-2">
          <Upload className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">风格参考图</span>
        </div>
        <p className="text-xs text-muted-foreground">
          上传一张风格参考图，系统将通过 IP-Adapter 提取色彩和笔触，确保全剧画面调性统一
        </p>
        <div className="flex h-36 items-center justify-center rounded-lg border-2 border-dashed border-border hover:border-primary/40 transition-colors cursor-pointer">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Upload className="h-7 w-7" />
            <span className="text-sm">点击或拖拽上传参考图</span>
            <span className="text-xs opacity-70">支持 PNG、JPG，建议 512×512 以上</span>
          </div>
        </div>
      </div>
    </div>
  )
}
