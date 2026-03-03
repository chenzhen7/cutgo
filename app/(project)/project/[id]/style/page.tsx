"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import {
  Paintbrush,
  Upload,
  Check,
  Ban,
  ImageIcon,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { STYLE_PRESETS, DEFAULT_NEGATIVE_PROMPTS } from "@/lib/types"
import type { Project } from "@/lib/types"

export default function StylePage() {
  const params = useParams()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
  const [negPrompt, setNegPrompt] = useState(DEFAULT_NEGATIVE_PROMPTS)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch(`/api/projects/${projectId}`)
      .then((res) => res.json())
      .then((data) => {
        setProject(data)
        if (data.stylePreset) setSelectedPreset(data.stylePreset)
        if (data.globalNegPrompt) setNegPrompt(data.globalNegPrompt)
      })
  }, [projectId])

  async function handleSave() {
    setSaving(true)
    try {
      await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stylePreset: selectedPreset,
          globalNegPrompt: negPrompt,
        }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="flex items-center justify-between">
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

      <div className="mt-8 space-y-8">
        {/* Style Presets - Realistic */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4" />
              写实类风格
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {STYLE_PRESETS.realistic.map((style) => {
                const isSelected = selectedPreset === style.value
                return (
                  <button
                    key={style.value}
                    onClick={() =>
                      setSelectedPreset(
                        isSelected ? null : style.value
                      )
                    }
                    className={cn(
                      "relative flex flex-col items-center gap-3 rounded-lg border-2 p-5 transition-all",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-foreground/20"
                    )}
                  >
                    <div className="h-20 w-full rounded bg-muted flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <span className="text-sm font-medium">{style.label}</span>
                    {isSelected && (
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                        <Check className="h-3 w-3" />
                      </Badge>
                    )}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Style Presets - Artistic */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Paintbrush className="h-4 w-4" />
              艺术类风格
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {STYLE_PRESETS.artistic.map((style) => {
                const isSelected = selectedPreset === style.value
                return (
                  <button
                    key={style.value}
                    onClick={() =>
                      setSelectedPreset(
                        isSelected ? null : style.value
                      )
                    }
                    className={cn(
                      "relative flex flex-col items-center gap-3 rounded-lg border-2 p-4 transition-all",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-foreground/20"
                    )}
                  >
                    <div className="h-16 w-full rounded bg-muted flex items-center justify-center">
                      <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
                    </div>
                    <span className="text-sm font-medium">{style.label}</span>
                    {isSelected && (
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                        <Check className="h-3 w-3" />
                      </Badge>
                    )}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Global Negative Prompts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Ban className="h-4 w-4" />
              全局负面提示词
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              自动注入到所有图片生成任务中，避免常见画面缺陷
            </p>
            <Textarea
              value={negPrompt}
              onChange={(e) => setNegPrompt(e.target.value)}
              rows={4}
              placeholder="输入负面提示词，逗号分隔..."
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNegPrompt(DEFAULT_NEGATIVE_PROMPTS)}
            >
              恢复默认
            </Button>
          </CardContent>
        </Card>

        {/* Style Reference Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Upload className="h-4 w-4" />
              风格参考图
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              上传一张风格参考图，系统将通过 IP-Adapter 提取色彩和笔触，确保全剧画面调性统一
            </p>
            <div className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-border hover:border-foreground/20 transition-colors cursor-pointer">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Upload className="h-8 w-8" />
                <span className="text-sm">点击或拖拽上传参考图</span>
                <span className="text-xs">支持 PNG、JPG，建议 512x512 以上</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
