import { create } from "zustand"
import type {
  Episode,
  EpisodeScene,
  GenerateStatus,
  GenerateProgress,
  EpisodeInput,
  SceneInput,
  Chapter,
} from "@/lib/types"

interface OutlineState {
  episodes: Episode[]
  chapters: Chapter[]
  generateStatus: GenerateStatus
  generateError: string | null
  generateProgress: GenerateProgress | null

  filterChapterIds: string[]

  fetchEpisodes: (projectId: string, chapterId?: string) => Promise<void>
  fetchChapters: (projectId: string) => Promise<void>

  generateOutline: (
    projectId: string,
    chapterIds?: string[],
    mode?: "skip_existing" | "overwrite"
  ) => Promise<void>

  addEpisode: (projectId: string, data: EpisodeInput) => Promise<void>
  updateEpisode: (episodeId: string, data: Partial<EpisodeInput>) => Promise<void>
  deleteEpisode: (episodeId: string) => Promise<void>
  reorderEpisodes: (projectId: string, orderedIds: string[]) => Promise<void>

  addScene: (episodeId: string, data: SceneInput) => Promise<void>
  updateScene: (episodeId: string, sceneId: string, data: Partial<SceneInput>) => Promise<void>
  deleteScene: (episodeId: string, sceneId: string) => Promise<void>
  reorderScenes: (episodeId: string, orderedIds: string[]) => Promise<void>

  setFilterChapterIds: (chapterIds: string[]) => void

  confirmOutline: (projectId: string) => Promise<void>

  filteredEpisodes: () => Episode[]
  chapterEpisodeCount: (chapterId: string) => number
  hasEpisodes: (chapterId: string) => boolean

  reset: () => void
}

export const useOutlineStore = create<OutlineState>((set, get) => ({
  episodes: [],
  chapters: [],
  generateStatus: "idle",
  generateError: null,
  generateProgress: null,
  filterChapterIds: [],

  fetchEpisodes: async (projectId, chapterId) => {
    const url = chapterId
      ? `/api/episodes?projectId=${projectId}&chapterId=${chapterId}`
      : `/api/episodes?projectId=${projectId}`
    const res = await fetch(url)
    if (!res.ok) return
    const data = await res.json()
    set({ episodes: data || [] })
  },

  fetchChapters: async (projectId) => {
    const res = await fetch(`/api/novels?projectId=${projectId}`)
    if (!res.ok) return
    const data = await res.json()
    if (data?.chapters) {
      set({ chapters: data.chapters })
    }
  },

  generateOutline: async (projectId, chapterIds, mode = "skip_existing") => {
    set({ generateStatus: "generating", generateError: null, generateProgress: null })
    try {
      const res = await fetch("/api/episodes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, chapterIds, mode }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "生成失败")
      }
      const data = await res.json()
      set({
        episodes: data.episodes || [],
        generateStatus: "completed",
        generateProgress: null,
      })
    } catch (err) {
      set({
        generateStatus: "error",
        generateError: (err as Error).message,
        generateProgress: null,
      })
    }
  },

  addEpisode: async (projectId, data) => {
    const res = await fetch("/api/episodes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, ...data }),
    })
    if (!res.ok) throw new Error("添加分集失败")
    const episode = await res.json()
    const sorted = [...get().episodes, episode].sort((a, b) => a.index - b.index)
    set({ episodes: sorted })
  },

  updateEpisode: async (episodeId, data) => {
    const res = await fetch(`/api/episodes/${episodeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error("更新分集失败")
    const updated = await res.json()
    const sorted = get().episodes.map((ep) => (ep.id === episodeId ? updated : ep)).sort((a, b) => a.index - b.index)
    set({ episodes: sorted })
  },

  deleteEpisode: async (episodeId) => {
    const res = await fetch(`/api/episodes/${episodeId}`, { method: "DELETE" })
    if (!res.ok) throw new Error("删除分集失败")
    const remaining = await res.json()
    set({ episodes: remaining })
  },

  reorderEpisodes: async (projectId, orderedIds) => {
    const res = await fetch("/api/episodes/reorder", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, orderedIds }),
    })
    if (!res.ok) throw new Error("排序失败")
    const episodes = await res.json()
    set({ episodes })
  },

  addScene: async (episodeId, data) => {
    const res = await fetch(`/api/episodes/${episodeId}/scenes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error("添加场景失败")
    const scene = await res.json()
    set({
      episodes: get().episodes.map((ep) =>
        ep.id === episodeId ? { ...ep, scenes: [...ep.scenes, scene] } : ep
      ),
    })
  },

  updateScene: async (episodeId, sceneId, data) => {
    const res = await fetch(`/api/episodes/${episodeId}/scenes/${sceneId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error("更新场景失败")
    const updated = await res.json()
    set({
      episodes: get().episodes.map((ep) =>
        ep.id === episodeId
          ? { ...ep, scenes: ep.scenes.map((s) => (s.id === sceneId ? updated : s)) }
          : ep
      ),
    })
  },

  deleteScene: async (episodeId, sceneId) => {
    const res = await fetch(`/api/episodes/${episodeId}/scenes/${sceneId}`, {
      method: "DELETE",
    })
    if (!res.ok) throw new Error("删除场景失败")
    const scenes = await res.json()
    set({
      episodes: get().episodes.map((ep) =>
        ep.id === episodeId ? { ...ep, scenes } : ep
      ),
    })
  },

  reorderScenes: async (episodeId, orderedIds) => {
    const res = await fetch(`/api/episodes/${episodeId}/scenes/reorder`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds }),
    })
    if (!res.ok) throw new Error("场景排序失败")
    const scenes = await res.json()
    set({
      episodes: get().episodes.map((ep) =>
        ep.id === episodeId ? { ...ep, scenes } : ep
      ),
    })
  },

  setFilterChapterIds: (chapterIds) => {
    set({ filterChapterIds: chapterIds })
  },

  confirmOutline: async (projectId) => {
    const res = await fetch("/api/episodes/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || "确认大纲失败")
    }
  },

  filteredEpisodes: () => {
    const { episodes, filterChapterIds } = get()
    if (filterChapterIds.length === 0) return episodes
    return episodes.filter((ep) => filterChapterIds.includes(ep.chapterId))
  },

  chapterEpisodeCount: (chapterId) => {
    return get().episodes.filter((ep) => ep.chapterId === chapterId).length
  },

  hasEpisodes: (chapterId) => {
    return get().episodes.some((ep) => ep.chapterId === chapterId)
  },

  reset: () => {
    set({
      episodes: [],
      chapters: [],
      generateStatus: "idle",
      generateError: null,
      generateProgress: null,
      filterChapterIds: [],
    })
  },
}))
