import { create } from "zustand"
import type {
  ScriptShotPlan,
  Shot,
  ShotInput,
  ScriptShotGenerateStatus,
  ScriptShotGenerateProgress,
  Episode,
  Script,
  AssetCharacter,
  AssetScene,
  AssetProp,
} from "@/lib/types"
import { apiFetch } from "@/lib/api-client"

interface ScriptShotState {
  scriptShotPlans: ScriptShotPlan[]
  episodes: Episode[]
  scripts: Script[]
  assetCharacters: AssetCharacter[]
  assetScenes: AssetScene[]
  assetProps: AssetProp[]
  generateStatus: ScriptShotGenerateStatus
  generateError: string | null
  generateProgress: ScriptShotGenerateProgress | null

  activeEpisodeId: string | null
  activeShotId: string | null
  selectedShotIds: Set<string>
  detailPanelOpen: boolean

  imageGeneratingIds: Set<string>
  batchImageStatus: "idle" | "generating" | "completed" | "error"
  batchImageProgress: { current: number; total: number } | null

  fetchScriptShotPlans: (projectId: string, episodeId?: string) => Promise<void>
  fetchEpisodes: (projectId: string) => Promise<Episode[]>
  fetchScripts: (projectId: string) => Promise<void>
  fetchAssets: (projectId: string) => Promise<void>

  generateScriptShots: (
    projectId: string,
    episodeIds?: string[],
    scriptIds?: string[],
    mode?: "skip_existing" | "overwrite"
  ) => Promise<void>

  createScriptShotPlan: (projectId: string, scriptId: string) => Promise<void>
  updateScriptShotPlan: (scriptId: string, data: { status?: string }) => Promise<void>
  deleteScriptShotPlan: (scriptId: string) => Promise<void>

  addShot: (scriptId: string, data: ShotInput) => Promise<void>
  updateShot: (scriptId: string, shotId: string, data: Partial<ShotInput>) => Promise<void>
  deleteShot: (scriptId: string, shotId: string) => Promise<void>
  duplicateShot: (scriptId: string, shotId: string) => Promise<void>
  reorderShots: (scriptId: string, orderedIds: string[]) => Promise<void>

  moveShot: (
    shotId: string,
    sourceScriptId: string,
    targetScriptId: string,
    targetIndex: number
  ) => Promise<void>

  optimizePrompt: (scriptId: string, shotId: string) => Promise<{ optimizedPrompt: string; negativePrompt: string }>

  generateImage: (scriptId: string, shotId: string) => Promise<void>
  generateBatchImages: (projectId: string, options?: { episodeId?: string; mode?: "all" | "missing_only" }) => Promise<void>
  clearImage: (scriptId: string, shotId: string) => Promise<void>

  setActiveEpisodeId: (episodeId: string | null) => void
  setActiveShotId: (shotId: string | null) => void
  setDetailPanelOpen: (open: boolean) => void
  toggleShotSelection: (shotId: string) => void
  clearShotSelection: () => void

  confirmScriptShots: (projectId: string) => Promise<void>

  activeEpisodeScriptShots: () => ScriptShotPlan[]
  activeShot: () => { shot: Shot; scriptShotPlan: ScriptShotPlan } | null
  nextShot: () => { shot: Shot; scriptShotPlan: ScriptShotPlan } | null
  prevShot: () => { shot: Shot; scriptShotPlan: ScriptShotPlan } | null
  episodeScriptShotStatus: (episodeId: string) => "none" | "partial" | "generated" | "generating" | "error"
  scriptShotStats: () => {
    scriptCount: number
    totalShots: number
    avgShotsPerScript: number
    coverage: string
    totalScripts: number
  }

  reset: () => void
}

export const useScriptShotsStore = create<ScriptShotState>((set, get) => ({
  scriptShotPlans: [],
  episodes: [],
  scripts: [],
  assetCharacters: [],
  assetScenes: [],
  assetProps: [],
  generateStatus: "idle",
  generateError: null,
  generateProgress: null,
  activeEpisodeId: null,
  activeShotId: null,
  selectedShotIds: new Set(),
  detailPanelOpen: false,

  imageGeneratingIds: new Set(),
  batchImageStatus: "idle",
  batchImageProgress: null,

  fetchScriptShotPlans: async (projectId, episodeId) => {
    try {
      const url = episodeId
        ? `/api/script-shots?projectId=${projectId}&episodeId=${episodeId}`
        : `/api/script-shots?projectId=${projectId}`
      const data = await apiFetch<ScriptShotPlan[]>(url)
      set({ scriptShotPlans: data || [] })
    } catch {
      // 非关键数据加载，静默失败
    }
  },

  fetchEpisodes: async (projectId) => {
    try {
      const data = await apiFetch<Episode[]>(`/api/episodes?projectId=${projectId}`)
      set({ episodes: data || [] })
      return data || []
    } catch {
      return []
    }
  },

  fetchScripts: async (projectId) => {
    try {
      const data = await apiFetch<Script[]>(`/api/scripts?projectId=${projectId}`)
      set({ scripts: data || [] })
    } catch {
      // 非关键数据加载，静默失败
    }
  },

  fetchAssets: async (projectId) => {
    try {
      const data = await apiFetch<{ characters?: AssetCharacter[]; scenes?: AssetScene[]; props?: AssetProp[] }>(
        `/api/assets?projectId=${projectId}`
      )
      set({
        assetCharacters: data.characters || [],
        assetScenes: data.scenes || [],
        assetProps: data.props || [],
      })
    } catch {
      // 非关键数据加载，静默失败
    }
  },

  generateScriptShots: async (projectId, episodeIds, scriptIds, mode = "skip_existing") => {
    set({ generateStatus: "generating", generateError: null, generateProgress: null })
    try {
      const data = await apiFetch<{ scriptShotPlans?: ScriptShotPlan[] }>("/api/script-shots/generate", {
        method: "POST",
        body: { projectId, episodeIds, scriptIds, mode },
      })
      set({
        scriptShotPlans: data.scriptShotPlans || [],
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

  createScriptShotPlan: async (projectId, scriptId) => {
    const sb = await apiFetch<ScriptShotPlan>("/api/script-shots", {
      method: "POST",
      body: { projectId, scriptId },
    })
    set({ scriptShotPlans: [...get().scriptShotPlans, sb] })
  },

  updateScriptShotPlan: async (scriptId, data) => {
    const updated = await apiFetch<ScriptShotPlan>(`/api/script-shots/${scriptId}`, {
      method: "PATCH",
      body: data,
    })
    set({ scriptShotPlans: get().scriptShotPlans.map((sb) => (sb.id === scriptId ? { ...sb, ...updated } : sb)) })
  },

  deleteScriptShotPlan: async (scriptId) => {
    await apiFetch(`/api/script-shots/${scriptId}`, { method: "DELETE" })
    set({ scriptShotPlans: get().scriptShotPlans.filter((sb) => sb.id !== scriptId) })
  },

  addShot: async (scriptId, data) => {
    const shots = await apiFetch<Shot[]>(`/api/script-shots/${scriptId}/shots`, {
      method: "POST",
      body: data,
    })
    set({
      scriptShotPlans: get().scriptShotPlans.map((sb) =>
        sb.id === scriptId ? { ...sb, shots, status: "edited" as const } : sb
      ),
    })
  },

  updateShot: async (scriptId, shotId, data) => {
    const updated = await apiFetch<Shot>(`/api/script-shots/${scriptId}/shots/${shotId}`, {
      method: "PATCH",
      body: data,
    })
    set({
      scriptShotPlans: get().scriptShotPlans.map((sb) =>
        sb.id === scriptId
          ? { ...sb, shots: sb.shots.map((s) => (s.id === shotId ? updated : s)), status: "edited" as const }
          : sb
      ),
    })
  },

  deleteShot: async (scriptId, shotId) => {
    const shots = await apiFetch<Shot[]>(`/api/script-shots/${scriptId}/shots/${shotId}`, {
      method: "DELETE",
    })
    set({
      scriptShotPlans: get().scriptShotPlans.map((sb) =>
        sb.id === scriptId ? { ...sb, shots } : sb
      ),
    })
  },

  duplicateShot: async (scriptId, shotId) => {
    const sb = get().scriptShotPlans.find((s) => s.id === scriptId)
    const shot = sb?.shots.find((s) => s.id === shotId)
    if (!shot) return
    await get().addShot(scriptId, {
      shotSize: "medium",
      composition: shot.composition,
      prompt: shot.prompt,
      negativePrompt: shot.negativePrompt || undefined,
      scriptLineIds: shot.scriptLineIds || undefined,
      dialogueText: shot.dialogueText || undefined,
      actionNote: shot.actionNote || undefined,
      characterIds: shot.characterIds || undefined,
      sceneId: shot.sceneId || undefined,
      propIds: shot.propIds || undefined,
      insertAfter: shotId,
    })
  },

  reorderShots: async (scriptId, orderedIds) => {
    const shots = await apiFetch<Shot[]>(`/api/script-shots/${scriptId}/shots/reorder`, {
      method: "PUT",
      body: { orderedIds },
    })
    set({
      scriptShotPlans: get().scriptShotPlans.map((sb) =>
        sb.id === scriptId ? { ...sb, shots } : sb
      ),
    })
  },

  moveShot: async (shotId, sourceScriptId, targetScriptId, targetIndex) => {
    const { source, target } = await apiFetch<{ source: { shots: Shot[] }; target: { shots: Shot[] } }>(
      "/api/script-shots/shots/move",
      {
        method: "POST",
        body: { shotId, sourceScriptId, targetScriptId, targetIndex },
      }
    )
    set({
      scriptShotPlans: get().scriptShotPlans.map((sb) => {
        if (sb.id === sourceScriptId) return { ...sb, shots: source.shots }
        if (sb.id === targetScriptId) return { ...sb, shots: target.shots }
        return sb
      }),
    })
  },

  optimizePrompt: async (scriptId, shotId) => {
    const sb = get().scriptShotPlans.find((s) => s.id === scriptId)
    const shot = sb?.shots.find((s) => s.id === shotId)
    if (!shot) throw new Error("镜头不存在")
    return apiFetch<{ optimizedPrompt: string; negativePrompt: string }>(
      `/api/script-shots/${scriptId}/shots/${shotId}/optimize-prompt`,
      { method: "POST", body: { currentPrompt: shot.prompt } }
    )
  },

  generateImage: async (scriptId, shotId) => {
    const sb = get().scriptShotPlans.find((s) => s.id === scriptId)
    const shot = sb?.shots.find((s) => s.id === shotId)
    if (!shot) return

    const generating = new Set(get().imageGeneratingIds)
    generating.add(shotId)
    set({ imageGeneratingIds: generating })

    try {
      const body: Record<string, unknown> = {
        shotId,
        imageType: shot.imageType || "keyframe",
        prompt: shot.prompt,
        negativePrompt: shot.negativePrompt,
      }
      if (shot.imageType === "first_last") {
        body.promptEnd = shot.promptEnd || shot.prompt
      }
      if (shot.imageType === "multi_grid") {
        body.gridPrompts = shot.gridPrompts ? JSON.parse(shot.gridPrompts) : [shot.prompt]
        body.gridLayout = shot.gridLayout || "2x2"
      }

      const data = await apiFetch<{ shot: Shot }>("/api/images/generate", {
        method: "POST",
        body,
      })
      const updatedShot = data.shot

      set({
        scriptShotPlans: get().scriptShotPlans.map((s) =>
          s.id === scriptId
            ? { ...s, shots: s.shots.map((sh) => (sh.id === shotId ? updatedShot : sh)) }
            : s
        ),
      })
    } finally {
      const after = new Set(get().imageGeneratingIds)
      after.delete(shotId)
      set({ imageGeneratingIds: after })
    }
  },

  generateBatchImages: async (projectId, options) => {
    set({ batchImageStatus: "generating", batchImageProgress: null })
    try {
      const data = await apiFetch<{
        results: Array<{ status: string; shotId: string; imageUrl?: string; imageUrls?: string[] }>
        stats: { total: number }
      }>("/api/images/generate-batch", {
        method: "POST",
        body: {
          projectId,
          episodeId: options?.episodeId,
          mode: options?.mode || "missing_only",
        },
      })

      const resultMap = new Map<string, { imageUrl?: string; imageUrls?: string[] }>()
      for (const r of data.results) {
        if (r.status === "success") {
          resultMap.set(r.shotId, { imageUrl: r.imageUrl, imageUrls: r.imageUrls })
        }
      }

      set({
        scriptShotPlans: get().scriptShotPlans.map((sb) => ({
          ...sb,
          shots: sb.shots.map((shot) => {
            const update = resultMap.get(shot.id)
            if (!update) return shot
            return {
              ...shot,
              imageUrl: update.imageUrl || shot.imageUrl,
              imageUrls: update.imageUrls ? JSON.stringify(update.imageUrls) : shot.imageUrls,
            }
          }),
        })),
        batchImageStatus: "completed",
        batchImageProgress: { current: data.stats.total, total: data.stats.total },
      })
    } catch {
      set({ batchImageStatus: "error", batchImageProgress: null })
    }
  },

  clearImage: async (scriptId, shotId) => {
    const updated = await apiFetch<Shot>(`/api/script-shots/${scriptId}/shots/${shotId}`, {
      method: "PATCH",
      body: { imageUrl: null, imageUrls: null },
    })
    set({
      scriptShotPlans: get().scriptShotPlans.map((sb) =>
        sb.id === scriptId
          ? { ...sb, shots: sb.shots.map((s) => (s.id === shotId ? updated : s)) }
          : sb
      ),
    })
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

  confirmScriptShots: async (projectId) => {
    await apiFetch("/api/script-shots/confirm", {
      method: "POST",
      body: { projectId },
    })
  },

  activeEpisodeScriptShots: () => {
    const { scriptShotPlans, activeEpisodeId } = get()
    if (!activeEpisodeId) return scriptShotPlans
    return scriptShotPlans.filter(
      (sb) => sb.script?.episodeId === activeEpisodeId
    )
  },

  activeShot: () => {
    const { scriptShotPlans, activeShotId } = get()
    if (!activeShotId) return null
    for (const sb of scriptShotPlans) {
      const shot = sb.shots.find((s) => s.id === activeShotId)
      if (shot) return { shot, scriptShotPlan: sb }
    }
    return null
  },

  nextShot: () => {
    const { scriptShotPlans, activeShotId, activeEpisodeId } = get()
    if (!activeShotId) return null
    const episodeSbs = activeEpisodeId
      ? scriptShotPlans.filter((sb) => sb.script?.episodeId === activeEpisodeId)
      : scriptShotPlans
    const allShots = episodeSbs.flatMap((sb) => sb.shots.map((s) => ({ shot: s, scriptShotPlan: sb })))
    const idx = allShots.findIndex((item) => item.shot.id === activeShotId)
    return idx >= 0 && idx < allShots.length - 1 ? allShots[idx + 1] : null
  },

  prevShot: () => {
    const { scriptShotPlans, activeShotId, activeEpisodeId } = get()
    if (!activeShotId) return null
    const episodeSbs = activeEpisodeId
      ? scriptShotPlans.filter((sb) => sb.script?.episodeId === activeEpisodeId)
      : scriptShotPlans
    const allShots = episodeSbs.flatMap((sb) => sb.shots.map((s) => ({ shot: s, scriptShotPlan: sb })))
    const idx = allShots.findIndex((item) => item.shot.id === activeShotId)
    return idx > 0 ? allShots[idx - 1] : null
  },

  episodeScriptShotStatus: (episodeId) => {
    const { scriptShotPlans, scripts, generateStatus } = get()
    if (generateStatus === "generating") return "generating"
    const episodeScripts = scripts.filter((s) => s.episodeId === episodeId)
    const scriptIds = episodeScripts.map((s) => s.id)
    if (scriptIds.length === 0) return "none"
    const generatedCount = scriptShotPlans.filter(
      (sb) => scriptIds.includes(sb.scriptId) && sb.shots.length > 0
    ).length
    if (generatedCount === 0) return "none"
    if (generatedCount < scriptIds.length) return "partial"
    return "generated"
  },

  scriptShotStats: () => {
    const { scriptShotPlans, scripts } = get()
    const totalScripts = scripts.length
    const generatedSbs = scriptShotPlans.filter((sb) => sb.shots.length > 0)
    const totalShots = scriptShotPlans.reduce((sum, sb) => sum + sb.shots.length, 0)
    return {
      scriptCount: generatedSbs.length,
      totalShots,
      avgShotsPerScript: generatedSbs.length > 0 ? Math.round((totalShots / generatedSbs.length) * 10) / 10 : 0,
      coverage: `${generatedSbs.length}/${totalScripts}`,
      totalScripts,
    }
  },

  reset: () => {
    set({
      scriptShotPlans: [],
      episodes: [],
      scripts: [],
      assetCharacters: [],
      assetScenes: [],
      assetProps: [],
      generateStatus: "idle",
      generateError: null,
      generateProgress: null,
      activeEpisodeId: null,
      activeShotId: null,
      selectedShotIds: new Set(),
      detailPanelOpen: false,
      imageGeneratingIds: new Set(),
      batchImageStatus: "idle",
      batchImageProgress: null,
    })
  },
}))
