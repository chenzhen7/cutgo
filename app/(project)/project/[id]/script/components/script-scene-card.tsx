"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Pencil,
  Trash2,
  Plus,
  ChevronDown,
  ChevronRight,
  Clock,
  MapPin,
  Music,
  Heart,
} from "lucide-react"
import type { ScriptSceneData, ScriptSceneInput, ScriptLineInput } from "@/lib/types"
import { ScriptLineItem } from "./script-line-item"
import { ScriptLineFormDialog } from "./script-line-form-dialog"
import { ScriptSceneFormDialog } from "./script-scene-form-dialog"

interface ScriptSceneCardProps {
  scene: ScriptSceneData
  sceneNumber: number
  onUpdateScene: (data: Partial<ScriptSceneInput>) => void
  onDeleteScene: () => void
  onAddLine: (data: ScriptLineInput) => void
  onUpdateLine: (lineId: string, data: Partial<ScriptLineInput>) => void
  onDeleteLine: (lineId: string) => void
}

export function ScriptSceneCard({
  scene,
  sceneNumber,
  onUpdateScene,
  onDeleteScene,
  onAddLine,
  onUpdateLine,
  onDeleteLine,
}: ScriptSceneCardProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [showAddLine, setShowAddLine] = useState(false)
  const [showEditScene, setShowEditScene] = useState(false)
  const [insertAfterLineId, setInsertAfterLineId] = useState<string | undefined>()

  return (
    <>
      <Card className="group/scene">
        <CardContent className="pt-3 pb-2">
          {/* Scene header */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="flex items-center gap-1 text-sm font-semibold text-foreground hover:text-primary transition-colors"
              >
                {collapsed ? (
                  <ChevronRight className="size-4" />
                ) : (
                  <ChevronDown className="size-4" />
                )}
                场景 {sceneNumber}：{scene.title}
              </button>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover/scene:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowEditScene(true)}
              >
                <Pencil className="size-3" />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={onDeleteScene}>
                <Trash2 className="size-3" />
              </Button>
            </div>
          </div>

          {/* Scene info bar */}
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <Badge variant="secondary" className="gap-1 text-[10px] px-1.5">
              <Clock className="size-2.5" />
              {scene.duration}
            </Badge>
            {scene.emotion && (
              <Badge variant="secondary" className="gap-1 text-[10px] px-1.5">
                <Heart className="size-2.5" />
                {scene.emotion}
              </Badge>
            )}
            {scene.bgm && (
              <Badge variant="outline" className="gap-1 text-[10px] px-1.5">
                <Music className="size-2.5" />
                {scene.bgm}
              </Badge>
            )}
            {scene.location && (
              <Badge variant="outline" className="gap-1 text-[10px] px-1.5">
                <MapPin className="size-2.5" />
                {scene.location}
              </Badge>
            )}
          </div>

          {scene.description && !collapsed && (
            <p className="text-xs text-muted-foreground mb-3 italic">
              {scene.description}
            </p>
          )}

          {/* Lines */}
          {!collapsed && (
            <div className="flex flex-col gap-1.5">
              {scene.lines.map((line) => (
                <ScriptLineItem
                  key={line.id}
                  line={line}
                  onUpdate={(data) => onUpdateLine(line.id, data)}
                  onDelete={() => onDeleteLine(line.id)}
                />
              ))}

              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs w-full border border-dashed mt-1"
                onClick={() => {
                  setInsertAfterLineId(undefined)
                  setShowAddLine(true)
                }}
              >
                <Plus className="size-3" />
                添加行
              </Button>
            </div>
          )}

          {collapsed && (
            <p className="text-xs text-muted-foreground">
              {scene.lines.length} 行内容
            </p>
          )}
        </CardContent>
      </Card>

      <ScriptLineFormDialog
        open={showAddLine}
        onOpenChange={setShowAddLine}
        insertAfter={insertAfterLineId}
        onSave={(data) => {
          onAddLine(data)
          setShowAddLine(false)
        }}
      />

      <ScriptSceneFormDialog
        open={showEditScene}
        onOpenChange={setShowEditScene}
        scene={scene}
        onSave={(data) => {
          onUpdateScene(data)
          setShowEditScene(false)
        }}
      />
    </>
  )
}
