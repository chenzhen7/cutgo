import { create } from "zustand"
import type {
  Novel,
  Chapter,
  AnalysisStatus,
  ImportNovelInput,
} from "@/lib/types"

interface ChapterInput {
  title?: string
  content?: string
}

interface NovelState {
  novel: Novel | null
  chapters: Chapter[]

  analysisStatus: AnalysisStatus
  analysisError: string | null

  importNovel: (data: ImportNovelInput) => Promise<Novel>
  analyzeNovel: (novelId: string) => Promise<void>
  confirmImport: (novelId: string) => Promise<void>

  fetchNovel: (projectId: string) => Promise<void>

  addChapter: (novelId: string, data: ChapterInput) => Promise<void>
  updateChapter: (chapterId: string, data: Partial<ChapterInput>) => Promise<void>
  deleteChapter: (novelId: string, chapterId: string) => Promise<void>

  reset: () => void
}

export const useNovelStore = create<NovelState>((set, get) => ({
  novel: null,
  chapters: [],
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
    set({ novel, analysisStatus: "idle", analysisError: null, chapters: [] })
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
      const { stats, chapters, ...novelFields } = data
      void stats
      const ch = chapters ?? []
      set({
        novel: { ...get().novel!, ...novelFields, chapters: ch },
        chapters: ch,
        analysisStatus: "completed",
      })
    } catch (err) {
      set({ analysisStatus: "error", analysisError: (err as Error).message })
    }
  },

  confirmImport: async (novelId) => {
    const res = await fetch(`/api/novels/${novelId}/confirm`, { method: "POST" })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || "确认导入失败")
    }
    const updated = await res.json()
    const ch = get().chapters
    set({
      novel: { ...get().novel!, ...updated, chapters: ch },
    })
  },

  fetchNovel: async (projectId) => {
    const res = await fetch(`/api/novels?projectId=${projectId}`)
    if (!res.ok) return
    const data = await res.json()
    if (!data) {
      set({ novel: null, chapters: [], analysisStatus: "idle" })
      return
    }
    set({
      novel: data,
      chapters: data.chapters || [],
      analysisStatus: (data.chapters?.length ?? 0) > 0 ? "completed" : "idle",
    })
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
      analysisStatus: "idle",
      analysisError: null,
    })
  },
}))
