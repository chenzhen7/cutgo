"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, FileText } from "lucide-react"
import type { Script, ScriptSceneInput, ScriptLineInput } from "@/lib/types"
import { ScriptSceneCard } from "./script-scene-card"
import { ScriptSceneFormDialog } from "./script-scene-form-dialog"

interface ScriptEditorProps {
  script: Script
  onAddScene: (data: ScriptSceneInput) => void
  onUpdateScene: (sceneId: string, data: Partial<ScriptSceneInput>) => void
  onDeleteScene: (sceneId: string) => void
  onAddLine: (sceneId: string, data: ScriptLineInput) => void
  onUpdateLine: (sceneId: string, lineId: string, data: Partial<ScriptLineInput>) => void
  onDeleteLine: (sceneId: string, lineId: string) => void
}

export function ScriptEditor({
  script,
  onAddScene,
  onUpdateScene,
  onDeleteScene,
  onAddLine,
  onUpdateLine,
  onDeleteLine,
}: ScriptEditorProps) {
  const [showAddScene, setShowAddScene] = useState(false)

  if (script.scenes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <FileText className="size-12 text-muted-foreground mb-4" />
        <h3 className="text-base font-medium mb-2">暂无场景</h3>
        <p className="text-sm text-muted-foreground mb-4">
          该集剧本尚无场景内容，点击下方按钮添加
        </p>
        <Button onClick={() => setShowAddScene(true)}>
          <Plus className="size-4" />
          添加场景
        </Button>
        <ScriptSceneFormDialog
          open={showAddScene}
          onOpenChange={setShowAddScene}
          onSave={(data) => {
            onAddScene(data)
            setShowAddScene(false)
          }}
        />
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-4 p-4">
        {/* Episode title header */}
        <div className="flex items-center gap-2 pb-2 border-b">
          <span className="text-xs font-bold text-primary bg-primary/10 rounded px-2 py-0.5">
            第{script.episode.index}集
          </span>
          <h3 className="text-sm font-semibold">{script.title}</h3>
          <span className="text-xs text-muted-foreground ml-auto">
            {script.scenes.length} 场景 · {script.scenes.reduce((s, sc) => s + sc.lines.length, 0)} 行
          </span>
        </div>

        {script.scenes
          .sort((a, b) => a.index - b.index)
          .map((scene, idx) => (
            <ScriptSceneCard
              key={scene.id}
              scene={scene}
              sceneNumber={idx + 1}
              onUpdateScene={(data) => onUpdateScene(scene.id, data)}
              onDeleteScene={() => onDeleteScene(scene.id)}
              onAddLine={(data) => onAddLine(scene.id, data)}
              onUpdateLine={(lineId, data) => onUpdateLine(scene.id, lineId, data)}
              onDeleteLine={(lineId) => onDeleteLine(scene.id, lineId)}
            />
          ))}

        <Button
          variant="outline"
          className="w-full border-dashed"
          onClick={() => setShowAddScene(true)}
        >
          <Plus className="size-4" />
          添加场景
        </Button>
      </div>

      <ScriptSceneFormDialog
        open={showAddScene}
        onOpenChange={setShowAddScene}
        onSave={(data) => {
          onAddScene(data)
          setShowAddScene(false)
        }}
      />
    </ScrollArea>
  )
}
