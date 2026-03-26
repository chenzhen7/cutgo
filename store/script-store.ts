import { create } from "zustand"
import type {
  Episode,
  ScriptGenerateStatus,
  ScriptGenerateProgress,
  Chapter,
} from "@/lib/types"
import { parseSourceChapterIds } from "@/lib/episode-source-chapters"
import { apiFetch } from "@/lib/api-client"

interface ScriptState {
  episodes: Episode[]
  chapters: Chapter[]
  generateStatus: ScriptGenerateStatus
  generateError: string | null
  generateProgress: ScriptGenerateProgress | null

  activeEpisodeId: string | null
  filterChapterIds: string[]

  fetchEpisodes: (projectId: string) => Promise<void>
  fetchChapters: (projectId: string) => Promise<void>
  deleteEpisode: (projectId: string, episodeId: string) => Promise<void>
  reorderEpisodes: (projectId: string, orderedIds: string[]) => Promise<void>
  createEpisodeWithScript: (projectId: string, chapterIds: string[]) => Promise<void>
  updateEpisode: (episodeId: string, data: {
    title?: string
    outline?: string | null
    goldenHook?: string | null
    keyConflict?: string | null
    cliffhanger?: string | null
  }) => Promise<void>
  generateEpisodeOutlines: (projectId: string, chapterIds: string[]) => Promise<void>

  generateScripts: (
    projectId: string,
    episodeIds?: string[],
    mode?: "skip_existing" | "overwrite"
  ) => Promise<void>
  clearGenerateError: () => void

  updateScript: (episodeId: string, data: { content?: string }) => Promise<void>
  clearScript: (episodeId: string) => Promise<void>

  setActiveEpisodeId: (episodeId: string | null) => void
  setFilterChapterIds: (chapterIds: string[]) => void

  confirmScripts: (projectId: string) => Promise<void>

  filteredEpisodes: () => Episode[]
  activeEpisode: () => Episode | null
  episodeScriptStatus: (episodeId: string) => "none" | "generated" | "generating" | "error"
  scriptStats: () => {
    scriptCount: number
    totalWordCount: number
    coverage: string
  }

  reset: () => void
}

export const useScriptStore = create<ScriptState>((set, get) => ({
  episodes: [],
  chapters: [],
  generateStatus: "idle",
  generateError: null,
  generateProgress: null,
  activeEpisodeId: null,
  filterChapterIds: [],

  fetchEpisodes: async (projectId) => {
    try {
      const data = await apiFetch<Episode[]>(`/api/episodes?projectId=${projectId}`)
      set({ episodes: data || [] })
    } catch {
      // 非关键数据加载，静默失败
    }
  },

  fetchChapters: async (projectId) => {
    try {
      const data = await apiFetch<{ chapters?: Chapter[] }>(`/api/novels?projectId=${projectId}`)
      set({ chapters: data?.chapters ?? [] })
    } catch {
      // 非关键数据加载，静默失败
    }
  },

  generateScripts: async (projectId, episodeIds, mode = "skip_existing") => {
    set({ generateStatus: "generating", generateError: null, generateProgress: null })
    try {
      const data = await apiFetch<{ episodes?: Episode[] }>("/api/scripts/generate", {
        method: "POST",
        body: { projectId, episodeIds, mode },
      })
      set({
        episodes: data.episodes || [],
        generateStatus: "completed",
        generateProgress: null,
      })
    } catch (err) {
      const errorMessage =
        err instanceof Error && err.message.trim().length > 0
          ? err.message
          : "剧本生成失败，请稍后重试"
      set({
        generateStatus: "error",
        generateError: errorMessage,
        generateProgress: null,
      })
    }
  },

  clearGenerateError: () => {
    const { generateStatus } = get()
    set({
      generateError: null,
      generateStatus: generateStatus === "error" ? "idle" : generateStatus,
    })
  },

  updateScript: async (episodeId, data) => {
    const updated = await apiFetch<Episode>(`/api/scripts/${episodeId}`, {
      method: "PATCH",
      body: data,
    })
    set({ episodes: get().episodes.map((ep) => (ep.id === episodeId ? updated : ep)) })
  },

  clearScript: async (episodeId) => {
    await apiFetch(`/api/scripts/${episodeId}`, { method: "DELETE" })
    set({
      episodes: get().episodes.map((ep) =>
        ep.id === episodeId ? { ...ep, script: "" } : ep
      ),
    })
  },

  updateEpisode: async (episodeId, data) => {
    const updated = await apiFetch<Episode>(`/api/episodes/${episodeId}`, {
      method: "PATCH",
      body: data,
    })
    set({ episodes: get().episodes.map((ep) => (ep.id === episodeId ? updated : ep)) })
  },

  generateEpisodeOutlines: async (projectId, chapterIds) => {
    const data = await apiFetch<{ episodes?: Episode[] }>("/api/episodes/generate-outlines", {
      method: "POST",
      body: { projectId, chapterIds },
    })
    const newEpisodes: Episode[] = data.episodes ?? []
    set({ episodes: [...get().episodes, ...newEpisodes] })
  },

  deleteEpisode: async (projectId, episodeId) => {
    const remaining = await apiFetch<Episode[]>(`/api/episodes/${episodeId}`, { method: "DELETE" })
    set({
      episodes: remaining,
    })
    const { activeEpisodeId } = get()
    if (activeEpisodeId === episodeId) {
      set({ activeEpisodeId: remaining[0]?.id ?? null })
    }
  },

  createEpisodeWithScript: async (projectId, chapterIds) => {
    const episode = await apiFetch<Episode>("/api/episodes", {
      method: "POST",
      body: { projectId, chapterIds },
    })
    await get().fetchEpisodes(projectId)
    set({ activeEpisodeId: episode.id })
  },

  reorderEpisodes: async (projectId, orderedIds) => {
    const prevEpisodes = get().episodes
    const newIndexById = new Map(orderedIds.map((id, i) => [id, i + 1]))
    const merged = prevEpisodes.map((ep) => {
      const ni = newIndexById.get(ep.id)
      return ni !== undefined ? { ...ep, index: ni } : ep
    })
    set({ episodes: merged })
    try {
      const updated = await apiFetch<Episode[]>("/api/episodes/reorder", {
        method: "PUT",
        body: { projectId, orderedIds },
      })
      set({ episodes: updated })
    } catch {
      set({ episodes: prevEpisodes })
    }
  },

  setActiveEpisodeId: (episodeId) => set({ activeEpisodeId: episodeId }),
  setFilterChapterIds: (chapterIds) => set({ filterChapterIds: chapterIds }),

  confirmScripts: async (projectId) => {
    await apiFetch("/api/scripts/confirm", {
      method: "POST",
      body: { projectId },
    })
  },

  filteredEpisodes: () => {
    const { episodes, filterChapterIds } = get()
    if (filterChapterIds.length === 0) return episodes
    return episodes.filter((ep) => {
      const ids = parseSourceChapterIds(ep)
      return ids.some((id) => filterChapterIds.includes(id))
    })
  },

  activeEpisode: () => {
    const { episodes, activeEpisodeId } = get()
    return episodes.find((ep) => ep.id === activeEpisodeId) || null
  },

  episodeScriptStatus: (episodeId) => {
    const { episodes, generateStatus } = get()
    const episode = episodes.find((ep) => ep.id === episodeId)
    if (episode?.script) return "generated"
    if (generateStatus === "generating") return "generating"
    return "none"
  },

  scriptStats: () => {
    const { episodes } = get()
    const episodesWithScript = episodes.filter((ep) => ep.script)
    const totalWordCount = episodesWithScript.reduce((sum, ep) => sum + ep.script.length, 0)
    return {
      scriptCount: episodesWithScript.length,
      totalWordCount,
      coverage: `${episodesWithScript.length}/${episodes.length}`,
    }
  },

  reset: () => {
    set({
      episodes: [],
      chapters: [],
      generateStatus: "idle",
      generateError: null,
      generateProgress: null,
      activeEpisodeId: null,
      filterChapterIds: [],
    })
  },
}))
