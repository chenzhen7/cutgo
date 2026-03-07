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
  FolderOpen,
  Users,
  Box,
} from "lucide-react"
import type { ScriptSceneData, ScriptSceneInput, ScriptLineInput } from "@/lib/types"
import { ScriptLineItem } from "./script-line-item"
import { ScriptLineFormDialog } from "./script-line-form-dialog"
import { ScriptSceneFormDialog } from "./script-scene-form-dialog"
import { SceneAssetDialog } from "./scene-asset-dialog"

function parseJsonArray(val: string | null | undefined): string[] {
  if (!val) return []
  try {
    const parsed = JSON.parse(val)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

interface ScriptSceneCardProps {
  scene: ScriptSceneData
  sceneNumber: number
  projectId: string
  onUpdateScene: (data: Partial<ScriptSceneInput>) => void
  onDeleteScene: () => void
  onAddLine: (data: ScriptLineInput) => void
  onUpdateLine: (lineId: string, data: Partial<ScriptLineInput>) => void
  onDeleteLine: (lineId: string) => void
}

export function ScriptSceneCard({
  scene,
  sceneNumber,
  projectId,
  onUpdateScene,
  onDeleteScene,
  onAddLine,
  onUpdateLine,
  onDeleteLine,
}: ScriptSceneCardProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [showAddLine, setShowAddLine] = useState(false)
  const [showEditScene, setShowEditScene] = useState(false)
  const [showAssetDialog, setShowAssetDialog] = useState(false)
  const [insertAfterLineId, setInsertAfterLineId] = useState<string | undefined>()

  const charNames = parseJsonArray(scene.characters)
  const propNames = parseJsonArray(scene.props)

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
                onClick={() => setShowAssetDialog(true)}
                title="编辑资产"
              >
                <FolderOpen className="size-3" />
              </Button>
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

          {/* Asset tags */}
          {(charNames.length > 0 || propNames.length > 0) && (
            <div className="flex items-center gap-1.5 flex-wrap mb-2">
              {charNames.map((name) => (
                <Badge key={name} variant="default" className="gap-1 text-[10px] px-1.5 py-0">
                  <Users className="size-2.5" />
                  {name}
                </Badge>
              ))}
              {propNames.map((name) => (
                <Badge key={name} variant="outline" className="gap-1 text-[10px] px-1.5 py-0">
                  <Box className="size-2.5" />
                  {name}
                </Badge>
              ))}
            </div>
          )}

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

      <SceneAssetDialog
        open={showAssetDialog}
        onOpenChange={setShowAssetDialog}
        scene={scene}
        projectId={projectId}
        onSave={(data) => {
          onUpdateScene({
            characters: data.characters,
            location: data.location,
            props: data.props,
          })
        }}
      />
    </>
  )
}
