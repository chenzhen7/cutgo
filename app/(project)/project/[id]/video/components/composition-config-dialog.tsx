"use client"

import { useState } from "react"
import { useVideoStore } from "@/store/video-store"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SubtitleConfigTab } from "./subtitle-config-tab"
import { TtsConfigTab } from "./tts-config-tab"
import { BgmConfigTab } from "./bgm-config-tab"
import { OutputConfigTab } from "./output-config-tab"
import { toast } from "sonner"

interface CompositionConfigDialogProps {
  open: boolean
  onClose: () => void
}

export function CompositionConfigDialog({ open, onClose }: CompositionConfigDialogProps) {
  const { resetDraftConfig } = useVideoStore()
  const [activeTab, setActiveTab] = useState("subtitle")

  const handleSave = () => {
    toast.success("配置已保存")
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>合成配置</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-4 shrink-0">
            <TabsTrigger value="subtitle">字幕</TabsTrigger>
            <TabsTrigger value="tts">配音</TabsTrigger>
            <TabsTrigger value="bgm">BGM</TabsTrigger>
            <TabsTrigger value="output">输出</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4 pr-1">
            <TabsContent value="subtitle" className="mt-0">
              <SubtitleConfigTab />
            </TabsContent>
            <TabsContent value="tts" className="mt-0">
              <TtsConfigTab />
            </TabsContent>
            <TabsContent value="bgm" className="mt-0">
              <BgmConfigTab />
            </TabsContent>
            <TabsContent value="output" className="mt-0">
              <OutputConfigTab />
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="mt-4 shrink-0">
          <Button
            variant="ghost"
            className="mr-auto text-muted-foreground"
            onClick={() => {
              resetDraftConfig()
              toast.info("已恢复默认配置")
            }}
          >
            恢复默认
          </Button>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={handleSave}>保存配置</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
