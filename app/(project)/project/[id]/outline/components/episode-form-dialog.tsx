"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Episode, EpisodeInput, Chapter } from "@/lib/types"

interface EpisodeFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  episode?: Episode | null
  chapters: Chapter[]
  totalEpisodes?: number
  onSave: (data: EpisodeInput) => void
}

export function EpisodeFormDialog({
  open,
  onOpenChange,
  episode,
  chapters,
  totalEpisodes = 0,
  onSave,
}: EpisodeFormDialogProps) {
  const selectedChapters = chapters.filter((ch) => ch.selected)
  const [chapterId, setChapterId] = useState(episode?.chapterId || selectedChapters[0]?.id || "")
  const [index, setIndex] = useState<number>(episode?.index ?? (totalEpisodes + 1))
  const [title, setTitle] = useState(episode?.title || "")
  const [synopsis, setSynopsis] = useState(episode?.synopsis || "")
  const [keyConflict, setKeyConflict] = useState(episode?.keyConflict || "")
  const [cliffhanger, setCliffhanger] = useState(episode?.cliffhanger || "")
  const [duration, setDuration] = useState(episode?.duration || "60s")

  const handleSave = () => {
    onSave({
      chapterId,
      index,
      title,
      synopsis,
      keyConflict,
      cliffhanger,
      duration,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{episode ? "编辑分集" : "添加分集"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">归属章节</label>
              <Select value={chapterId} onValueChange={setChapterId}>
                <SelectTrigger>
                  <SelectValue placeholder="选择章节" />
                </SelectTrigger>
                <SelectContent>
                  {selectedChapters.map((ch) => (
                    <SelectItem key={ch.id} value={ch.id}>
                      {ch.title || `第${ch.index + 1}章`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">第几集</label>
              <Input
                type="number"
                min={1}
                value={index}
                onChange={(e) => setIndex(parseInt(e.target.value) || 1)}
                placeholder="集数编号"
              />
              <p className="text-[11px] text-muted-foreground mt-0.5">允许重复集数，便于对比不同版本</p>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">集标题</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="第X集 · 标题" />
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={!chapterId || !title.trim()}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
