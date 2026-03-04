"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TabSynopsis } from "./tab-synopsis"
import { TabCharacters } from "./tab-characters"
import { TabPlotEvents } from "./tab-plot-events"
import { TabChapters } from "./tab-chapters"
import type { Novel, Chapter, NovelCharacter, PlotEvent, CharacterInput, EventInput } from "@/lib/types"

interface AnalysisResultPanelProps {
  novel: Novel
  chapters: Chapter[]
  characters: NovelCharacter[]
  events: PlotEvent[]
  onUpdateSynopsis: (synopsis: string) => Promise<void>
  onAddCharacter: (data: CharacterInput) => Promise<void>
  onUpdateCharacter: (id: string, data: Partial<CharacterInput>) => Promise<void>
  onDeleteCharacter: (id: string) => Promise<void>
  onAddEvent: (data: EventInput) => Promise<void>
  onUpdateEvent: (id: string, data: Partial<EventInput>) => Promise<void>
  onDeleteEvent: (id: string) => Promise<void>
  onToggleChapter: (chapterId: string, selected: boolean) => void
  onToggleAllChapters: (selected: boolean) => void
}

export function AnalysisResultPanel({
  novel,
  chapters,
  characters,
  events,
  onUpdateSynopsis,
  onAddCharacter,
  onUpdateCharacter,
  onDeleteCharacter,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  onToggleChapter,
  onToggleAllChapters,
}: AnalysisResultPanelProps) {
  return (
    <Card>
      <CardHeader className="pb-0">
        <Tabs defaultValue="synopsis">
          <TabsList className="w-full">
            <TabsTrigger value="synopsis">
              故事大纲
            </TabsTrigger>
            <TabsTrigger value="characters">
              角色列表 ({characters.length})
            </TabsTrigger>
            <TabsTrigger value="events">
              剧情结构 ({events.length})
            </TabsTrigger>
            <TabsTrigger value="chapters">
              章节段落 ({chapters.length})
            </TabsTrigger>
          </TabsList>

          <CardContent className="px-0 pt-4">
            <TabsContent value="synopsis">
              <TabSynopsis
                synopsis={novel.synopsis}
                onUpdate={onUpdateSynopsis}
              />
            </TabsContent>

            <TabsContent value="characters">
              <TabCharacters
                characters={characters}
                onAdd={onAddCharacter}
                onUpdate={onUpdateCharacter}
                onDelete={onDeleteCharacter}
              />
            </TabsContent>

            <TabsContent value="events">
              <TabPlotEvents
                events={events}
                onAdd={onAddEvent}
                onUpdate={onUpdateEvent}
                onDelete={onDeleteEvent}
              />
            </TabsContent>

            <TabsContent value="chapters">
              <TabChapters
                chapters={chapters}
                onToggle={onToggleChapter}
                onToggleAll={onToggleAllChapters}
              />
            </TabsContent>
          </CardContent>
        </Tabs>
      </CardHeader>
    </Card>
  )
}
