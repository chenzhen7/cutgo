"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Users, MapPin, Box, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type {
  Script,
  AssetCharacter,
  AssetScene,
  AssetProp,
} from "@/lib/types"

interface ScriptAssetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  script: Script
  projectId: string
  onSave: (data: {
    characters: string
    location: string | undefined
    props: string
  }) => void
}

type AssetTab = "characters" | "location" | "props"

function parseJsonArray(val: string | null | undefined): string[] {
  if (!val) return []
  try {
    const parsed = JSON.parse(val)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function ScriptAssetDialog({
  open,
  onOpenChange,
  script,
  projectId,
  onSave,
}: ScriptAssetDialogProps) {
  const [tab, setTab] = useState<AssetTab>("characters")
  const [loading, setLoading] = useState(false)

  const [allCharacters, setAllCharacters] = useState<AssetCharacter[]>([])
  const [allScenes, setAllScenes] = useState<AssetScene[]>([])
  const [allProps, setAllProps] = useState<AssetProp[]>([])

  const [selectedCharNames, setSelectedCharNames] = useState<string[]>([])
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
  const [selectedPropNames, setSelectedPropNames] = useState<string[]>([])

  const fetchAssets = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/assets?projectId=${projectId}`)
      if (res.ok) {
        const data = await res.json()
        setAllCharacters(data.characters || [])
        setAllScenes(data.scenes || [])
        setAllProps(data.props || [])
      }
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    if (open) {
      fetchAssets()
      setSelectedCharNames(parseJsonArray(script.characters))
      setSelectedLocation(script.location || null)
      setSelectedPropNames(parseJsonArray(script.props))
    }
  }, [open, script, fetchAssets])

  const toggleCharacter = (name: string) => {
    setSelectedCharNames((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    )
  }

  const toggleProp = (name: string) => {
    setSelectedPropNames((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    )
  }

  const handleSave = () => {
    onSave({
      characters: JSON.stringify(selectedCharNames),
      location: selectedLocation || undefined,
      props: JSON.stringify(selectedPropNames),
    })
    onOpenChange(false)
  }

  const TABS: { key: AssetTab; label: string; icon: typeof Users; count: number }[] = [
    { key: "characters", label: "角色", icon: Users, count: selectedCharNames.length },
    { key: "location", label: "场景", icon: MapPin, count: selectedLocation ? 1 : 0 },
    { key: "props", label: "道具", icon: Box, count: selectedPropNames.length },
  ]

  const roleLabel = (role: string) => {
    switch (role) {
      case "protagonist": return "主角"
      case "supporting": return "配角"
      case "extra": return "群演"
      default: return role
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>关联资产 — {script.title}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-border -mx-6 px-6">
              {TABS.map((t) => {
                const isActive = tab === t.key
                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={cn(
                      "flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition-colors -mb-px",
                      isActive
                        ? "border-primary text-foreground font-medium"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <t.icon className="size-3.5" />
                    {t.label}
                    {t.count > 0 && (
                      <Badge variant="secondary" className="h-4 min-w-[16px] text-[10px] px-1">
                        {t.count}
                      </Badge>
                    )}
                  </button>
                )
              })}
            </div>

            <ScrollArea className="flex-1 -mx-6 px-6 min-h-0 max-h-[50vh]">
              <div className="py-3">
                {/* Characters */}
                {tab === "characters" && (
                  <div className="space-y-1.5">
                    {allCharacters.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        资产库中暂无角色，请先前往资产库添加
                      </p>
                    ) : (
                      allCharacters.map((char) => {
                        const selected = selectedCharNames.includes(char.name)
                        return (
                          <button
                            key={char.id}
                            onClick={() => toggleCharacter(char.name)}
                            className={cn(
                              "w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                              selected
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-muted-foreground/30"
                            )}
                          >
                            <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                              {char.imageUrl ? (
                                <img
                                  src={char.imageUrl}
                                  alt={char.name}
                                  className="h-9 w-9 rounded-full object-cover"
                                />
                              ) : (
                                <Users className="size-4 text-muted-foreground/50" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{char.name}</span>
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                  {roleLabel(char.role)}
                                </Badge>
                              </div>
                              {char.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                  {char.description}
                                </p>
                              )}
                            </div>
                            <div className={cn(
                              "size-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                              selected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-muted-foreground/30"
                            )}>
                              {selected && <Check className="size-3" />}
                            </div>
                          </button>
                        )
                      })
                    )}
                  </div>
                )}

                {/* Location (scene asset) */}
                {tab === "location" && (
                  <div className="space-y-1.5">
                    {allScenes.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        资产库中暂无场景，请先前往资产库添加
                      </p>
                    ) : (
                      allScenes.map((sc) => {
                        const selected = selectedLocation === sc.name
                        return (
                          <button
                            key={sc.id}
                            onClick={() =>
                              setSelectedLocation(selected ? null : sc.name)
                            }
                            className={cn(
                              "w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                              selected
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-muted-foreground/30"
                            )}
                          >
                            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                              {sc.imageUrl ? (
                                <img
                                  src={sc.imageUrl}
                                  alt={sc.name}
                                  className="h-9 w-9 rounded-lg object-cover"
                                />
                              ) : (
                                <MapPin className="size-4 text-muted-foreground/50" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium">{sc.name}</span>
                              {sc.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                  {sc.description}
                                </p>
                              )}
                            </div>
                            <div className={cn(
                              "size-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                              selected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-muted-foreground/30"
                            )}>
                              {selected && <Check className="size-3" />}
                            </div>
                          </button>
                        )
                      })
                    )}
                  </div>
                )}

                {/* Props */}
                {tab === "props" && (
                  <div className="space-y-1.5">
                    {allProps.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        资产库中暂无道具，请先前往资产库添加
                      </p>
                    ) : (
                      allProps.map((prop) => {
                        const selected = selectedPropNames.includes(prop.name)
                        return (
                          <button
                            key={prop.id}
                            onClick={() => toggleProp(prop.name)}
                            className={cn(
                              "w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                              selected
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-muted-foreground/30"
                            )}
                          >
                            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                              {prop.imageUrl ? (
                                <img
                                  src={prop.imageUrl}
                                  alt={prop.name}
                                  className="h-9 w-9 rounded-lg object-cover"
                                />
                              ) : (
                                <Box className="size-4 text-muted-foreground/50" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{prop.name}</span>
                                {prop.category && (
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                    {prop.category}
                                  </Badge>
                                )}
                              </div>
                              {prop.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                  {prop.description}
                                </p>
                              )}
                            </div>
                            <div className={cn(
                              "size-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                              selected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-muted-foreground/30"
                            )}>
                              {selected && <Check className="size-3" />}
                            </div>
                          </button>
                        )
                      })
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Summary bar */}
            <div className="border-t pt-3 -mx-6 px-6">
              <div className="flex flex-wrap gap-1.5 mb-3 min-h-[24px]">
                {selectedCharNames.map((name) => (
                  <Badge key={`char-${name}`} variant="default" className="gap-1 text-xs">
                    <Users className="size-2.5" />
                    {name}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleCharacter(name)
                      }}
                      className="ml-0.5 hover:text-destructive"
                    >
                      <X className="size-2.5" />
                    </button>
                  </Badge>
                ))}
                {selectedLocation && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <MapPin className="size-2.5" />
                    {selectedLocation}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedLocation(null)
                      }}
                      className="ml-0.5 hover:text-destructive"
                    >
                      <X className="size-2.5" />
                    </button>
                  </Badge>
                )}
                {selectedPropNames.map((name) => (
                  <Badge key={`prop-${name}`} variant="outline" className="gap-1 text-xs">
                    <Box className="size-2.5" />
                    {name}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleProp(name)
                      }}
                      className="ml-0.5 hover:text-destructive"
                    >
                      <X className="size-2.5" />
                    </button>
                  </Badge>
                ))}
                {selectedCharNames.length === 0 &&
                  !selectedLocation &&
                  selectedPropNames.length === 0 && (
                    <span className="text-xs text-muted-foreground">暂未关联任何资产</span>
                  )}
              </div>
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
