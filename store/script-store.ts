import { create } from "zustand"
import type {
  Script,
  ScriptGenerateStatus,
  ScriptGenerateProgress,
  Episode,
  Chapter,
} from "@/lib/types"
import { parseSourceChapterIds } from "@/lib/episode-source-chapters"
import { apiFetch } from "@/lib/api-client"

interface ScriptState {
  scripts: Script[]
  episodes: Episode[]
  chapters: Chapter[]
  generateStatus: ScriptGenerateStatus
  generateError: string | null
  generateProgress: ScriptGenerateProgress | null

  activeScriptId: string | null
  filterChapterIds: string[]

  fetchScripts: (projectId: string, episodeId?: string) => Promise<void>
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

  createScript: (projectId: string, episodeId: string, title: string) => Promise<void>
  updateScript: (scriptId: string, data: {
    title?: string
    content?: string
    status?: string
  }) => Promise<void>
  deleteScript: (scriptId: string) => Promise<void>

  setActiveScriptId: (scriptId: string | null) => void
  setFilterChapterIds: (chapterIds: string[]) => void

  confirmScripts: (projectId: string) => Promise<void>

  filteredScripts: () => Script[]
  activeScript: () => Script | null
  episodeScriptStatus: (episodeId: string) => "none" | "generated" | "generating" | "error"
  scriptStats: () => {
    scriptCount: number
    totalWordCount: number
    coverage: string
  }

  reset: () => void
}

export const useScriptStore = create<ScriptState>((set, get) => ({
  scripts: [],
  episodes: [],
  chapters: [],
  generateStatus: "idle",
  generateError: null,
  generateProgress: null,
  activeScriptId: null,
  filterChapterIds: [],

  fetchScripts: async (projectId, episodeId) => {
    try {
      const url = episodeId
        ? `/api/scripts?projectId=${projectId}&episodeId=${episodeId}`
        : `/api/scripts?projectId=${projectId}`
      const data = await apiFetch<Script[]>(url)
      set({ scripts: data || [] })
    } catch {
      // 非关键数据加载，静默失败
    }
  },

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
      const data = await apiFetch<{ scripts?: Script[] }>("/api/scripts/generate", {
        method: "POST",
        body: { projectId, episodeIds, mode },
      })
      set({
        scripts: data.scripts || [],
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

  createScript: async (projectId, episodeId, title) => {
    const script = await apiFetch<Script>("/api/scripts", {
      method: "POST",
      body: { projectId, episodeId, title },
    })
    set({ scripts: [...get().scripts, script] })
  },

  updateScript: async (scriptId, data) => {
    const updated = await apiFetch<Script>(`/api/scripts/${scriptId}`, {
      method: "PATCH",
      body: data,
    })
    set({ scripts: get().scripts.map((s) => (s.id === scriptId ? updated : s)) })
  },

  deleteScript: async (scriptId) => {
    await apiFetch(`/api/scripts/${scriptId}`, { method: "DELETE" })
    set({ scripts: get().scripts.filter((s) => s.id !== scriptId) })
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
      scripts: get().scripts.filter((s) => s.episodeId !== episodeId),
    })
    const { activeScriptId, scripts } = get()
    if (activeScriptId && !scripts.find((s) => s.id === activeScriptId)) {
      set({ activeScriptId: scripts[0]?.id ?? null })
    }
  },

  createEpisodeWithScript: async (projectId, chapterIds) => {
    const episode = await apiFetch<Episode>("/api/episodes", {
      method: "POST",
      body: { projectId, chapterIds },
    })
    const script = await apiFetch<Script>("/api/scripts", {
      method: "POST",
      body: { projectId, episodeId: episode.id, title: episode.title },
    })
    await get().fetchEpisodes(projectId)
    await get().fetchScripts(projectId)
    set({ activeScriptId: script.id })
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

  setActiveScriptId: (scriptId) => set({ activeScriptId: scriptId }),
  setFilterChapterIds: (chapterIds) => set({ filterChapterIds: chapterIds }),

  confirmScripts: async (projectId) => {
    await apiFetch("/api/scripts/confirm", {
      method: "POST",
      body: { projectId },
    })
  },

  filteredScripts: () => {
    const { scripts, filterChapterIds } = get()
    if (filterChapterIds.length === 0) return scripts
    return scripts.filter((s) => {
      const ids = parseSourceChapterIds(s.episode)
      return ids.some((id) => filterChapterIds.includes(id))
    })
  },

  activeScript: () => {
    const { scripts, activeScriptId } = get()
    return scripts.find((s) => s.id === activeScriptId) || null
  },

  episodeScriptStatus: (episodeId) => {
    const { scripts, generateStatus } = get()
    const script = scripts.find((s) => s.episodeId === episodeId)
    if (script) return "generated"
    if (generateStatus === "generating") return "generating"
    return "none"
  },

  scriptStats: () => {
    const { scripts, episodes } = get()
    const totalWordCount = scripts.reduce((sum, s) => sum + s.content.length, 0)
    return {
      scriptCount: scripts.length,
      totalWordCount,
      coverage: `${scripts.length}/${episodes.length}`,
    }
  },

  reset: () => {
    set({
      scripts: [],
      episodes: [],
      chapters: [],
      generateStatus: "idle",
      generateError: null,
      generateProgress: null,
      activeScriptId: null,
      filterChapterIds: [],
    })
  },
}))
