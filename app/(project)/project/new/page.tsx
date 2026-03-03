"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Monitor, Smartphone, Tablet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useProjectStore } from "@/store/project-store"
import { PLATFORM_PRESETS, DURATION_OPTIONS } from "@/lib/types"

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  douyin: Smartphone,
  kuaishou: Tablet,
  youtube: Monitor,
}

export default function NewProjectPage() {
  const router = useRouter()
  const { createProject } = useProjectStore()

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [tags, setTags] = useState("")
  const [platformValue, setPlatformValue] = useState("douyin")
  const [duration, setDuration] = useState("60s")
  const [customDuration, setCustomDuration] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const selectedPlatform = PLATFORM_PRESETS.find(
    (p) => p.value === platformValue
  )!

  async function handleCreate() {
    if (!name.trim() || submitting) return
    setSubmitting(true)
    try {
      const finalDuration = duration === "自定义" ? customDuration : duration
      const project = await createProject({
        name: name.trim(),
        description: description.trim() || undefined,
        tags: tags.trim() || undefined,
        platform: selectedPlatform.label,
        aspectRatio: selectedPlatform.aspectRatio,
        resolution: selectedPlatform.resolution,
        duration: finalDuration,
      })
      router.push(`/project/${project.id}`)
    } catch {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-6 py-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold text-foreground">新建项目</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8 space-y-6">
        {/* 基本信息 */}
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">
                项目名称 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="例如：龙王回归 第1-10集"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="description">项目描述</Label>
              <Textarea
                id="description"
                placeholder="简要描述你的短剧内容..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={200}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="tags">标签</Label>
              <Input
                id="tags"
                placeholder="用逗号分隔，如：霸总,甜宠,逆袭"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* 目标平台预设 */}
        <Card>
          <CardHeader>
            <CardTitle>目标平台</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={platformValue}
              onValueChange={setPlatformValue}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3"
            >
              {PLATFORM_PRESETS.map((p) => {
                const Icon = PLATFORM_ICONS[p.value] || Smartphone
                const isSelected = platformValue === p.value
                return (
                  <label
                    key={p.value}
                    className={`relative flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-foreground/20"
                    }`}
                  >
                    <RadioGroupItem
                      value={p.value}
                      className="sr-only"
                    />
                    <Icon className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm font-medium">{p.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {p.aspectRatio} · {p.resolution}
                    </span>
                  </label>
                )
              })}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* 预计时长 */}
        <Card>
          <CardHeader>
            <CardTitle>预计时长</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-xs text-muted-foreground">
              单集时长影响 AI 拆解剧本的节奏感
            </p>
            <RadioGroup
              value={duration}
              onValueChange={setDuration}
              className="flex flex-wrap gap-3"
            >
              {DURATION_OPTIONS.map((d) => {
                const isSelected = duration === d
                return (
                  <label
                    key={d}
                    className={`cursor-pointer rounded-lg border-2 px-5 py-2.5 text-sm font-medium transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-foreground/20"
                    }`}
                  >
                    <RadioGroupItem value={d} className="sr-only" />
                    {d}
                  </label>
                )
              })}
            </RadioGroup>
            {duration === "自定义" && (
              <Input
                placeholder="输入时长，如：120s"
                value={customDuration}
                onChange={(e) => setCustomDuration(e.target.value)}
                className="max-w-[200px]"
              />
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center gap-3 pb-8">
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || submitting}
            size="lg"
          >
            {submitting ? "创建中..." : "创建项目"}
          </Button>
          <Link href="/">
            <Button variant="ghost" size="lg">
              取消
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
