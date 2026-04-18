"use client"

import { useMemo, useState, type ElementType } from "react"
import {
  Check,
  ImageIcon,
  Monitor,
  Plus,
  Search,
  Smartphone,
  Upload,
  Sparkles,
} from "lucide-react"
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
import {
  PLATFORM_PRESETS,
  STYLE_PRESETS,
  STYLE_PRESET_CATEGORIES,
} from "@/lib/types"

const CUSTOM_STYLE_KEY = "__custom__"

const PLATFORM_ICONS: Record<string, ElementType> = {
  douyin: Smartphone,
  youtube: Monitor,
}

export type ProjectStyleManagerValue = {
  aspectRatio: string
  resolution: string
  stylePreset: string | null
}

interface ProjectStyleManagerFieldsProps {
  value: ProjectStyleManagerValue
  onChange: (value: ProjectStyleManagerValue) => void
  className?: string
  showReferenceUpload?: boolean
}

function toStyleSelection(stylePreset: string | null) {
  if (!stylePreset) {
    return {
      selectedPreset: null as string | null,
      customStyle: "",
    }
  }

  const matchedPreset = STYLE_PRESETS.find((item) => item.label === stylePreset)
  if (matchedPreset) {
    return {
      selectedPreset: matchedPreset.label,
      customStyle: "",
    }
  }

  return {
    selectedPreset: CUSTOM_STYLE_KEY,
    customStyle: stylePreset,
  }
}

function resolveStylePreset(selectedPreset: string | null, customStyle: string) {
  if (selectedPreset === CUSTOM_STYLE_KEY) {
    return customStyle.trim() || null
  }

  return selectedPreset
}

export function ProjectStyleManagerFields({
  value,
  onChange,
  className,
  showReferenceUpload = true,
}: ProjectStyleManagerFieldsProps) {
  const initialSelection = toStyleSelection(value.stylePreset)

  const [selectedPreset, setSelectedPreset] = useState<string | null>(
    initialSelection.selectedPreset
  )
  const [customStyle, setCustomStyle] = useState(initialSelection.customStyle)
  const [activeCategory, setActiveCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  const isCustom = selectedPreset === CUSTOM_STYLE_KEY

  const filteredPresets = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return STYLE_PRESETS.filter((style) => {
      const matchCategory =
        activeCategory === "all" || style.category === activeCategory
      const matchSearch =
        !query ||
        style.label.toLowerCase().includes(query) ||
        style.description.toLowerCase().includes(query)

      return matchCategory && matchSearch
    })
  }, [activeCategory, searchQuery])

  const selectedLabel = isCustom
    ? customStyle || "自定义风格"
    : STYLE_PRESETS.find((item) => item.label === selectedPreset)?.label

  function updateValue(next: Partial<ProjectStyleManagerValue>) {
    onChange({
      ...value,
      ...next,
    })
  }

  function updateStyle(nextSelectedPreset: string | null, nextCustomStyle = customStyle) {
    setSelectedPreset(nextSelectedPreset)
    setCustomStyle(nextCustomStyle)
    updateValue({
      stylePreset: resolveStylePreset(nextSelectedPreset, nextCustomStyle),
    })
  }

  return (
    <div className={cn("space-y-6", className)}>
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Monitor className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">画面规格</span>
        </div>

        <RadioGroup
          value={
            PLATFORM_PRESETS.find((preset) => preset.aspectRatio === value.aspectRatio)
              ?.value || PLATFORM_PRESETS[0].value
          }
          onValueChange={(nextPresetValue) => {
            const nextPreset = PLATFORM_PRESETS.find(
              (preset) => preset.value === nextPresetValue
            )

            if (!nextPreset) return

            updateValue({
              aspectRatio: nextPreset.aspectRatio,
              resolution: nextPreset.resolution,
            })
          }}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          {PLATFORM_PRESETS.map((preset) => {
            const Icon = PLATFORM_ICONS[preset.value] || Smartphone
            const isSelected = value.aspectRatio === preset.aspectRatio

            return (
              <label
                key={preset.value}
                className={cn(
                  "relative flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-foreground/20"
                )}
              >
                <RadioGroupItem value={preset.value} className="sr-only" />
                <Icon className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm font-medium">{preset.label}</span>
                <span className="text-xs text-muted-foreground">
                  {preset.aspectRatio} / {preset.resolution}
                </span>
              </label>
            )
          })}
        </RadioGroup>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">选择视觉风格</span>
          </div>
          {selectedPreset && (
            <span className="text-xs text-muted-foreground">
              当前:
              <span className="ml-1 font-medium text-foreground">
                {selectedLabel}
              </span>
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {STYLE_PRESET_CATEGORIES.map((category) => {
            const count =
              category.value === "all"
                ? STYLE_PRESETS.length
                : STYLE_PRESETS.filter((item) => item.category === category.value).length

            return (
              <button
                key={category.value}
                type="button"
                onClick={() => setActiveCategory(category.value)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  activeCategory === category.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                )}
              >
                {category.label}
                <span
                  className={cn(
                    "text-[10px] tabular-nums",
                    activeCategory === category.value ? "opacity-70" : "opacity-50"
                  )}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索风格名称..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="h-8 pl-9 text-sm"
          />
        </div>

        <ScrollArea className="h-[520px] -mr-4 pr-4">
          <TooltipProvider delayDuration={300}>
            <div className="grid grid-cols-3 gap-2 py-2 sm:grid-cols-4 md:grid-cols-5">
              {filteredPresets.map((style) => {
                const isSelected = selectedPreset === style.label

                return (
                  <Tooltip key={style.label}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() =>
                          updateStyle(isSelected ? null : style.label)
                        }
                        className={cn(
                          "group relative flex flex-col items-center gap-2 rounded-lg border-2 p-3 text-center transition-all",
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40 hover:bg-muted/40"
                        )}
                      >
                        <div className="flex h-14 w-full shrink-0 items-center justify-center rounded-md bg-muted">
                          <ImageIcon className="h-5 w-5 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground/60" />
                        </div>
                        <span className="line-clamp-1 w-full text-xs font-medium leading-tight">
                          {style.label}
                        </span>
                        {isSelected && (
                          <div className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary shadow-sm">
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

              <button
                type="button"
                onClick={() => updateStyle(isCustom ? null : CUSTOM_STYLE_KEY)}
                className={cn(
                  "group relative flex flex-col items-center gap-2 rounded-lg border-2 border-dashed p-3 text-center transition-all",
                  isCustom
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40 hover:bg-muted/40"
                )}
              >
                <div className="flex h-14 w-full items-center justify-center rounded-md bg-muted">
                  <Plus className="h-5 w-5 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground/60" />
                </div>
                <span className="text-xs font-medium leading-tight">自定义</span>
                {isCustom && (
                  <div className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary shadow-sm">
                    <Check className="h-2.5 w-2.5 text-primary-foreground" />
                  </div>
                )}
              </button>
            </div>
          </TooltipProvider>
        </ScrollArea>

        {filteredPresets.length === 0 && searchQuery && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            未找到与“{searchQuery}”相关的风格，可使用自定义风格。
          </div>
        )}

        {isCustom && (
          <div className="flex flex-col gap-2 border-t pt-2">
            <Label htmlFor="custom-style" className="text-sm">
              输入自定义风格名称
            </Label>
            <Input
              id="custom-style"
              placeholder="例如：复古胶片、赛博水墨、暗黑哥特..."
              value={customStyle}
              onChange={(event) =>
                updateStyle(CUSTOM_STYLE_KEY, event.target.value)
              }
              maxLength={50}
              autoFocus
            />
          </div>
        )}
      </section>

      {showReferenceUpload && (
        <section className="space-y-3 border-t pt-6">
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">风格参考图</span>
          </div>
          <p className="text-xs text-muted-foreground">
            上传一张风格参考图，后续可用于统一色彩、笔触和画面气质。
          </p>
          <div className="flex h-36 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border transition-colors hover:border-primary/40">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Upload className="h-7 w-7" />
              <span className="text-sm">点击或拖拽上传参考图</span>
              <span className="text-xs opacity-70">
                支持 PNG、JPG，建议 512x512 以上
              </span>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
