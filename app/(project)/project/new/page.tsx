"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  ProjectStyleManagerFields,
  type ProjectStyleManagerValue,
} from "@/app/(project)/project/components/project-style-manager-fields"
import { useProjectStore } from "@/store/project-store"

export default function NewProjectPage() {
  const router = useRouter()
  const { createProject } = useProjectStore()

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [tags, setTags] = useState("")
  const [styleValue, setStyleValue] = useState<ProjectStyleManagerValue>({
    aspectRatio: "9:16",
    resolution: "1080x1920",
    stylePreset: null,
  })
  const [submitting, setSubmitting] = useState(false)

  async function handleCreate() {
    if (!name.trim() || submitting) return

    setSubmitting(true)

    try {
      const project = await createProject({
        name: name.trim(),
        description: description.trim() || undefined,
        tags: tags.trim() || undefined,
        aspectRatio: styleValue.aspectRatio,
        resolution: styleValue.resolution,
        stylePreset: styleValue.stylePreset || undefined,
      })

      router.push(`/project/${project.id}`)
    } catch {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-6 py-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold text-foreground">新建项目</h1>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-6 py-8">
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
                placeholder="例如：龙王回归 第 1-10 集"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={50}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="description">项目描述</Label>
              <Textarea
                id="description"
                placeholder="简要描述这个项目的内容和定位..."
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                maxLength={200}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="tags">标签</Label>
              <Input
                id="tags"
                placeholder="用逗号分隔，例如：霸总, 甜宠, 逆袭"
                value={tags}
                onChange={(event) => setTags(event.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>视觉风格</CardTitle>
          </CardHeader>
          <CardContent>
            <ProjectStyleManagerFields
              value={styleValue}
              onChange={setStyleValue}
              showReferenceUpload={false}
            />
          </CardContent>
        </Card>

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
