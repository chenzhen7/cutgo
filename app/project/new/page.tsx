"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const PLATFORMS = ["抖音", "TikTok", "小红书"]
const DURATIONS = ["30s", "60s", "90s"]

export default function NewProjectPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [platform, setPlatform] = useState("抖音")
  const [duration, setDuration] = useState("60s")

  function handleCreate() {
    // TODO: 实际创建项目逻辑
    router.push("/project/1")
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

      <main className="mx-auto max-w-2xl px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>项目信息</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {/* 项目名称 */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">项目名称</Label>
              <Input
                id="name"
                placeholder="例如：霸道总裁爱上我"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* 目标平台 */}
            <div className="flex flex-col gap-2">
              <Label>目标平台</Label>
              <RadioGroup value={platform} onValueChange={setPlatform} className="flex gap-4">
                {PLATFORMS.map((p) => (
                  <div key={p} className="flex items-center gap-2">
                    <RadioGroupItem value={p} id={`platform-${p}`} />
                    <Label htmlFor={`platform-${p}`} className="cursor-pointer font-normal">
                      {p}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* 视频时长 */}
            <div className="flex flex-col gap-2">
              <Label>视频时长</Label>
              <RadioGroup value={duration} onValueChange={setDuration} className="flex gap-4">
                {DURATIONS.map((d) => (
                  <div key={d} className="flex items-center gap-2">
                    <RadioGroupItem value={d} id={`duration-${d}`} />
                    <Label htmlFor={`duration-${d}`} className="cursor-pointer font-normal">
                      {d}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <Button onClick={handleCreate} disabled={!name.trim()} className="mt-2 self-start">
              创建项目
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
