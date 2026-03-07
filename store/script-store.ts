import { create } from "zustand"
import type {
  Script,
  ScriptSceneData,
  ScriptLineData,
  ScriptGenerateStatus,
  ScriptGenerateProgress,
  ScriptSceneInput,
  ScriptLineInput,
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

  generateScripts: (
    projectId: string,
    episodeIds?: string[],
    mode?: "skip_existing" | "overwrite"
  ) => Promise<void>

  createScript: (projectId: string, episodeId: string, title: string) => Promise<void>
  updateScript: (scriptId: string, data: { title?: string; status?: string }) => Promise<void>
  deleteScript: (scriptId: string) => Promise<void>

  addScene: (scriptId: string, data: ScriptSceneInput) => Promise<void>
  updateScene: (scriptId: string, sceneId: string, data: Partial<ScriptSceneInput>) => Promise<void>
  deleteScene: (scriptId: string, sceneId: string) => Promise<void>
  reorderScenes: (scriptId: string, orderedIds: string[]) => Promise<void>

  addLine: (scriptId: string, sceneId: string, data: ScriptLineInput) => Promise<void>
  updateLine: (scriptId: string, sceneId: string, lineId: string, data: Partial<ScriptLineInput>) => Promise<void>
  deleteLine: (scriptId: string, sceneId: string, lineId: string) => Promise<void>
  reorderLines: (scriptId: string, sceneId: string, orderedIds: string[]) => Promise<void>

  setActiveScriptId: (scriptId: string | null) => void
  setFilterChapterIds: (chapterIds: string[]) => void

  confirmScripts: (projectId: string) => Promise<void>

  filteredScripts: () => Script[]
  activeScript: () => Script | null
  episodeScriptStatus: (episodeId: string) => "none" | "generated" | "generating" | "error"
  scriptStats: () => {
    scriptCount: number
    totalScenes: number
    totalLines: number
    totalDuration: string
    characterCount: number
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
    if (data?.chapters) {
      set({ chapters: data.chapters })
    }
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

  addScene: async (scriptId, data) => {
    const res = await fetch(`/api/scripts/${scriptId}/scenes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error("添加场景失败")
    const scene = await res.json()
    set({
      scripts: get().scripts.map((s) =>
        s.id === scriptId ? { ...s, scenes: [...s.scenes, scene] } : s
      ),
    })
  },

  updateScene: async (scriptId, sceneId, data) => {
    const res = await fetch(`/api/scripts/${scriptId}/scenes/${sceneId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error("更新场景失败")
    const updated = await res.json()
    set({
      scripts: get().scripts.map((s) =>
        s.id === scriptId
          ? { ...s, scenes: s.scenes.map((sc) => (sc.id === sceneId ? updated : sc)) }
          : s
      ),
    })
  },

  deleteScene: async (scriptId, sceneId) => {
    const res = await fetch(`/api/scripts/${scriptId}/scenes/${sceneId}`, {
      method: "DELETE",
    })
    if (!res.ok) throw new Error("删除场景失败")
    const scenes = await res.json()
    set({
      scripts: get().scripts.map((s) =>
        s.id === scriptId ? { ...s, scenes } : s
      ),
    })
  },

  reorderScenes: async (scriptId, orderedIds) => {
    const res = await fetch(`/api/scripts/${scriptId}/scenes/reorder`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds }),
    })
    if (!res.ok) throw new Error("场景排序失败")
    const scenes = await res.json()
    set({
      scripts: get().scripts.map((s) =>
        s.id === scriptId ? { ...s, scenes } : s
      ),
    })
  },

  addLine: async (scriptId, sceneId, data) => {
    const res = await fetch(`/api/scripts/${scriptId}/scenes/${sceneId}/lines`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error("添加行失败")
    const line = await res.json()
    set({
      scripts: get().scripts.map((s) =>
        s.id === scriptId
          ? {
              ...s,
              scenes: s.scenes.map((sc) =>
                sc.id === sceneId ? { ...sc, lines: [...sc.lines, line] } : sc
              ),
            }
          : s
      ),
    })
  },

  updateLine: async (scriptId, sceneId, lineId, data) => {
    const res = await fetch(`/api/scripts/${scriptId}/scenes/${sceneId}/lines/${lineId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error("更新行失败")
    const updated = await res.json()
    set({
      scripts: get().scripts.map((s) =>
        s.id === scriptId
          ? {
              ...s,
              scenes: s.scenes.map((sc) =>
                sc.id === sceneId
                  ? { ...sc, lines: sc.lines.map((l) => (l.id === lineId ? updated : l)) }
                  : sc
              ),
            }
          : s
      ),
    })
  },

  deleteLine: async (scriptId, sceneId, lineId) => {
    const res = await fetch(`/api/scripts/${scriptId}/scenes/${sceneId}/lines/${lineId}`, {
      method: "DELETE",
    })
    if (!res.ok) throw new Error("删除行失败")
    const lines = await res.json()
    set({
      scripts: get().scripts.map((s) =>
        s.id === scriptId
          ? {
              ...s,
              scenes: s.scenes.map((sc) =>
                sc.id === sceneId ? { ...sc, lines } : sc
              ),
            }
          : s
      ),
    })
  },

  reorderLines: async (scriptId, sceneId, orderedIds) => {
    const res = await fetch(`/api/scripts/${scriptId}/scenes/${sceneId}/lines/reorder`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds }),
    })
    if (!res.ok) throw new Error("行排序失败")
    const lines = await res.json()
    set({
      scripts: get().scripts.map((s) =>
        s.id === scriptId
          ? {
              ...s,
              scenes: s.scenes.map((sc) =>
                sc.id === sceneId ? { ...sc, lines } : sc
              ),
            }
          : s
      ),
    })
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
    const totalScenes = scripts.reduce((sum, s) => sum + s.scenes.length, 0)
    const totalLines = scripts.reduce(
      (sum, s) => sum + s.scenes.reduce((ss, sc) => ss + sc.lines.length, 0),
      0
    )
    const totalDurationSec = scripts.reduce(
      (sum, s) =>
        sum + s.scenes.reduce((ss, sc) => ss + (parseInt(sc.duration) || 0), 0),
      0
    )
    const characters = new Set<string>()
    for (const s of scripts) {
      for (const sc of s.scenes) {
        for (const l of sc.lines) {
          if (l.type === "dialogue" && l.character) characters.add(l.character)
        }
      }
    }
    return {
      scriptCount: scripts.length,
      totalScenes,
      totalLines,
      totalDuration: `${totalDurationSec}s`,
      characterCount: characters.size,
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
