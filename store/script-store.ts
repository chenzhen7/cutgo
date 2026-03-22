import { create } from "zustand"
import type {
  Script,
  ScriptGenerateStatus,
  ScriptGenerateProgress,
  Episode,
  Chapter,
} from "@/lib/types"

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
  createEpisodeWithScript: (projectId: string, chapterId: string) => Promise<void>
  updateEpisode: (episodeId: string, data: { title?: string; synopsis?: string; outline?: string | null }) => Promise<void>
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
    characters?: string
    props?: string
    location?: string
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
    const url = episodeId
      ? `/api/scripts?projectId=${projectId}&episodeId=${episodeId}`
      : `/api/scripts?projectId=${projectId}`
    const res = await fetch(url)
    if (!res.ok) return
    const data = await res.json()
    set({ scripts: data || [] })
  },

  fetchEpisodes: async (projectId) => {
    const res = await fetch(`/api/episodes?projectId=${projectId}`)
    if (!res.ok) return
    const data = await res.json()
    set({ episodes: data || [] })
  },

  fetchChapters: async (projectId) => {
    const res = await fetch(`/api/novels?projectId=${projectId}`)
    if (!res.ok) return
    const data = await res.json()
    set({ chapters: data?.chapters ?? [] })
  },

  generateScripts: async (projectId, episodeIds, mode = "skip_existing") => {
    set({ generateStatus: "generating", generateError: null, generateProgress: null })
    try {
      const res = await fetch("/api/scripts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, episodeIds, mode }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "生成失败")
      }
      const data = await res.json()
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
    const res = await fetch("/api/scripts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, episodeId, title }),
    })
    if (!res.ok) throw new Error("创建剧本失败")
    const script = await res.json()
    set({ scripts: [...get().scripts, script] })
  },

  updateScript: async (scriptId, data) => {
    const res = await fetch(`/api/scripts/${scriptId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error("更新剧本失败")
    const updated = await res.json()
    set({ scripts: get().scripts.map((s) => (s.id === scriptId ? updated : s)) })
  },

  deleteScript: async (scriptId) => {
    const res = await fetch(`/api/scripts/${scriptId}`, { method: "DELETE" })
    if (!res.ok) throw new Error("删除剧本失败")
    set({ scripts: get().scripts.filter((s) => s.id !== scriptId) })
  },

  updateEpisode: async (episodeId, data) => {
    const res = await fetch(`/api/episodes/${episodeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error("更新分集失败")
    const updated = await res.json()
    set({ episodes: get().episodes.map((ep) => (ep.id === episodeId ? updated : ep)) })
  },

  generateEpisodeOutlines: async (projectId, chapterIds) => {
    const res = await fetch("/api/episodes/generate-outlines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, chapterIds }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      const errData = err as { error?: string; message?: string }
      const e = new Error(errData.message || errData.error || "生成大纲失败") as Error & { code?: string }
      e.code = errData.error
      throw e
    }
    const data = await res.json()
    const newEpisodes: Episode[] = data.episodes ?? []
    set({
      episodes: [...get().episodes, ...newEpisodes],
    })
  },

  deleteEpisode: async (projectId, episodeId) => {
    const res = await fetch(`/api/episodes/${episodeId}`, { method: "DELETE" })
    if (!res.ok) throw new Error("删除分集失败")
    const remaining = await res.json()
    set({
      episodes: remaining,
      scripts: get().scripts.filter((s) => s.episodeId !== episodeId),
    })
    const { activeScriptId, scripts } = get()
    if (activeScriptId && !scripts.find((s) => s.id === activeScriptId)) {
      set({ activeScriptId: scripts[0]?.id ?? null })
    }
  },

  createEpisodeWithScript: async (projectId, chapterId) => {
    const epRes = await fetch("/api/episodes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, chapterId }),
    })
    if (!epRes.ok) {
      const err = await epRes.json().catch(() => ({}))
      throw new Error((err as { error?: string }).error || "创建分集失败")
    }
    const episode = await epRes.json()
    const scriptRes = await fetch("/api/scripts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        episodeId: episode.id,
        title: episode.title,
      }),
    })
    if (!scriptRes.ok) {
      const err = await scriptRes.json().catch(() => ({}))
      throw new Error((err as { error?: string }).error || "创建剧本失败")
    }
    const script = await scriptRes.json()
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
      const res = await fetch("/api/episodes/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, orderedIds }),
      })
      if (!res.ok) throw new Error("排序失败")
      const updated = await res.json()
      set({ episodes: updated })
    } catch {
      set({ episodes: prevEpisodes })
    }
  },

  setActiveScriptId: (scriptId) => set({ activeScriptId: scriptId }),
  setFilterChapterIds: (chapterIds) => set({ filterChapterIds: chapterIds }),

  confirmScripts: async (projectId) => {
    const res = await fetch("/api/scripts/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || "确认剧本失败")
    }
  },

  filteredScripts: () => {
    const { scripts, filterChapterIds } = get()
    if (filterChapterIds.length === 0) return scripts
    return scripts.filter((s) => filterChapterIds.includes(s.episode.chapterId))
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
