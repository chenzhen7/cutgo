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
import { Plus, Pencil, Trash2, User, Crown, Users } from "lucide-react"
import type { NovelCharacter, CharacterInput } from "@/lib/types"

const ROLE_CONFIG = {
  protagonist: { label: "主角", icon: Crown, color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
  supporting: { label: "配角", icon: Users, color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  extra: { label: "龙套", icon: User, color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
} as const

interface TabCharactersProps {
  characters: NovelCharacter[]
  onAdd: (data: CharacterInput) => Promise<void>
  onUpdate: (id: string, data: Partial<CharacterInput>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

function CharacterForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<CharacterInput>
  onSave: (data: CharacterInput) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(initial?.name || "")
  const [role, setRole] = useState<CharacterInput["role"]>(initial?.role || "supporting")
  const [description, setDescription] = useState(initial?.description || "")

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="text-sm font-medium mb-1 block">角色名称</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="输入角色名称" />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">角色类型</label>
        <div className="flex gap-2">
          {(["protagonist", "supporting", "extra"] as const).map((r) => (
            <Button
              key={r}
              variant={role === r ? "default" : "outline"}
              size="sm"
              onClick={() => setRole(r)}
            >
              {ROLE_CONFIG[r].label}
            </Button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">角色简介</label>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="一句话描述角色"
        />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>取消</Button>
        <Button
          disabled={!name.trim()}
          onClick={() => onSave({ name: name.trim(), role, description: description || undefined })}
        >
          保存
        </Button>
      </DialogFooter>
    </div>
  )
}

export function TabCharacters({ characters, onAdd, onUpdate, onDelete }: TabCharactersProps) {
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const editingChar = characters.find((c) => c.id === editingId)

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground">
          共识别 {characters.length} 个角色
        </p>
        <Button size="sm" variant="outline" onClick={() => setShowAdd(true)}>
          <Plus className="size-3.5" />
          添加角色
        </Button>
      </div>

      {characters.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <User className="size-8 mb-2 opacity-50" />
          <p className="text-sm">未检测到角色，请手动添加</p>
        </div>
      ) : (
        <ScrollArea className="max-h-[400px] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {characters.map((char) => {
              const cfg = ROLE_CONFIG[char.role as keyof typeof ROLE_CONFIG] || ROLE_CONFIG.extra
              const Icon = cfg.icon
              return (
                <Card key={char.id} className="group">
                  <CardContent className="pt-3 pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`flex size-8 items-center justify-center rounded-full ${cfg.color}`}>
                          <Icon className="size-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-sm">{char.name}</span>
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              {cfg.label}
                            </Badge>
                          </div>
                          {char.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                              {char.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon-sm" onClick={() => setEditingId(char.id)}>
                          <Pencil className="size-3" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => onDelete(char.id)}>
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      {char.firstAppear && <span>首次出场: {char.firstAppear}</span>}
                      <span>出场 {char.frequency} 次</span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </ScrollArea>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加角色</DialogTitle>
          </DialogHeader>
          <CharacterForm
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
            <DialogTitle>编辑角色</DialogTitle>
          </DialogHeader>
          {editingChar && (
            <CharacterForm
              initial={{
                name: editingChar.name,
                role: editingChar.role,
                description: editingChar.description || "",
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
