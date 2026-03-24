import { create } from "zustand"
import type {
  Novel,
  Chapter,
  AnalysisStatus,
  ImportNovelInput,
} from "@/lib/types"
import { apiFetch } from "@/lib/api-client"

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
    const novel = await apiFetch<Novel>("/api/novels", { method: "POST", body: data })
    set({ novel, analysisStatus: "idle", analysisError: null, chapters: [] })
    return novel
  },

  analyzeNovel: async (novelId) => {
    set({ analysisStatus: "analyzing", analysisError: null })
    try {
      const data = await apiFetch<Novel & { stats?: unknown; chapters?: Chapter[] }>(
        `/api/novels/${novelId}/analyze`,
        { method: "POST" }
      )
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
    const updated = await apiFetch<Novel>(`/api/novels/${novelId}/confirm`, { method: "POST" })
    const ch = get().chapters
    set({ novel: { ...get().novel!, ...updated, chapters: ch } })
  },

  fetchNovel: async (projectId) => {
    try {
      const data = await apiFetch<Novel | null>(`/api/novels?projectId=${projectId}`)
      if (!data) {
        set({ novel: null, chapters: [], analysisStatus: "idle" })
        return
      }
      set({
        novel: data,
        chapters: (data as Novel & { chapters?: Chapter[] }).chapters || [],
        analysisStatus: ((data as Novel & { chapters?: Chapter[] }).chapters?.length ?? 0) > 0 ? "completed" : "idle",
      })
    } catch {
      // fetchNovel 为非关键数据加载，静默失败
    }
  },

  addChapter: async (novelId, data) => {
    const chapter = await apiFetch<Chapter>(`/api/novels/${novelId}/chapters`, {
      method: "POST",
      body: data,
    })
    set({ chapters: [...get().chapters, chapter] })
  },

  updateChapter: async (chapterId, data) => {
    const novelId = get().novel?.id
    if (!novelId) return
    const updated = await apiFetch<Chapter>(`/api/novels/${novelId}/chapters/${chapterId}`, {
      method: "PUT",
      body: data,
    })
    set({ chapters: get().chapters.map((ch) => (ch.id === chapterId ? updated : ch)) })
  },

  deleteChapter: async (novelId, chapterId) => {
    await apiFetch(`/api/novels/${novelId}/chapters/${chapterId}`, { method: "DELETE" })
    const updated = get().chapters
      .filter((ch) => ch.id !== chapterId)
      .map((ch, i) => ({ ...ch, index: i }))
    set({ chapters: updated })
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
