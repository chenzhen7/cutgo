"use client"

import { useState } from "react"
import { Save } from "lucide-react"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"


export default function SettingsPage() {
  const [defaultPlatform, setDefaultPlatform] = useState("douyin")
  const [defaultDuration, setDefaultDuration] = useState("60")
  const [defaultStyle, setDefaultStyle] = useState("realistic")

  return (
   
    <div className="mx-auto max-w-3xl space-y-6 p-6 lg:p-8">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">项目设置</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          管理全局默认配置，新建项目时自动应用
        </p>
      </div>

      <Separator />

      {/* 默认项目配置 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">默认项目配置</CardTitle>
          <CardDescription>
            新建项目时的默认参数，可在项目创建时覆盖
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="platform">目标平台</Label>
              <Select value={defaultPlatform} onValueChange={setDefaultPlatform}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择平台" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="douyin">抖音 (9:16, 1080×1920)</SelectItem>
                  <SelectItem value="tiktok">TikTok (9:16, 1080×1920)</SelectItem>
                  <SelectItem value="xiaohongshu">小红书 (3:4, 1080×1440)</SelectItem>
                  <SelectItem value="youtube">YouTube (16:9, 1920×1080)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">默认时长</Label>
              <Select value={defaultDuration} onValueChange={setDefaultDuration}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择时长" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 秒</SelectItem>
                  <SelectItem value="60">60 秒</SelectItem>
                  <SelectItem value="90">90 秒</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="style">默认视觉风格</Label>
            <Select value={defaultStyle} onValueChange={setDefaultStyle}>
              <SelectTrigger className="w-full sm:w-1/2">
                <SelectValue placeholder="选择风格" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="realistic">写实 - 都市霸总</SelectItem>
                <SelectItem value="xianxia">写实 - 古装仙侠</SelectItem>
                <SelectItem value="scifi">写实 - 硬核科幻</SelectItem>
                <SelectItem value="anime">日漫风</SelectItem>
                <SelectItem value="comic">美漫风格</SelectItem>
                <SelectItem value="cyberpunk">赛博朋克</SelectItem>
                <SelectItem value="ink">水墨风</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* AI 模型配置 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">AI 模型配置</CardTitle>
          <CardDescription>
            配置文本生成和图像生成所使用的 AI 服务
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="llm-key">文本大模型 API Key</Label>
            <Input
              id="llm-key"
              type="password"
              placeholder="sk-..."
              className="sm:w-2/3"
            />
            <p className="text-xs text-muted-foreground">
              用于剧本生成、角色分析等文本处理任务
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="image-key">图像模型 API Key</Label>
            <Input
              id="image-key"
              type="password"
              placeholder="sk-..."
              className="sm:w-2/3"
            />
            <p className="text-xs text-muted-foreground">
              用于分镜画面生成、角色头像生成
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="comfyui-url">ComfyUI 服务地址</Label>
            <Input
              id="comfyui-url"
              type="url"
              placeholder="http://127.0.0.1:8188"
              className="sm:w-2/3"
            />
            <p className="text-xs text-muted-foreground">
              本地或远程 ComfyUI 实例地址，用于高级图像生成
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 输出配置 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">输出配置</CardTitle>
          <CardDescription>
            视频导出和存储相关设置
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="output-dir">默认输出目录</Label>
            <Input
              id="output-dir"
              placeholder="~/CutGo/output"
              className="sm:w-2/3"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>默认分辨率</Label>
              <Select defaultValue="1080p">
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="720p">720P</SelectItem>
                  <SelectItem value="1080p">1080P</SelectItem>
                  <SelectItem value="2k">2K</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>默认字幕</Label>
              <Select defaultValue="with">
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="with">带字幕</SelectItem>
                  <SelectItem value="without">无字幕</SelectItem>
                  <SelectItem value="both">同时导出两版</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 保存按钮 */}
      <div className="flex justify-end">
        <Button>
          <Save className="mr-2 h-4 w-4" />
          保存设置
        </Button>
      </div>
    </div>
  )
}
