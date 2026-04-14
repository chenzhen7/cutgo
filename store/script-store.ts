import { create } from "zustand"
import type {
  Episode,
  ScriptGenerateStatus,
  ScriptGenerateProgress,
} from "@/lib/types"
import { apiFetch } from "@/lib/api-client"

interface ScriptState {
  episodes: Episode[]
  generateStatus: ScriptGenerateStatus
  generateError: string | null
  generateProgress: ScriptGenerateProgress | null

  activeEpisodeId: string | null

  fetchEpisodes: (projectId: string) => Promise<void>
  deleteEpisode: (projectId: string, episodeId: string) => Promise<void>
  reorderEpisodes: (projectId: string, orderedIds: string[]) => Promise<void>
  createEpisodeWithRawText: (projectId: string, params: {
    title: string
    rawText: string
    extractAssets: boolean
  }) => Promise<{ episodeId: string; extractAssets: boolean }>
  updateEpisode: (episodeId: string, data: {
    title?: string
  }) => Promise<void>
  generateScripts: (
    projectId: string,
    episodeIds?: string[],
    mode?: "skip_existing" | "overwrite"
  ) => Promise<void>
  clearGenerateError: () => void

  updateScript: (episodeId: string, data: { content?: string }) => Promise<void>
  clearScript: (episodeId: string) => Promise<void>

  setActiveEpisodeId: (episodeId: string | null) => void

  confirmScripts: (projectId: string) => Promise<void>

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
  generateStatus: "idle",
  generateError: null,
  generateProgress: null,
  activeEpisodeId: null,

  fetchEpisodes: async (projectId) => {
    try {
      const data = await apiFetch<Episode[]>(`/api/episodes?projectId=${projectId}`)
      set({ episodes: data || [] })
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

  createEpisodeWithRawText: async (projectId, { title, rawText, extractAssets }) => {
    const data = await apiFetch<{ episode: Episode; extractAssets: boolean }>(
      "/api/episodes/create-with-script",
      {
        method: "POST",
        body: { projectId, title, rawText, extractAssets },
      }
    )
    await get().fetchEpisodes(projectId)
    set({ activeEpisodeId: data.episode.id })
    return { episodeId: data.episode.id, extractAssets: data.extractAssets }
  },

  reorderEpisodes: async (projectId, orderedIds) => {
    const prevEpisodes = get().episodes
    const newIndexById = new Map(orderedIds.map((id, i) => [id, i]))
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

  confirmScripts: async (projectId) => {
    await apiFetch("/api/scripts/confirm", {
      method: "POST",
      body: { projectId },
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
      generateStatus: "idle",
      generateError: null,
      generateProgress: null,
      activeEpisodeId: null,
    })
  },
}))
