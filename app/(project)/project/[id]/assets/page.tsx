"use client"

import { useState } from "react"
import {
  FolderOpen,
  Users,
  MapPin,
  Box,
  LayoutGrid,
  ImageIcon,
  Plus,
  Search,
  Import,
  Lock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

type AssetTab = "characters" | "scenes" | "props" | "storyboard"

const TABS = [
  { key: "characters" as const, label: "角色库", icon: Users, count: 0 },
  { key: "scenes" as const, label: "场景库", icon: MapPin, count: 0 },
  { key: "props" as const, label: "道具库", icon: Box, count: 0 },
  { key: "storyboard" as const, label: "分镜资源", icon: LayoutGrid, count: 0 },
]

const MOCK_CHARACTERS = [
  { id: "1", name: "男主角", desc: "28岁，都市精英", locked: true },
  { id: "2", name: "女主角", desc: "24岁，设计师", locked: true },
  { id: "3", name: "反派", desc: "35岁，商业对手", locked: false },
]

const MOCK_SCENES = [
  { id: "1", name: "总裁办公室", desc: "高层写字楼，落地窗" },
  { id: "2", name: "咖啡厅", desc: "文艺复古风格" },
  { id: "3", name: "公园长椅", desc: "秋天，银杏落叶" },
]

const MOCK_PROPS = [
  { id: "1", name: "合同文件", desc: "商务文件夹" },
  { id: "2", name: "钻戒", desc: "六爪镶嵌" },
]

export default function AssetsPage() {
  const [activeTab, setActiveTab] = useState<AssetTab>("characters")

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FolderOpen className="h-5 w-5 text-muted-foreground" />
          <div>
            <h1 className="text-xl font-semibold">资产库</h1>
            <p className="text-sm text-muted-foreground">
              项目内所有生成内容的集中仓库，支持跨章节调用
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="text-xs">
          原型预览
        </Badge>
      </div>

      {/* Coming Soon Banner */}
      <div className="mt-6 rounded-lg border border-dashed border-primary/30 bg-primary/5 px-4 py-3">
        <p className="text-sm text-primary/80">
          资产库功能正在开发中，当前为原型预览。后续将支持 AI 角色生成、场景管理、素材复用等完整功能。
        </p>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex items-center gap-1 border-b border-border">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm transition-colors -mb-px",
                isActive
                  ? "border-primary text-foreground font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              <Badge
                variant="secondary"
                className="h-5 min-w-[20px] text-[10px] px-1.5"
              >
                {tab.count}
              </Badge>
            </button>
          )
        })}
      </div>

      {/* Toolbar */}
      <div className="mt-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="搜索资产..." className="pl-9" disabled />
        </div>
        <Button size="sm" disabled>
          <Plus className="mr-2 h-3.5 w-3.5" />
          添加
        </Button>
        <Button variant="outline" size="sm" disabled>
          <Import className="mr-2 h-3.5 w-3.5" />
          从其他项目导入
        </Button>
      </div>

      {/* Content */}
      <div className="mt-6">
        {activeTab === "characters" && (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              展示本项目已定义的角色模型（Seed 值、人脸特征、固定服装）
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {MOCK_CHARACTERS.map((char) => (
                <Card key={char.id} className="opacity-60">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Users className="h-6 w-6 text-muted-foreground/50" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{char.name}</span>
                          {char.locked && (
                            <Lock className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {char.desc}
                        </p>
                        <div className="mt-2 flex gap-1.5">
                          <Badge variant="outline" className="text-[10px]">
                            Seed: --
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                            人脸: --
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Add Card */}
              <Card className="border-dashed opacity-40">
                <CardContent className="flex h-full min-h-[100px] items-center justify-center pt-4">
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <Plus className="h-6 w-6" />
                    <span className="text-xs">添加角色</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "scenes" && (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              存储已生成的固定背景，确保场景在不同镜头间不穿帮
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {MOCK_SCENES.map((scene) => (
                <Card key={scene.id} className="opacity-60">
                  <CardContent className="pt-4">
                    <div className="h-24 rounded-lg bg-muted flex items-center justify-center mb-3">
                      <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <span className="text-sm font-medium">{scene.name}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {scene.desc}
                    </p>
                  </CardContent>
                </Card>
              ))}

              <Card className="border-dashed opacity-40">
                <CardContent className="flex h-full min-h-[160px] items-center justify-center pt-4">
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <Plus className="h-6 w-6" />
                    <span className="text-xs">添加场景</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "props" && (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              管理项目中反复出现的道具，确保视觉一致性
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {MOCK_PROPS.map((prop) => (
                <Card key={prop.id} className="opacity-60">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Box className="h-5 w-5 text-muted-foreground/50" />
                      </div>
                      <div>
                        <span className="text-sm font-medium">{prop.name}</span>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {prop.desc}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Card className="border-dashed opacity-40">
                <CardContent className="flex h-full min-h-[80px] items-center justify-center pt-4">
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <Plus className="h-6 w-6" />
                    <span className="text-xs">添加道具</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "storyboard" && (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              分镜画面资源管理，后续由分镜生成模块自动填充
            </p>
            <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-border">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <LayoutGrid className="h-10 w-10 opacity-30" />
                <span className="text-sm">分镜资源将在分镜生成后自动填充</span>
                <span className="text-xs">请先完成剧本生成和分镜生成步骤</span>
              </div>
            </div>
          </div>
        )}

        {/* Reuse Logic Info */}
        <Separator className="my-8" />
        <Card className="border-dashed opacity-60">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Import className="h-4 w-4" />
              素材复用逻辑（即将推出）
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              支持将 A 项目的角色/场景直接导入 B 项目，系列剧制作必备功能。
              此功能将在后续版本中实现。
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
