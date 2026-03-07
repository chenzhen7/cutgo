import { create } from "zustand"
import type {
  Novel,
  Chapter,
  NovelCharacter,
  PlotEvent,
  AnalysisStatus,
  ImportNovelInput,
  CharacterInput,
  EventInput,
} from "@/lib/types"

interface ChapterInput {
  title?: string
  content?: string
}

interface NovelState {
  novel: Novel | null
  chapters: Chapter[]
  characters: NovelCharacter[]
  events: PlotEvent[]

  analysisStatus: AnalysisStatus
  analysisError: string | null

  importNovel: (data: ImportNovelInput) => Promise<Novel>
  analyzeNovel: (novelId: string) => Promise<void>
  confirmImport: (novelId: string) => Promise<void>

  fetchNovel: (projectId: string) => Promise<void>
  updateSynopsis: (novelId: string, synopsis: string) => Promise<void>

  addCharacter: (novelId: string, data: CharacterInput) => Promise<void>
  updateCharacter: (characterId: string, data: Partial<CharacterInput>) => Promise<void>
  deleteCharacter: (novelId: string, characterId: string) => Promise<void>

  addEvent: (novelId: string, data: EventInput) => Promise<void>
  updateEvent: (eventId: string, data: Partial<EventInput>) => Promise<void>
  deleteEvent: (novelId: string, eventId: string) => Promise<void>
  reorderEvents: (novelId: string, orderedIds: string[]) => Promise<void>

  addChapter: (novelId: string, data: ChapterInput) => Promise<void>
  updateChapter: (chapterId: string, data: Partial<ChapterInput>) => Promise<void>
  deleteChapter: (novelId: string, chapterId: string) => Promise<void>

  reset: () => void
}

export const useNovelStore = create<NovelState>((set, get) => ({
  novel: null,
  chapters: [],
  characters: [],
  events: [],
  analysisStatus: "idle",
  analysisError: null,

  importNovel: async (data) => {
    const res = await fetch("/api/novels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || "导入失败")
    }
    const novel = await res.json()
    set({ novel, analysisStatus: "idle", analysisError: null, chapters: [], characters: [], events: [] })
    return novel
  },

  analyzeNovel: async (novelId) => {
    set({ analysisStatus: "analyzing", analysisError: null })
    try {
      const res = await fetch(`/api/novels/${novelId}/analyze`, { method: "POST" })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "分析失败")
      }
      const data = await res.json()
      set({
        novel: { ...get().novel!, ...data, status: "analyzed" },
        chapters: data.chapters || [],
        characters: data.characters || [],
        events: data.events || [],
        analysisStatus: "completed",
      })
    } catch (err) {
      set({ analysisStatus: "error", analysisError: (err as Error).message })
    }
  },

  confirmImport: async (novelId) => {
    const res = await fetch(`/api/novels/${novelId}/confirm`, { method: "POST" })
    if (!res.ok) throw new Error("确认导入失败")
    const updated = await res.json()
    set({ novel: { ...get().novel!, ...updated, status: "confirmed" } })
  },

  fetchNovel: async (projectId) => {
    const res = await fetch(`/api/novels?projectId=${projectId}`)
    if (!res.ok) return
    const data = await res.json()
    if (!data) {
      set({ novel: null, chapters: [], characters: [], events: [], analysisStatus: "idle" })
      return
    }
    set({
      novel: data,
      chapters: data.chapters || [],
      characters: data.characters || [],
      events: data.events || [],
      analysisStatus: data.status === "analyzed" || data.status === "confirmed" ? "completed" : "idle",
    })
  },

  updateSynopsis: async (novelId, synopsis) => {
    const res = await fetch(`/api/novels/${novelId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ synopsis }),
    })
    if (!res.ok) throw new Error("更新大纲失败")
    set({ novel: { ...get().novel!, synopsis } })
  },

  addCharacter: async (novelId, data) => {
    const res = await fetch(`/api/novels/${novelId}/characters`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error("添加角色失败")
    const character = await res.json()
    set({ characters: [...get().characters, character] })
  },

  updateCharacter: async (characterId, data) => {
    const novelId = get().novel?.id
    if (!novelId) return
    const res = await fetch(`/api/novels/${novelId}/characters/${characterId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error("更新角色失败")
    const updated = await res.json()
    set({ characters: get().characters.map((c) => (c.id === characterId ? updated : c)) })
  },

  deleteCharacter: async (novelId, characterId) => {
    const res = await fetch(`/api/novels/${novelId}/characters/${characterId}`, {
      method: "DELETE",
    })
    if (!res.ok) throw new Error("删除角色失败")
    set({ characters: get().characters.filter((c) => c.id !== characterId) })
  },

  addEvent: async (novelId, data) => {
    const res = await fetch(`/api/novels/${novelId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error("添加事件失败")
    const event = await res.json()
    set({ events: [...get().events, event] })
  },

  updateEvent: async (eventId, data) => {
    const novelId = get().novel?.id
    if (!novelId) return
    const res = await fetch(`/api/novels/${novelId}/events/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error("更新事件失败")
    const updated = await res.json()
    set({ events: get().events.map((e) => (e.id === eventId ? updated : e)) })
  },

  deleteEvent: async (novelId, eventId) => {
    const res = await fetch(`/api/novels/${novelId}/events/${eventId}`, {
      method: "DELETE",
    })
    if (!res.ok) throw new Error("删除事件失败")
    set({ events: get().events.filter((e) => e.id !== eventId) })
  },

  reorderEvents: async (novelId, orderedIds) => {
    const res = await fetch(`/api/novels/${novelId}/events/reorder`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds }),
    })
    if (!res.ok) throw new Error("排序失败")
    const events = await res.json()
    set({ events })
  },

  addChapter: async (novelId, data) => {
    const res = await fetch(`/api/novels/${novelId}/chapters`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error("添加章节失败")
    const chapter = await res.json()
    set({ chapters: [...get().chapters, chapter] })
  },

  updateChapter: async (chapterId, data) => {
    const novelId = get().novel?.id
    if (!novelId) return
    const res = await fetch(`/api/novels/${novelId}/chapters/${chapterId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error("更新章节失败")
    const updated = await res.json()
    set({ chapters: get().chapters.map((ch) => (ch.id === chapterId ? updated : ch)) })
  },

  deleteChapter: async (novelId, chapterId) => {
    const res = await fetch(`/api/novels/${novelId}/chapters/${chapterId}`, {
      method: "DELETE",
    })
    if (!res.ok) throw new Error("删除章节失败")
    set({ chapters: get().chapters.filter((ch) => ch.id !== chapterId) })
  },

  reset: () => {
    set({
      novel: null,
      chapters: [],
      characters: [],
      events: [],
      analysisStatus: "idle",
      analysisError: null,
    })
  },
}))
