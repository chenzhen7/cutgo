import { create } from "zustand"
import type {
  Storyboard,
  Shot,
  ShotInput,
  StoryboardGenerateStatus,
  StoryboardGenerateProgress,
  Episode,
  Script,
} from "@/lib/types"

interface StoryboardState {
  storyboards: Storyboard[]
  episodes: Episode[]
  scripts: Script[]
  generateStatus: StoryboardGenerateStatus
  generateError: string | null
  generateProgress: StoryboardGenerateProgress | null

  activeEpisodeId: string | null
  activeShotId: string | null
  selectedShotIds: Set<string>
  detailPanelOpen: boolean

  fetchStoryboards: (projectId: string, episodeId?: string) => Promise<void>
  fetchEpisodes: (projectId: string) => Promise<void>
  fetchScripts: (projectId: string) => Promise<void>

  generateStoryboards: (
    projectId: string,
    episodeIds?: string[],
    scriptSceneIds?: string[],
    mode?: "skip_existing" | "overwrite"
  ) => Promise<void>

  createStoryboard: (projectId: string, scriptSceneId: string) => Promise<void>
  updateStoryboard: (storyboardId: string, data: { status?: string }) => Promise<void>
  deleteStoryboard: (storyboardId: string) => Promise<void>

  addShot: (storyboardId: string, data: ShotInput) => Promise<void>
  updateShot: (storyboardId: string, shotId: string, data: Partial<ShotInput>) => Promise<void>
  deleteShot: (storyboardId: string, shotId: string) => Promise<void>
  duplicateShot: (storyboardId: string, shotId: string) => Promise<void>
  reorderShots: (storyboardId: string, orderedIds: string[]) => Promise<void>

  moveShot: (
    shotId: string,
    sourceStoryboardId: string,
    targetStoryboardId: string,
    targetIndex: number
  ) => Promise<void>

  optimizePrompt: (storyboardId: string, shotId: string) => Promise<{ optimizedPrompt: string; negativePrompt: string }>

  setActiveEpisodeId: (episodeId: string | null) => void
  setActiveShotId: (shotId: string | null) => void
  setDetailPanelOpen: (open: boolean) => void
  toggleShotSelection: (shotId: string) => void
  clearShotSelection: () => void

  confirmStoryboards: (projectId: string) => Promise<void>

  activeEpisodeStoryboards: () => Storyboard[]
  activeShot: () => { shot: Shot; storyboard: Storyboard } | null
  nextShot: () => { shot: Shot; storyboard: Storyboard } | null
  prevShot: () => { shot: Shot; storyboard: Storyboard } | null
  episodeStoryboardStatus: (episodeId: string) => "none" | "partial" | "generated" | "generating" | "error"
  storyboardStats: () => {
    storyboardCount: number
    totalShots: number
    avgShotsPerScene: number
    totalDuration: string
    shotSizeDistribution: Record<string, number>
    coverage: string
    totalScenes: number
  }

  reset: () => void
}

export const useStoryboardStore = create<StoryboardState>((set, get) => ({
  storyboards: [],
  episodes: [],
  scripts: [],
  generateStatus: "idle",
  generateError: null,
  generateProgress: null,
  activeEpisodeId: null,
  activeShotId: null,
  selectedShotIds: new Set(),
  detailPanelOpen: false,

  fetchStoryboards: async (projectId, episodeId) => {
    const url = episodeId
      ? `/api/storyboards?projectId=${projectId}&episodeId=${episodeId}`
      : `/api/storyboards?projectId=${projectId}`
    const res = await fetch(url)
    if (!res.ok) return
    const data = await res.json()
    set({ storyboards: data || [] })
  },

  fetchEpisodes: async (projectId) => {
    const res = await fetch(`/api/episodes?projectId=${projectId}`)
    if (!res.ok) return
    const data = await res.json()
    set({ episodes: data || [] })
  },

  fetchScripts: async (projectId) => {
    const res = await fetch(`/api/scripts?projectId=${projectId}`)
    if (!res.ok) return
    const data = await res.json()
    set({ scripts: data || [] })
  },

  generateStoryboards: async (projectId, episodeIds, scriptSceneIds, mode = "skip_existing") => {
    set({ generateStatus: "generating", generateError: null, generateProgress: null })
    try {
      const res = await fetch("/api/storyboards/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, episodeIds, scriptSceneIds, mode }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "生成失败")
      }
      const data = await res.json()
      set({
        storyboards: data.storyboards || [],
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

  createStoryboard: async (projectId, scriptSceneId) => {
    const res = await fetch("/api/storyboards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, scriptSceneId }),
    })
    if (!res.ok) throw new Error("创建分镜板失败")
    const sb = await res.json()
    set({ storyboards: [...get().storyboards, sb] })
  },

  updateStoryboard: async (storyboardId, data) => {
    const res = await fetch(`/api/storyboards/${storyboardId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error("更新分镜板失败")
    const updated = await res.json()
    set({ storyboards: get().storyboards.map((sb) => (sb.id === storyboardId ? { ...sb, ...updated } : sb)) })
  },

  deleteStoryboard: async (storyboardId) => {
    const res = await fetch(`/api/storyboards/${storyboardId}`, { method: "DELETE" })
    if (!res.ok) throw new Error("删除分镜板失败")
    set({ storyboards: get().storyboards.filter((sb) => sb.id !== storyboardId) })
  },

  addShot: async (storyboardId, data) => {
    const res = await fetch(`/api/storyboards/${storyboardId}/shots`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error("添加镜头失败")
    const shots: Shot[] = await res.json()
    set({
      storyboards: get().storyboards.map((sb) =>
        sb.id === storyboardId ? { ...sb, shots, status: "edited" as const } : sb
      ),
    })
  },

  updateShot: async (storyboardId, shotId, data) => {
    const res = await fetch(`/api/storyboards/${storyboardId}/shots/${shotId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error("更新镜头失败")
    const updated: Shot = await res.json()
    set({
      storyboards: get().storyboards.map((sb) =>
        sb.id === storyboardId
          ? { ...sb, shots: sb.shots.map((s) => (s.id === shotId ? updated : s)), status: "edited" as const }
          : sb
      ),
    })
  },

  deleteShot: async (storyboardId, shotId) => {
    const res = await fetch(`/api/storyboards/${storyboardId}/shots/${shotId}`, { method: "DELETE" })
    if (!res.ok) throw new Error("删除镜头失败")
    const shots: Shot[] = await res.json()
    set({
      storyboards: get().storyboards.map((sb) =>
        sb.id === storyboardId ? { ...sb, shots } : sb
      ),
    })
  },

  duplicateShot: async (storyboardId, shotId) => {
    const sb = get().storyboards.find((s) => s.id === storyboardId)
    const shot = sb?.shots.find((s) => s.id === shotId)
    if (!shot) return
    await get().addShot(storyboardId, {
      shotSize: shot.shotSize,
      cameraMovement: shot.cameraMovement,
      cameraAngle: shot.cameraAngle,
      composition: shot.composition,
      prompt: shot.prompt,
      negativePrompt: shot.negativePrompt || undefined,
      duration: shot.duration,
      scriptLineIds: shot.scriptLineIds || undefined,
      dialogueText: shot.dialogueText || undefined,
      actionNote: shot.actionNote || undefined,
      insertAfter: shotId,
    })
  },

  reorderShots: async (storyboardId, orderedIds) => {
    const res = await fetch(`/api/storyboards/${storyboardId}/shots/reorder`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds }),
    })
    if (!res.ok) throw new Error("排序失败")
    const shots: Shot[] = await res.json()
    set({
      storyboards: get().storyboards.map((sb) =>
        sb.id === storyboardId ? { ...sb, shots } : sb
      ),
    })
  },

  moveShot: async (shotId, sourceStoryboardId, targetStoryboardId, targetIndex) => {
    const res = await fetch("/api/storyboards/shots/move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shotId, sourceStoryboardId, targetStoryboardId, targetIndex }),
    })
    if (!res.ok) throw new Error("移动镜头失败")
    const { source, target } = await res.json()
    set({
      storyboards: get().storyboards.map((sb) => {
        if (sb.id === sourceStoryboardId) return { ...sb, shots: source.shots }
        if (sb.id === targetStoryboardId) return { ...sb, shots: target.shots }
        return sb
      }),
    })
  },

  optimizePrompt: async (storyboardId, shotId) => {
    const sb = get().storyboards.find((s) => s.id === storyboardId)
    const shot = sb?.shots.find((s) => s.id === shotId)
    if (!shot) throw new Error("镜头不存在")
    const res = await fetch(`/api/storyboards/${storyboardId}/shots/${shotId}/optimize-prompt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPrompt: shot.prompt }),
    })
    if (!res.ok) throw new Error("优化失败")
    return await res.json()
  },

  setActiveEpisodeId: (episodeId) => set({ activeEpisodeId: episodeId }),
  setActiveShotId: (shotId) => set({ activeShotId: shotId, detailPanelOpen: !!shotId }),
  setDetailPanelOpen: (open) => set({ detailPanelOpen: open, activeShotId: open ? get().activeShotId : null }),

  toggleShotSelection: (shotId) => {
    const selected = new Set(get().selectedShotIds)
    if (selected.has(shotId)) {
      selected.delete(shotId)
    } else {
      selected.add(shotId)
    }
    set({ selectedShotIds: selected })
  },

  clearShotSelection: () => set({ selectedShotIds: new Set() }),

  confirmStoryboards: async (projectId) => {
    const res = await fetch("/api/storyboards/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || "确认分镜失败")
    }
  },

  activeEpisodeStoryboards: () => {
    const { storyboards, activeEpisodeId } = get()
    if (!activeEpisodeId) return storyboards
    return storyboards.filter(
      (sb) => sb.scriptScene?.script?.episodeId === activeEpisodeId
    )
  },

  activeShot: () => {
    const { storyboards, activeShotId } = get()
    if (!activeShotId) return null
    for (const sb of storyboards) {
      const shot = sb.shots.find((s) => s.id === activeShotId)
      if (shot) return { shot, storyboard: sb }
    }
    return null
  },

  nextShot: () => {
    const { storyboards, activeShotId, activeEpisodeId } = get()
    if (!activeShotId) return null
    const episodeSbs = activeEpisodeId
      ? storyboards.filter((sb) => sb.scriptScene?.script?.episodeId === activeEpisodeId)
      : storyboards
    const allShots = episodeSbs.flatMap((sb) => sb.shots.map((s) => ({ shot: s, storyboard: sb })))
    const idx = allShots.findIndex((item) => item.shot.id === activeShotId)
    return idx >= 0 && idx < allShots.length - 1 ? allShots[idx + 1] : null
  },

  prevShot: () => {
    const { storyboards, activeShotId, activeEpisodeId } = get()
    if (!activeShotId) return null
    const episodeSbs = activeEpisodeId
      ? storyboards.filter((sb) => sb.scriptScene?.script?.episodeId === activeEpisodeId)
      : storyboards
    const allShots = episodeSbs.flatMap((sb) => sb.shots.map((s) => ({ shot: s, storyboard: sb })))
    const idx = allShots.findIndex((item) => item.shot.id === activeShotId)
    return idx > 0 ? allShots[idx - 1] : null
  },

  episodeStoryboardStatus: (episodeId) => {
    const { storyboards, scripts, generateStatus } = get()
    if (generateStatus === "generating") return "generating"
    const episodeScripts = scripts.filter((s) => s.episodeId === episodeId)
    const allSceneIds = episodeScripts.flatMap((s) => s.scenes.map((sc) => sc.id))
    if (allSceneIds.length === 0) return "none"
    const generatedCount = storyboards.filter(
      (sb) => allSceneIds.includes(sb.scriptSceneId) && sb.shots.length > 0
    ).length
    if (generatedCount === 0) return "none"
    if (generatedCount < allSceneIds.length) return "partial"
    return "generated"
  },

  storyboardStats: () => {
    const { storyboards, scripts } = get()
    const totalScenes = scripts.reduce((sum, s) => sum + s.scenes.length, 0)
    const generatedSbs = storyboards.filter((sb) => sb.shots.length > 0)
    const totalShots = storyboards.reduce((sum, sb) => sum + sb.shots.length, 0)
    const totalDurationSec = storyboards.reduce(
      (sum, sb) => sum + sb.shots.reduce((ss, s) => ss + (parseFloat(s.duration) || 0), 0),
      0
    )
    const shotSizeDistribution: Record<string, number> = {}
    for (const sb of storyboards) {
      for (const s of sb.shots) {
        shotSizeDistribution[s.shotSize] = (shotSizeDistribution[s.shotSize] || 0) + 1
      }
    }
    return {
      storyboardCount: generatedSbs.length,
      totalShots,
      avgShotsPerScene: generatedSbs.length > 0 ? Math.round((totalShots / generatedSbs.length) * 10) / 10 : 0,
      totalDuration: `${Math.round(totalDurationSec)}s`,
      shotSizeDistribution,
      coverage: `${generatedSbs.length}/${totalScenes}`,
      totalScenes,
    }
  },

  reset: () => {
    set({
      storyboards: [],
      episodes: [],
      scripts: [],
      generateStatus: "idle",
      generateError: null,
      generateProgress: null,
      activeEpisodeId: null,
      activeShotId: null,
      selectedShotIds: new Set(),
      detailPanelOpen: false,
    })
  },
}))
