"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Plus, Pencil, Trash2, Star, GripVertical } from "lucide-react"
import type { PlotEvent, EventInput } from "@/lib/types"

const TYPE_CONFIG = {
  setup: { label: "起因", color: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400" },
  rising: { label: "发展", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
  climax: { label: "高潮", color: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400" },
  resolution: { label: "结局", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" },
} as const

const EMOTIONS = ["平静", "紧张", "悲伤", "激昂", "温馨", "恐惧", "愤怒", "喜悦", "感动"]

interface TabPlotEventsProps {
  events: PlotEvent[]
  onAdd: (data: EventInput) => Promise<void>
  onUpdate: (id: string, data: Partial<EventInput>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

function EventForm({
  initial,
  eventCount,
  onSave,
  onCancel,
}: {
  initial?: Partial<EventInput>
  eventCount: number
  onSave: (data: EventInput) => void
  onCancel: () => void
}) {
  const [type, setType] = useState<EventInput["type"]>(initial?.type || "rising")
  const [summary, setSummary] = useState(initial?.summary || "")
  const [emotion, setEmotion] = useState(initial?.emotion || "")
  const [adaptScore, setAdaptScore] = useState(initial?.adaptScore || 3)

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="text-sm font-medium mb-1 block">事件类型</label>
        <div className="flex gap-2">
          {(["setup", "rising", "climax", "resolution"] as const).map((t) => (
            <Button
              key={t}
              variant={type === t ? "default" : "outline"}
              size="sm"
              onClick={() => setType(t)}
            >
              {TYPE_CONFIG[t].label}
            </Button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">事件摘要</label>
        <Input value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="描述事件" />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">情感标签</label>
        <div className="flex flex-wrap gap-1.5">
          {EMOTIONS.map((em) => (
            <Button
              key={em}
              variant={emotion === em ? "default" : "outline"}
              size="sm"
              className="text-xs h-7 px-2"
              onClick={() => setEmotion(em === emotion ? "" : em)}
            >
              {em}
            </Button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">改编价值 ({adaptScore}/5)</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <button key={s} onClick={() => setAdaptScore(s)} className="focus:outline-none">
              <Star
                className={`size-5 ${s <= adaptScore ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
              />
            </button>
          ))}
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>取消</Button>
        <Button
          disabled={!summary.trim()}
          onClick={() =>
            onSave({
              index: initial?.index ?? eventCount,
              type,
              summary: summary.trim(),
              emotion: emotion || undefined,
              adaptScore,
              isHighlight: type === "climax",
            })
          }
        >
          保存
        </Button>
      </DialogFooter>
    </div>
  )
}

export function TabPlotEvents({ events, onAdd, onUpdate, onDelete }: TabPlotEventsProps) {
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const editingEvent = events.find((e) => e.id === editingId)

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground">
          共 {events.length} 个剧情事件
        </p>
        <Button size="sm" variant="outline" onClick={() => setShowAdd(true)}>
          <Plus className="size-3.5" />
          添加事件
        </Button>
      </div>

      {events.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
          暂无剧情事件
        </div>
      ) : (
        <ScrollArea className="max-h-[400px] overflow-y-auto">
          <div className="relative flex flex-col gap-0">
            {/* Timeline line */}
            <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-border" />

            {events.map((evt, i) => {
              const cfg = TYPE_CONFIG[evt.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.rising
              return (
                <div key={evt.id} className="relative flex gap-3 pb-4 group">
                  {/* Timeline dot */}
                  <div className={`relative z-10 mt-1 flex size-[30px] shrink-0 items-center justify-center rounded-full border-2 border-background ${cfg.color}`}>
                    <span className="text-[10px] font-bold">{i + 1}</span>
                  </div>
                  <Card className="flex-1">
                    <CardContent className="py-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="secondary" className={`text-[10px] ${cfg.color}`}>
                              {cfg.label}
                            </Badge>
                            {evt.emotion && (
                              <Badge variant="outline" className="text-[10px]">
                                {evt.emotion}
                              </Badge>
                            )}
                            {evt.isHighlight && (
                              <Badge className="text-[10px] bg-rose-500">
                                高潮点
                              </Badge>
                            )}
                            {evt.adaptScore && (
                              <span className="flex items-center gap-0.5">
                                {Array.from({ length: evt.adaptScore }).map((_, j) => (
                                  <Star key={j} className="size-3 fill-amber-400 text-amber-400" />
                                ))}
                              </span>
                            )}
                          </div>
                          <p className="text-sm mt-1.5">{evt.summary}</p>
                          {evt.detail && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {evt.detail}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                          <Button variant="ghost" size="icon-sm" onClick={() => setEditingId(evt.id)}>
                            <Pencil className="size-3" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" onClick={() => onDelete(evt.id)}>
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加剧情事件</DialogTitle>
          </DialogHeader>
          <EventForm
            eventCount={events.length}
            onSave={async (data) => {
              await onAdd(data)
              setShowAdd(false)
            }}
            onCancel={() => setShowAdd(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingId} onOpenChange={(open) => !open && setEditingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑事件</DialogTitle>
          </DialogHeader>
          {editingEvent && (
            <EventForm
              eventCount={events.length}
              initial={{
                index: editingEvent.index,
                type: editingEvent.type,
                summary: editingEvent.summary,
                emotion: editingEvent.emotion || "",
                adaptScore: editingEvent.adaptScore || 3,
                isHighlight: editingEvent.isHighlight,
              }}
              onSave={async (data) => {
                await onUpdate(editingId!, data)
                setEditingId(null)
              }}
              onCancel={() => setEditingId(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
