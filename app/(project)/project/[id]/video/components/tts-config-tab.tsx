"use client"

import { useVideoStore } from "@/store/video-store"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Play, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

const SPEED_OPTIONS = [
  { value: "0.5", label: "0.5x" },
  { value: "0.75", label: "0.75x" },
  { value: "1.0", label: "1.0x（默认）" },
  { value: "1.25", label: "1.25x" },
  { value: "1.5", label: "1.5x" },
  { value: "2.0", label: "2.0x" },
]

export function TtsConfigTab() {
  const { draftConfig, updateDraftConfigTts, ttsVoices, assetCharacters } = useVideoStore()
  const tts = draftConfig.tts

  const handlePreview = async (voiceId: string, text: string) => {
    try {
      const res = await fetch("/api/videos/tts/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voiceId, speed: tts.speed }),
      })
      if (!res.ok) throw new Error("试听失败")
      toast.info("TTS 试听功能需接入真实 TTS 服务")
    } catch {
      toast.error("试听失败")
    }
  }

  const addCharacterVoice = (characterName: string) => {
    updateDraftConfigTts({
      characterVoices: { ...tts.characterVoices, [characterName]: "female_gentle" },
    })
  }

  const removeCharacterVoice = (characterName: string) => {
    const newVoices = { ...tts.characterVoices }
    delete newVoices[characterName]
    updateDraftConfigTts({ characterVoices: newVoices })
  }

  const availableCharacters = assetCharacters.filter(
    (c) => !Object.keys(tts.characterVoices).includes(c.name)
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">配音开关</Label>
        <Switch
          checked={tts.enabled}
          onCheckedChange={(v) => updateDraftConfigTts({ enabled: v })}
        />
      </div>

      {tts.enabled && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">旁白声线</Label>
              <div className="flex gap-1.5">
                <Select
                  value={tts.narrationVoice}
                  onValueChange={(v) => updateDraftConfigTts({ narrationVoice: v })}
                >
                  <SelectTrigger className="h-8 flex-1 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ttsVoices.map((v) => (
                      <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => handlePreview(tts.narrationVoice, "旁白：五年后的机场，她终于回来了")}
                >
                  <Play className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">语速</Label>
              <Select
                value={String(tts.speed)}
                onValueChange={(v) => updateDraftConfigTts({ speed: Number(v) })}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SPEED_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-muted-foreground">角色声线分配</Label>
              {availableCharacters.length > 0 && (
                <Select onValueChange={addCharacterVoice}>
                  <SelectTrigger className="h-7 w-auto gap-1 border-dashed text-xs">
                    <Plus className="h-3 w-3" />
                    <SelectValue placeholder="添加角色" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCharacters.map((c) => (
                      <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {Object.entries(tts.characterVoices).length === 0 && (
              <p className="text-xs text-muted-foreground">暂无角色声线配置，点击「添加角色」分配声线</p>
            )}

            {Object.entries(tts.characterVoices).map(([name, voiceId]) => (
              <div key={name} className="flex items-center gap-2">
                <span className="w-20 shrink-0 truncate text-sm font-medium">{name}</span>
                <Select
                  value={voiceId}
                  onValueChange={(v) =>
                    updateDraftConfigTts({ characterVoices: { ...tts.characterVoices, [name]: v } })
                  }
                >
                  <SelectTrigger className="h-8 flex-1 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ttsVoices.map((v) => (
                      <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => handlePreview(voiceId, `${name}：你终于回来了`)}
                >
                  <Play className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => removeCharacterVoice(name)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
