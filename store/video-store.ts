import { create } from "zustand"
import type {
  VideoComposition,
  VideoCompositionConfig,
  VideoCompositionStatus,
  TtsVoice,
  Episode,
  AssetCharacter,
} from "@/lib/types"
import { DEFAULT_VIDEO_COMPOSITION_CONFIG, TTS_VOICES } from "@/lib/types"

interface VideoState {
  tasks: VideoComposition[]
  episodes: Episode[]
  assetCharacters: AssetCharacter[]

  draftConfig: VideoCompositionConfig
  ttsVoices: TtsVoice[]

  activeEpisodeId: string | null

  playerState: {
    isPlaying: boolean
    currentTime: number
    duration: number
    volume: number
    playbackRate: number
  }

  pollingInterval: ReturnType<typeof setInterval> | null

  isLoading: boolean
  isStarting: boolean
  error: string | null

  fetchTasks: (projectId: string) => Promise<void>
  fetchEpisodes: (projectId: string) => Promise<void>
  fetchAssetCharacters: (projectId: string) => Promise<void>
  fetchTtsVoices: () => Promise<void>

  updateDraftConfig: (config: Partial<VideoCompositionConfig>) => void
  updateDraftConfigSubtitle: (subtitle: Partial<VideoCompositionConfig["subtitle"]>) => void
  updateDraftConfigTts: (tts: Partial<VideoCompositionConfig["tts"]>) => void
  updateDraftConfigBgm: (bgm: Partial<VideoCompositionConfig["bgm"]>) => void
  updateDraftConfigOutput: (output: Partial<VideoCompositionConfig["output"]>) => void
  resetDraftConfig: () => void

  startComposition: (projectId: string, episodeIds?: string[]) => Promise<void>
  cancelComposition: (taskId: string) => Promise<void>

  startPolling: (taskId: string) => void
  stopPolling: () => void
  pollTaskProgress: (taskId: string) => Promise<void>

  setActiveEpisodeId: (episodeId: string | null) => void
  setPlayerState: (state: Partial<VideoState["playerState"]>) => void

  confirmComposition: (projectId: string) => Promise<void>

  episodeTaskStatus: (episodeId: string) => VideoCompositionStatus | "none"
  episodeLatestTask: (episodeId: string) => VideoComposition | null
  allEpisodesCompleted: () => boolean
  totalOutputSize: () => number
  completedCount: () => number
  totalDuration: () => number

  reset: () => void
}

const defaultPlayerState = {
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 80,
  playbackRate: 1,
}

export const useVideoStore = create<VideoState>((set, get) => ({
  tasks: [],
  episodes: [],
  assetCharacters: [],
  draftConfig: DEFAULT_VIDEO_COMPOSITION_CONFIG,
  ttsVoices: TTS_VOICES,
  activeEpisodeId: null,
  playerState: defaultPlayerState,
  pollingInterval: null,
  isLoading: false,
  isStarting: false,
  error: null,

  fetchTasks: async (projectId: string) => {
    set({ isLoading: true, error: null })
    try {
      const res = await fetch(`/api/videos?projectId=${projectId}`)
      if (!res.ok) throw new Error("获取合成任务失败")
      const data = await res.json()
      set({ tasks: data, isLoading: false })
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false })
    }
  },

  fetchEpisodes: async (projectId: string) => {
    try {
      const res = await fetch(`/api/episodes?projectId=${projectId}`)
      if (!res.ok) throw new Error("获取分集失败")
      const data = await res.json()
      set({ episodes: data })
    } catch (e) {
      set({ error: (e as Error).message })
    }
  },

  fetchAssetCharacters: async (projectId: string) => {
    try {
      const res = await fetch(`/api/assets/characters?projectId=${projectId}`)
      if (!res.ok) throw new Error("获取角色失败")
      const data = await res.json()
      set({ assetCharacters: data })
    } catch (e) {
      set({ error: (e as Error).message })
    }
  },

  fetchTtsVoices: async () => {
    try {
      const res = await fetch("/api/videos/tts/voices")
      if (!res.ok) return
      const data = await res.json()
      set({ ttsVoices: data.voices })
    } catch {
      // 使用默认声线列表
    }
  },

  updateDraftConfig: (config) => {
    set((state) => ({ draftConfig: { ...state.draftConfig, ...config } }))
  },

  updateDraftConfigSubtitle: (subtitle) => {
    set((state) => ({
      draftConfig: {
        ...state.draftConfig,
        subtitle: { ...state.draftConfig.subtitle, ...subtitle },
      },
    }))
  },

  updateDraftConfigTts: (tts) => {
    set((state) => ({
      draftConfig: {
        ...state.draftConfig,
        tts: { ...state.draftConfig.tts, ...tts },
      },
    }))
  },

  updateDraftConfigBgm: (bgm) => {
    set((state) => ({
      draftConfig: {
        ...state.draftConfig,
        bgm: { ...state.draftConfig.bgm, ...bgm },
      },
    }))
  },

  updateDraftConfigOutput: (output) => {
    set((state) => ({
      draftConfig: {
        ...state.draftConfig,
        output: { ...state.draftConfig.output, ...output },
      },
    }))
  },

  resetDraftConfig: () => {
    set({ draftConfig: DEFAULT_VIDEO_COMPOSITION_CONFIG })
  },

  startComposition: async (projectId: string, episodeIds?: string[]) => {
    set({ isStarting: true, error: null })
    try {
      const { draftConfig } = get()
      const res = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, episodeIds, config: draftConfig }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "启动合成失败")
      }
      const data = await res.json()
      set({ isStarting: false })
      await get().fetchTasks(projectId)
      if (data.taskIds && data.taskIds.length > 0) {
        for (const taskId of data.taskIds) {
          get().startPolling(taskId)
        }
      }
    } catch (e) {
      set({ error: (e as Error).message, isStarting: false })
    }
  },

  cancelComposition: async (taskId: string) => {
    try {
      const res = await fetch(`/api/videos/${taskId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("取消合成失败")
      get().stopPolling()
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== taskId),
      }))
    } catch (e) {
      set({ error: (e as Error).message })
    }
  },

  startPolling: (taskId: string) => {
    const { pollingInterval } = get()
    if (pollingInterval) clearInterval(pollingInterval)
    const interval = setInterval(async () => {
      await get().pollTaskProgress(taskId)
      const task = get().tasks.find((t) => t.id === taskId)
      if (task && (task.status === "completed" || task.status === "error")) {
        get().stopPolling()
      }
    }, 2000)
    set({ pollingInterval: interval })
  },

  stopPolling: () => {
    const { pollingInterval } = get()
    if (pollingInterval) {
      clearInterval(pollingInterval)
      set({ pollingInterval: null })
    }
  },

  pollTaskProgress: async (taskId: string) => {
    try {
      const res = await fetch(`/api/videos/${taskId}`)
      if (!res.ok) return
      const data = await res.json()
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, ...data } : t)),
      }))
    } catch {
      // 忽略轮询错误
    }
  },

  setActiveEpisodeId: (episodeId) => {
    set({ activeEpisodeId: episodeId })
  },

  setPlayerState: (state) => {
    set((prev) => ({ playerState: { ...prev.playerState, ...state } }))
  },

  confirmComposition: async (projectId: string) => {
    try {
      const res = await fetch("/api/videos/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "确认合成失败")
      }
    } catch (e) {
      set({ error: (e as Error).message })
      throw e
    }
  },

  episodeTaskStatus: (episodeId: string) => {
    const { tasks } = get()
    const episodeTasks = tasks.filter((t) => t.episodeId === episodeId)
    if (episodeTasks.length === 0) return "none"
    const latest = episodeTasks.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0]
    return latest.status
  },

  episodeLatestTask: (episodeId: string) => {
    const { tasks } = get()
    const episodeTasks = tasks.filter((t) => t.episodeId === episodeId)
    if (episodeTasks.length === 0) return null
    return episodeTasks.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0]
  },

  allEpisodesCompleted: () => {
    const { tasks, episodes } = get()
    if (episodes.length === 0) return false
    return episodes.every((ep) =>
      tasks.some((t) => t.episodeId === ep.id && t.status === "completed")
    )
  },

  totalOutputSize: () => {
    const { tasks } = get()
    return tasks
      .filter((t) => t.status === "completed" && t.fileSize)
      .reduce((sum, t) => sum + (t.fileSize ?? 0), 0)
  },

  completedCount: () => {
    const { tasks } = get()
    const completedEpisodeIds = new Set(
      tasks.filter((t) => t.status === "completed").map((t) => t.episodeId)
    )
    return completedEpisodeIds.size
  },

  totalDuration: () => {
    const { tasks, episodes } = get()
    const completedByEpisode = new Map<string, VideoComposition>()
    for (const task of tasks) {
      if (task.status === "completed") {
        const existing = completedByEpisode.get(task.episodeId)
        if (!existing || new Date(task.createdAt) > new Date(existing.createdAt)) {
          completedByEpisode.set(task.episodeId, task)
        }
      }
    }
    let total = 0
    for (const task of completedByEpisode.values()) {
      total += task.videoDuration ?? 0
    }
    return total
  },

  reset: () => {
    get().stopPolling()
    set({
      tasks: [],
      episodes: [],
      assetCharacters: [],
      draftConfig: DEFAULT_VIDEO_COMPOSITION_CONFIG,
      activeEpisodeId: null,
      playerState: defaultPlayerState,
      isLoading: false,
      isStarting: false,
      error: null,
    })
  },
}))
