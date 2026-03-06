"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  ArrowRight,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Sparkles,
  Clock,
  Film,
  ChevronDown,
  ChevronRight,
  Loader2,
} from "lucide-react"

// ── Mock Data ──

interface EpisodeScene {
  id: string
  index: number
  title: string
  summary: string
  duration: string
  characters: string[]
  emotion: string
}

interface Episode {
  id: string
  index: number
  title: string
  synopsis: string
  duration: string
  sceneCount: number
  keyConflict: string
  cliffhanger: string
  scenes: EpisodeScene[]
}

const MOCK_EPISODES: Episode[] = [
  {
    id: "ep-1",
    index: 0,
    title: "第1集 · 重逢",
    synopsis:
      "女主林晚秋回到阔别五年的故乡，意外在家族宴会上撞见前男友陆景琛。两人目光交汇，往事涌上心头。林晚秋强装镇定，却在宴会结束后独自崩溃。",
    duration: "60s",
    sceneCount: 4,
    keyConflict: "旧情重燃 vs 五年前的误会",
    cliffhanger: "陆景琛递出一份合同——他竟然是林晚秋新公司的投资人",
    scenes: [
      {
        id: "s1-1",
        index: 0,
        title: "机场回归",
        summary: "林晚秋拖着行李箱走出机场，深吸一口气，回到这座既熟悉又陌生的城市。",
        duration: "12s",
        characters: ["林晚秋"],
        emotion: "感慨",
      },
      {
        id: "s1-2",
        index: 1,
        title: "宴会重逢",
        summary: "家族宴会上，林晚秋正与亲戚寒暄，转身撞见陆景琛。空气瞬间凝固。",
        duration: "18s",
        characters: ["林晚秋", "陆景琛"],
        emotion: "震惊/紧张",
      },
      {
        id: "s1-3",
        index: 2,
        title: "强装镇定",
        summary: "两人被迫同桌而坐。林晚秋面带微笑应对，暗地里手指微微发抖。",
        duration: "15s",
        characters: ["林晚秋", "陆景琛"],
        emotion: "压抑",
      },
      {
        id: "s1-4",
        index: 3,
        title: "合同悬念",
        summary: "宴会散场，陆景琛拦住林晚秋，递出一份文件：「林总，期待合作。」",
        duration: "15s",
        characters: ["林晚秋", "陆景琛"],
        emotion: "悬疑/冲击",
      },
    ],
  },
  {
    id: "ep-2",
    index: 1,
    title: "第2集 · 交锋",
    synopsis:
      "林晚秋发现陆景琛就是自己创业项目的唯一投资人，拒绝意味着公司倒闭。两人在会议室针锋相对，旧日恩怨在商业博弈中被撕开。闺蜜苏蔓意外揭露了五年前分手的真相一角。",
    duration: "60s",
    sceneCount: 4,
    keyConflict: "商业利益 vs 个人尊严",
    cliffhanger: "苏蔓说出「当年那封信，根本不是他写的」",
    scenes: [
      {
        id: "s2-1",
        index: 0,
        title: "办公室对峙",
        summary: "林晚秋摔下合同：「陆景琛，你到底想怎样？」陆景琛冷静回应：「只是生意。」",
        duration: "15s",
        characters: ["林晚秋", "陆景琛"],
        emotion: "愤怒",
      },
      {
        id: "s2-2",
        index: 1,
        title: "闺蜜谈心",
        summary: "苏蔓陪林晚秋喝酒，劝她接受投资。「你真的了解五年前发生了什么吗？」",
        duration: "15s",
        characters: ["林晚秋", "苏蔓"],
        emotion: "困惑/温暖",
      },
      {
        id: "s2-3",
        index: 2,
        title: "签约谈判",
        summary: "林晚秋带着对赌条款走进会议室，提出苛刻条件。陆景琛全部答应。",
        duration: "15s",
        characters: ["林晚秋", "陆景琛"],
        emotion: "紧张/意外",
      },
      {
        id: "s2-4",
        index: 3,
        title: "真相一角",
        summary: "深夜，苏蔓发来一条消息：「那封分手信，根本不是他写的。」",
        duration: "15s",
        characters: ["苏蔓"],
        emotion: "悬疑",
      },
    ],
  },
  {
    id: "ep-3",
    index: 2,
    title: "第3集 · 真相",
    synopsis:
      "林晚秋开始追查五年前分手信的真相。陆景琛在一次加班中不小心流露出对她的在意。第三方反派——陆景琛的未婚妻方婉清登场，局势骤变。",
    duration: "60s",
    sceneCount: 4,
    keyConflict: "真相逼近 vs 新的阻碍",
    cliffhanger: "方婉清挽着陆景琛的手出现在林晚秋面前：「你好，我是景琛的未婚妻。」",
    scenes: [
      {
        id: "s3-1",
        index: 0,
        title: "追查线索",
        summary: "林晚秋翻出五年前的信件，对比笔迹，发现端倪。",
        duration: "12s",
        characters: ["林晚秋"],
        emotion: "疑惑/专注",
      },
      {
        id: "s3-2",
        index: 1,
        title: "深夜加班",
        summary: "公司加班，陆景琛默默给林晚秋递来一杯咖啡。「别太累了。」",
        duration: "15s",
        characters: ["林晚秋", "陆景琛"],
        emotion: "心动/温馨",
      },
      {
        id: "s3-3",
        index: 2,
        title: "反派登场",
        summary: "方婉清出现在公司楼下，妆容精致、气场强大。她径直走向陆景琛的办公室。",
        duration: "15s",
        characters: ["方婉清", "陆景琛"],
        emotion: "紧张",
      },
      {
        id: "s3-4",
        index: 3,
        title: "三人照面",
        summary: "电梯门打开，方婉清挽着陆景琛。「你好，我是景琛的未婚妻。」林晚秋笑容僵住。",
        duration: "18s",
        characters: ["林晚秋", "陆景琛", "方婉清"],
        emotion: "冲击/心碎",
      },
    ],
  },
]

const MOCK_CHARACTERS = ["林晚秋", "陆景琛", "苏蔓", "方婉清"]

const EMOTION_TAGS = ["平静", "紧张", "悲伤", "激昂", "温馨", "愤怒", "震惊", "心动", "悬疑", "冲击", "感慨", "压抑"]

// ── Components ──

function EpisodeCard({
  episode,
  onEdit,
  onDelete,
}: {
  episode: Episode
  onEdit: () => void
  onDelete: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Card className="group">
      <CardContent className="pt-4 pb-3">
        <div className="flex items-start gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm mt-0.5">
            {episode.index + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">{episode.title}</h4>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon-sm" onClick={onEdit}>
                  <Pencil className="size-3" />
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={onDelete}>
                  <Trash2 className="size-3" />
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {episode.synopsis}
            </p>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <Badge variant="secondary" className="gap-1 text-xs">
                <Clock className="size-3" />
                {episode.duration}
              </Badge>
              <Badge variant="secondary" className="gap-1 text-xs">
                <Film className="size-3" />
                {episode.sceneCount} 场
              </Badge>
              <Badge variant="outline" className="text-xs">
                冲突: {episode.keyConflict}
              </Badge>
            </div>
            {episode.cliffhanger && (
              <div className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                钩子: {episode.cliffhanger}
              </div>
            )}

            {/* Scenes toggle */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {expanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
              {episode.scenes.length} 个场景
            </button>

            {expanded && (
              <div className="mt-2 flex flex-col gap-1.5 border-l-2 border-muted pl-3 ml-1">
                {episode.scenes.map((scene) => (
                  <div
                    key={scene.id}
                    className="flex items-start gap-2 py-1.5 text-xs"
                  >
                    <span className="text-muted-foreground shrink-0 w-5 text-right font-mono">
                      {scene.index + 1}.
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{scene.title}</span>
                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                          {scene.emotion}
                        </Badge>
                        <span className="text-muted-foreground">{scene.duration}</span>
                      </div>
                      <p className="text-muted-foreground mt-0.5">{scene.summary}</p>
                      <div className="flex gap-1 mt-1">
                        {scene.characters.map((c) => (
                          <Badge key={c} variant="secondary" className="text-[10px] px-1.5 py-0">
                            {c}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function OutlinePage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [episodes, setEpisodes] = useState<Episode[]>(MOCK_EPISODES)
  const [generating, setGenerating] = useState(false)
  const [editingEp, setEditingEp] = useState<Episode | null>(null)

  const totalDuration = episodes.reduce(
    (sum, ep) => sum + parseInt(ep.duration),
    0
  )
  const totalScenes = episodes.reduce((sum, ep) => sum + ep.sceneCount, 0)

  const handleGenerate = () => {
    setGenerating(true)
    setTimeout(() => {
      setGenerating(false)
    }, 2000)
  }

  const handleDelete = (id: string) => {
    setEpisodes((prev) =>
      prev
        .filter((ep) => ep.id !== id)
        .map((ep, i) => ({ ...ep, index: i }))
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6 pb-24">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">分集大纲</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            基于小说分析结果，将故事拆分为多集短剧大纲，每集包含场景、冲突与钩子
          </p>
        </div>
        <Button onClick={handleGenerate} disabled={generating}>
          {generating ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <Sparkles className="size-4" />
              AI 生成大纲
            </>
          )}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold">{episodes.length}</p>
            <p className="text-xs text-muted-foreground mt-1">总集数</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold">{totalScenes}</p>
            <p className="text-xs text-muted-foreground mt-1">总场景数</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold">{totalDuration}s</p>
            <p className="text-xs text-muted-foreground mt-1">预估总时长</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold">{MOCK_CHARACTERS.length}</p>
            <p className="text-xs text-muted-foreground mt-1">涉及角色</p>
          </CardContent>
        </Card>
      </div>

      {/* Episode List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">分集列表</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setEpisodes((prev) => [
                ...prev,
                {
                  id: `ep-new-${Date.now()}`,
                  index: prev.length,
                  title: `第${prev.length + 1}集 · 新章节`,
                  synopsis: "（请编辑本集内容）",
                  duration: "60s",
                  sceneCount: 0,
                  keyConflict: "",
                  cliffhanger: "",
                  scenes: [],
                },
              ])
            }
          >
            <Plus className="size-3.5" />
            添加一集
          </Button>
        </div>

        <div className="flex flex-col gap-3">
          {episodes.map((ep) => (
            <EpisodeCard
              key={ep.id}
              episode={ep}
              onEdit={() => setEditingEp(ep)}
              onDelete={() => handleDelete(ep.id)}
            />
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur-sm px-6 py-4">
        <div className="mx-auto max-w-3xl">
          <Button
            size="lg"
            className="w-full"
            onClick={() => router.push(`/project/${projectId}/script`)}
          >
            确认大纲，进入剧本生成
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingEp} onOpenChange={(open) => !open && setEditingEp(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>编辑分集大纲</DialogTitle>
          </DialogHeader>
          {editingEp && (
            <EpisodeForm
              episode={editingEp}
              onSave={(updated) => {
                setEpisodes((prev) =>
                  prev.map((ep) => (ep.id === updated.id ? updated : ep))
                )
                setEditingEp(null)
              }}
              onCancel={() => setEditingEp(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function EpisodeForm({
  episode,
  onSave,
  onCancel,
}: {
  episode: Episode
  onSave: (ep: Episode) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(episode.title)
  const [synopsis, setSynopsis] = useState(episode.synopsis)
  const [keyConflict, setKeyConflict] = useState(episode.keyConflict)
  const [cliffhanger, setCliffhanger] = useState(episode.cliffhanger)
  const [duration, setDuration] = useState(episode.duration)

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="text-sm font-medium mb-1 block">集标题</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">剧情摘要</label>
        <Textarea
          value={synopsis}
          onChange={(e) => setSynopsis(e.target.value)}
          rows={4}
          className="resize-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium mb-1 block">核心冲突</label>
          <Input value={keyConflict} onChange={(e) => setKeyConflict(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">时长</label>
          <Input value={duration} onChange={(e) => setDuration(e.target.value)} />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">结尾钩子</label>
        <Input
          value={cliffhanger}
          onChange={(e) => setCliffhanger(e.target.value)}
          placeholder="留下悬念让观众追下一集"
        />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>取消</Button>
        <Button
          onClick={() =>
            onSave({
              ...episode,
              title,
              synopsis,
              keyConflict,
              cliffhanger,
              duration,
            })
          }
        >
          保存
        </Button>
      </DialogFooter>
    </div>
  )
}
