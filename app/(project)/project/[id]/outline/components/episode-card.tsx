"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Pencil,
  Trash2,
  Clock,
  Film,
  ChevronDown,
  ChevronRight,
  Plus,
  BookOpen,
} from "lucide-react"
import type { Episode, SceneInput } from "@/lib/types"
import { SceneList } from "./scene-list"
import { SceneFormDialog } from "./scene-form-dialog"

interface EpisodeCardProps {
  episode: Episode
  onEdit: () => void
  onDelete: () => void
  onAddScene: (data: SceneInput) => void
  onUpdateScene: (sceneId: string, data: Partial<SceneInput>) => void
  onDeleteScene: (sceneId: string) => void
}

export function EpisodeCard({
  episode,
  onEdit,
  onDelete,
  onAddScene,
  onUpdateScene,
  onDeleteScene,
}: EpisodeCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [showAddScene, setShowAddScene] = useState(false)

  return (
    <Card className="group">
      <CardContent className="pt-4 pb-3">
        <div className="flex items-start gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm mt-0.5">
            {episode.index}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-sm">{episode.title}</h4>
                <Badge variant="secondary" className="gap-1 text-[10px] px-1.5">
                  <BookOpen className="size-2.5" />
                  {episode.chapter?.title || `第${(episode.chapter?.index ?? 0) + 1}章`}
                </Badge>
              </div>
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
                {episode.scenes.length} 场
              </Badge>
              {episode.keyConflict && (
                <Badge variant="outline" className="text-xs">
                  冲突: {episode.keyConflict}
                </Badge>
              )}
            </div>

            {episode.cliffhanger && (
              <div className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                钩子: {episode.cliffhanger}
              </div>
            )}

            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {expanded ? (
                  <ChevronDown className="size-3.5" />
                ) : (
                  <ChevronRight className="size-3.5" />
                )}
                {episode.scenes.length} 个场景
              </button>
              {expanded && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 text-xs px-1.5"
                  onClick={() => setShowAddScene(true)}
                >
                  <Plus className="size-3" />
                  添加
                </Button>
              )}
            </div>

            {expanded && (
              <SceneList
                scenes={episode.scenes}
                onUpdate={onUpdateScene}
                onDelete={onDeleteScene}
              />
            )}
          </div>
        </div>
      </CardContent>

      <SceneFormDialog
        open={showAddScene}
        onOpenChange={setShowAddScene}
        onSave={(data) => {
          onAddScene(data)
          setShowAddScene(false)
        }}
      />
    </Card>
  )
}
