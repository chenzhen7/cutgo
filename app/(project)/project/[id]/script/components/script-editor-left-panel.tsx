"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Check, X, Pencil, MapPin, User, Package, ListOrdered, School } from "lucide-react"
import type { AssetCharacter, AssetProp, AssetScene, Episode } from "@/lib/types"
import type { KeyboardEvent, RefObject } from "react"

interface ScriptEditorLeftPanelProps {
  episode: Episode
  assetCharacters: AssetCharacter[]
  assetScenes: AssetScene[]
  assetProps: AssetProp[]
  characterIds: string[]
  sceneIds: string[]
  propIds: string[]
  boundCharacters: AssetCharacter[]
  boundScenes: AssetScene[]
  boundProps: AssetProp[]
  editingOutline: boolean
  outlineValue: string
  goldenHookValue: string
  keyConflictValue: string
  cliffhangerValue: string
  savingOutline: boolean
  outlineRef: RefObject<HTMLTextAreaElement | null>
  onToggleCharacter: (id: string) => Promise<void>
  onToggleScene: (id: string) => Promise<void>
  onToggleProp: (id: string) => Promise<void>
  onPickCharacter: (character: AssetCharacter) => void
  onPickScene: (scene: AssetScene) => void
  onPickProp: (prop: AssetProp) => void
  onOutlineEdit: () => void
  onOutlineSave: () => Promise<void>
  onOutlineCancel: () => void
  onOutlineKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void
  onOutlineValueChange: (value: string) => void
  onGoldenHookChange: (value: string) => void
  onKeyConflictChange: (value: string) => void
  onCliffhangerChange: (value: string) => void
  canUpdateEpisode: boolean
}

export function ScriptEditorLeftPanel({
  episode,
  assetCharacters,
  assetScenes,
  assetProps,
  characterIds,
  sceneIds,
  propIds,
  boundCharacters,
  boundScenes,
  boundProps,
  editingOutline,
  outlineValue,
  goldenHookValue,
  keyConflictValue,
  cliffhangerValue,
  savingOutline,
  outlineRef,
  onToggleCharacter,
  onToggleScene,
  onToggleProp,
  onPickCharacter,
  onPickScene,
  onPickProp,
  onOutlineEdit,
  onOutlineSave,
  onOutlineCancel,
  onOutlineKeyDown,
  onOutlineValueChange,
  onGoldenHookChange,
  onKeyConflictChange,
  onCliffhangerChange,
  canUpdateEpisode,
}: ScriptEditorLeftPanelProps) {
  return (
    <div className="flex flex-col h-full overflow-y-auto bg-muted/5">
      <div className="mb-4 space-y-2.5">
        <div className="px-4 py-2 bg-muted/20 border-b flex items-center justify-between">
          <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
            <School className="size-3" />
            关联资产
          </Label>
        </div>
        <div className="grid grid-cols-3 gap-3 px-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <MapPin className="size-3 text-muted-foreground" />
                <span className="text-[11px] font-medium">场景</span>
                {sceneIds.length > 0 && <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5 leading-none">{sceneIds.length}</Badge>}
              </div>
              <Popover>
                <PopoverTrigger asChild><Button variant="ghost" size="sm" className="h-5 text-[9px] px-1.5">编辑</Button></PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="start">
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {assetScenes.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2 text-center">暂无场景资产</p>
                    ) : (
                      assetScenes.map((s) => (
                        <label key={s.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted cursor-pointer transition-colors">
                          <Checkbox checked={sceneIds.includes(s.id)} onCheckedChange={() => void onToggleScene(s.id)} />
                          <div className="flex items-center gap-2 min-w-0">
                            {s.imageUrl ? <img src={s.imageUrl} alt="" className="size-5 rounded object-cover shrink-0" /> : <div className="size-5 rounded bg-muted-foreground/10 flex items-center justify-center shrink-0"><MapPin className="size-3 text-muted-foreground" /></div>}
                            <span className="text-[11px] truncate">{s.name}</span>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            {boundScenes.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {boundScenes.map((s) => (
                  <div key={s.id} className="flex flex-col items-center gap-1">
                    <button onClick={() => onPickScene(s)} className="aspect-[16/10] w-full rounded-md overflow-hidden bg-muted border hover:ring-2 hover:ring-primary/40 transition-all" title={s.name}>
                      {s.imageUrl ? <img src={s.imageUrl} alt={s.name} className="size-full object-cover" /> : <div className="size-full flex items-center justify-center"><MapPin className="size-4 text-muted-foreground/40" /></div>}
                    </button>
                    <span className="text-[9px] text-muted-foreground truncate w-full text-center px-0.5">{s.name}</span>
                  </div>
                ))}
              </div>
            ) : <div className="h-12 rounded-lg border border-dashed border-muted-foreground/15 flex items-center justify-center"><p className="text-[10px] text-muted-foreground/40 italic">未绑定</p></div>}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <User className="size-3 text-muted-foreground" />
                <span className="text-[11px] font-medium">角色</span>
                {characterIds.length > 0 && <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5 leading-none">{characterIds.length}</Badge>}
              </div>
              <Popover>
                <PopoverTrigger asChild><Button variant="ghost" size="sm" className="h-5 text-[9px] px-1.5">编辑</Button></PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="start">
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {assetCharacters.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2 text-center">暂无角色资产</p>
                    ) : (
                      assetCharacters.map((c) => (
                        <label key={c.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted cursor-pointer transition-colors">
                          <Checkbox checked={characterIds.includes(c.id)} onCheckedChange={() => void onToggleCharacter(c.id)} />
                          <div className="flex items-center gap-2 min-w-0">
                            {c.imageUrl ? <img src={c.imageUrl} alt="" className="size-5 rounded-full object-cover shrink-0" /> : <div className="size-5 rounded-full bg-muted-foreground/10 flex items-center justify-center shrink-0"><User className="size-3 text-muted-foreground" /></div>}
                            <span className="text-[11px] truncate">{c.name}</span>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            {boundCharacters.length > 0 ? (
              <div className="grid grid-cols-3 gap-1.5">
                {boundCharacters.map((c) => (
                  <div key={c.id} className="flex flex-col items-center gap-1">
                    <button onClick={() => onPickCharacter(c)} className="aspect-square w-full rounded-md overflow-hidden bg-muted border hover:ring-2 hover:ring-primary/40 transition-all" title={c.name}>
                      {c.imageUrl ? <img src={c.imageUrl} alt={c.name} className="size-full object-cover" /> : <div className="size-full flex items-center justify-center"><User className="size-4 text-muted-foreground/40" /></div>}
                    </button>
                    <span className="text-[9px] text-muted-foreground truncate w-full text-center px-0.5">{c.name}</span>
                  </div>
                ))}
              </div>
            ) : <div className="h-12 rounded-lg border border-dashed border-muted-foreground/15 flex items-center justify-center"><p className="text-[10px] text-muted-foreground/40 italic">未绑定</p></div>}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Package className="size-3 text-muted-foreground" />
                <span className="text-[11px] font-medium">道具</span>
                {propIds.length > 0 && <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5 leading-none">{propIds.length}</Badge>}
              </div>
              <Popover>
                <PopoverTrigger asChild><Button variant="ghost" size="sm" className="h-5 text-[9px] px-1.5">编辑</Button></PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="start">
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {assetProps.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2 text-center">暂无道具资产</p>
                    ) : (
                      assetProps.map((p) => (
                        <label key={p.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted cursor-pointer transition-colors">
                          <Checkbox checked={propIds.includes(p.id)} onCheckedChange={() => void onToggleProp(p.id)} />
                          <div className="flex items-center gap-2 min-w-0">
                            {p.imageUrl ? <img src={p.imageUrl} alt="" className="size-5 rounded object-cover shrink-0" /> : <div className="size-5 rounded bg-muted-foreground/10 flex items-center justify-center shrink-0"><Package className="size-3 text-muted-foreground" /></div>}
                            <span className="text-[11px] truncate">{p.name}</span>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            {boundProps.length > 0 ? (
              <div className="grid grid-cols-4 gap-1.5">
                {boundProps.map((p) => (
                  <div key={p.id} className="flex flex-col items-center gap-1">
                    <button onClick={() => onPickProp(p)} className="aspect-square w-full rounded-md overflow-hidden bg-muted border hover:ring-2 hover:ring-primary/40 transition-all" title={p.name}>
                      {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="size-full object-cover" /> : <div className="size-full flex items-center justify-center"><Package className="size-4 text-muted-foreground/40" /></div>}
                    </button>
                    <span className="text-[9px] text-muted-foreground truncate w-full text-center px-0.5">{p.name}</span>
                  </div>
                ))}
              </div>
            ) : <div className="h-12 rounded-lg border border-dashed border-muted-foreground/15 flex items-center justify-center"><p className="text-[10px] text-muted-foreground/40 italic">未绑定</p></div>}
          </div>
        </div>
      </div>

      <div className="shrink-0 space-y-4 pb-6">
        <div className="px-4 py-2 bg-muted/20 border-y flex items-center justify-between">
          <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
            <ListOrdered className="size-3" />
            分集大纲
          </Label>
          {!editingOutline && canUpdateEpisode && (
            <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 gap-1 text-primary hover:text-primary hover:bg-primary/5" onClick={onOutlineEdit}>
              <Pencil className="size-3" />
              编辑大纲
            </Button>
          )}
        </div>

        <div className="px-4 group/outline relative">
          <div className="flex items-center justify-between mb-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">大纲详情</Label>
          </div>
          {editingOutline ? (
            <Textarea
              ref={outlineRef}
              value={outlineValue}
              onChange={(e) => onOutlineValueChange(e.target.value)}
              onKeyDown={onOutlineKeyDown}
              placeholder="详细的情节发展..."
              className="min-h-[120px] resize-none text-xs leading-relaxed border-primary/20 focus-visible:ring-1 focus-visible:ring-primary/40"
            />
          ) : (
            <div className="min-h-[1.5rem]">
              {episode.outline?.trim() ? (
                <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">{episode.outline}</p>
              ) : (
                <p className="text-[11px] text-muted-foreground/50 italic">未设置大纲</p>
              )}
            </div>
          )}
        </div>

        <div className="px-4 grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-semibold text-amber-600 dark:text-amber-400">黄金钩子</Label>
            {editingOutline ? (
              <Textarea value={goldenHookValue} onChange={(e) => onGoldenHookChange(e.target.value)} onKeyDown={onOutlineKeyDown} placeholder="开篇吸睛点..." className="min-h-[80px] resize-none text-xs leading-relaxed border-primary/20 focus-visible:ring-1 focus-visible:ring-primary/40" />
            ) : (
              <div className="min-h-[1.25rem]">{episode.goldenHook?.trim() ? <p className="text-xs leading-relaxed text-foreground/90 whitespace-pre-wrap">{episode.goldenHook}</p> : <p className="text-[11px] text-muted-foreground/50 italic">未设置</p>}</div>
            )}
          </div>
          <div>
            <Label className="text-xs font-semibold text-rose-600 dark:text-rose-400">核心冲突</Label>
            {editingOutline ? (
              <Textarea value={keyConflictValue} onChange={(e) => onKeyConflictChange(e.target.value)} onKeyDown={onOutlineKeyDown} placeholder="主要矛盾点..." className="min-h-[80px] resize-none text-xs leading-relaxed border-primary/20 focus-visible:ring-1 focus-visible:ring-primary/40" />
            ) : (
              <div className="min-h-[1.25rem]">{episode.keyConflict?.trim() ? <p className="text-xs leading-relaxed text-foreground/90 whitespace-pre-wrap">{episode.keyConflict}</p> : <p className="text-[11px] text-muted-foreground/50 italic">未设置</p>}</div>
            )}
          </div>
        </div>

        <div className="px-4">
          <Label className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">结尾悬念</Label>
          {editingOutline ? (
            <Textarea value={cliffhangerValue} onChange={(e) => onCliffhangerChange(e.target.value)} onKeyDown={onOutlineKeyDown} placeholder="如何引导下一集？" className="min-h-[60px] resize-none text-xs leading-relaxed border-primary/20 focus-visible:ring-1 focus-visible:ring-primary/40" />
          ) : (
            <div className="min-h-[1.25rem]">{episode.cliffhanger?.trim() ? <p className="text-xs leading-relaxed text-foreground/90 whitespace-pre-wrap">{episode.cliffhanger}</p> : <p className="text-[11px] text-muted-foreground/50 italic">未设置悬念</p>}</div>
          )}
        </div>

        {editingOutline && (
          <div className="px-4 flex items-center gap-1.5 justify-end mt-2">
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground" disabled={savingOutline} onClick={onOutlineCancel}>
              <X className="size-3 mr-1" />
              取消
            </Button>
            <Button size="sm" className="h-6 px-2 text-xs" disabled={savingOutline} onClick={() => void onOutlineSave()}>
              <Check className="size-3 mr-1" />
              {savingOutline ? "保存中..." : "保存"}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
