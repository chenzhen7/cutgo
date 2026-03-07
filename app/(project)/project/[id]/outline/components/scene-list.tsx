"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2 } from "lucide-react"
import type { EpisodeScene, SceneInput } from "@/lib/types"
import { SceneFormDialog } from "./scene-form-dialog"

interface SceneListProps {
  scenes: EpisodeScene[]
  onUpdate: (sceneId: string, data: Partial<SceneInput>) => void
  onDelete: (sceneId: string) => void
}

export function SceneList({ scenes, onUpdate, onDelete }: SceneListProps) {
  const [editingScene, setEditingScene] = useState<EpisodeScene | null>(null)

  const parseCharacters = (chars: string | null): string[] => {
    if (!chars) return []
    try {
      return JSON.parse(chars)
    } catch {
      return []
    }
  }

  return (
    <>
      <div className="mt-2 flex flex-col gap-1.5 border-l-2 border-muted pl-3 ml-1">
        {scenes.map((scene) => {
          const characters = parseCharacters(scene.characters)
          return (
            <div
              key={scene.id}
              className="group/scene flex items-start gap-2 py-1.5 text-xs"
            >
              <span className="text-muted-foreground shrink-0 w-5 text-right font-mono">
                {scene.index + 1}.
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{scene.title}</span>
                  {scene.emotion && (
                    <Badge variant="outline" className="text-[10px] px-1 py-0">
                      {scene.emotion}
                    </Badge>
                  )}
                  <span className="text-muted-foreground">{scene.duration}</span>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover/scene:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="size-5"
                      onClick={() => setEditingScene(scene)}
                    >
                      <Pencil className="size-2.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="size-5"
                      onClick={() => onDelete(scene.id)}
                    >
                      <Trash2 className="size-2.5" />
                    </Button>
                  </div>
                </div>
                <p className="text-muted-foreground mt-0.5">{scene.summary}</p>
                {characters.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {characters.map((c) => (
                      <Badge key={c} variant="secondary" className="text-[10px] px-1.5 py-0">
                        {c}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {editingScene && (
        <SceneFormDialog
          open={!!editingScene}
          onOpenChange={(open) => !open && setEditingScene(null)}
          scene={editingScene}
          onSave={(data) => {
            onUpdate(editingScene.id, data)
            setEditingScene(null)
          }}
        />
      )}
    </>
  )
}
