import { create } from "zustand"
import type {
  ScriptShotPlan,
  Shot,
  ShotInput,
  ScriptShotGenerateStatus,
  ScriptShotGenerateProgress,
  Episode,
  AssetCharacter,
  AssetScene,
  AssetProp,
  ImageType,
  GridLayout,
} from "@/lib/types"
import type { ShotCardLayout } from "@/app/(project)/project/[id]/shot/components/shot-card"
import { apiFetch } from "@/lib/api-client"
import { parseJsonArray } from "@/lib/utils"
import { toast } from "sonner"

let scriptShotPlansFetchToken = 0

const POLL_INTERVAL_MS = 5000
const MAX_POLL_ATTEMPTS = 72 // 最长 6 分钟

function startVideoPolling(episodeId: string, shotId: string, attempt = 0): void {
  if (attempt >= MAX_POLL_ATTEMPTS) {
    const store = useScriptShotsStore.getState()
    const videoGeneratingIds = new Set(store.videoGeneratingIds)
    videoGeneratingIds.delete(shotId)

    // 找到对应镜头并更新其状态
    const targetPlan = store.scriptShotPlans.find(p => p.id === episodeId)
    const targetShot = targetPlan?.shots.find(s => s.id === shotId)

    if (targetShot) {
      useScriptShotsStore.setState({
        videoGeneratingIds,
        scriptShotPlans: updateShotInPlans(store.scriptShotPlans, episodeId, shotId, {
          ...targetShot,
          videoStatus: "error" as const
        }),
      })
    } else {
      useScriptShotsStore.setState({ videoGeneratingIds })
    }
    toast.error("视频生成超时，请重试")
    return
  }

  setTimeout(async () => {
    try {
      const data = await apiFetch<{ videoStatus: string; videoUrl: string | null; shot: Shot }>(
        `/api/script-shots/${episodeId}/shots/${shotId}/video-status`
      )
      const store = useScriptShotsStore.getState()

      if (data.videoStatus === "completed") {
        const videoGeneratingIds = new Set(store.videoGeneratingIds)
        videoGeneratingIds.delete(shotId)
        useScriptShotsStore.setState({
          videoGeneratingIds,
          scriptShotPlans: updateShotInPlans(store.scriptShotPlans, episodeId, shotId, data.shot),
        })
        toast.success("视频生成完成")
      } else if (data.videoStatus === "error") {
        const videoGeneratingIds = new Set(store.videoGeneratingIds)
        videoGeneratingIds.delete(shotId)
        useScriptShotsStore.setState({
          videoGeneratingIds,
          scriptShotPlans: updateShotInPlans(store.scriptShotPlans, episodeId, shotId, data.shot),
        })
        toast.error("视频生成失败")
      } else {
        startVideoPolling(episodeId, shotId, attempt + 1)
      }
    } catch {
      startVideoPolling(episodeId, shotId, attempt + 1)
    }
  }, POLL_INTERVAL_MS)
}

type ShotWithPlan = { shot: Shot; scriptShotPlan: ScriptShotPlan }

function updateShotInPlans(plans: ScriptShotPlan[], episodeId: string, shotId: string, updatedShot: Shot): ScriptShotPlan[] {
  return plans.map((sb) =>
    sb.id === episodeId
      ? { ...sb, shots: sb.shots.map((s) => (s.id === shotId ? updatedShot : s)) }
      : sb
  )
}

function flattenShotsByActiveEpisode(scriptShotPlans: ScriptShotPlan[], activeEpisodeId: string | null): ShotWithPlan[] {
  const episodeSbs = activeEpisodeId
    ? scriptShotPlans.filter((sb) => sb.episodeId === activeEpisodeId)
    : scriptShotPlans

  return episodeSbs.flatMap((sb) => sb.shots.map((shot) => ({ shot, scriptShotPlan: sb })))
}

interface ScriptShotState {
  scriptShotPlans: ScriptShotPlan[]
  episodes: Episode[]
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
  shotLayout: ShotCardLayout

  imageGeneratingIds: Set<string>
  batchImageStatus: "idle" | "generating" | "completed" | "error"
  batchImageProgress: { current: number; total: number } | null

  videoGeneratingIds: Set<string>
  batchVideoStatus: "idle" | "generating" | "completed" | "error"
  batchVideoProgress: { current: number; total: number } | null

  fetchScriptShotPlans: (projectId: string, episodeId?: string) => Promise<void>
  fetchEpisodes: (projectId: string) => Promise<Episode[]>
  fetchAssets: (projectId: string) => Promise<void>

  generateScriptShots: (
    projectId: string,
    episodeIds?: string[],
    imageType?: ImageType,
    gridLayout?: GridLayout | null
  ) => Promise<void>

  addShot: (episodeId: string, data: ShotInput) => Promise<void>
  updateShot: (episodeId: string, shotId: string, data: Partial<ShotInput>) => Promise<void>
  deleteShot: (episodeId: string, shotId: string) => Promise<void>
  duplicateShot: (episodeId: string, shotId: string) => Promise<void>
  reorderShots: (episodeId: string, orderedIds: string[]) => Promise<void>

  moveShot: (
    shotId: string,
    sourceEpisodeId: string,
    targetEpisodeId: string,
    targetIndex: number
  ) => Promise<void>

  optimizePrompt: (episodeId: string, shotId: string) => Promise<{ optimizedPrompt: string; negativePrompt: string }>

  generateImage: (episodeId: string, shotId: string) => Promise<void>
  generateBatchImages: (projectId: string, options?: { episodeId?: string; mode?: "all" | "missing_only"; shotIds?: string[] }) => Promise<void>
  clearImage: (episodeId: string, shotId: string) => Promise<void>

  generateVideo: (episodeId: string, shotId: string) => Promise<void>
  generateBatchVideos: (projectId: string, options?: { episodeId?: string; mode?: "all" | "missing_only" }) => Promise<void>
  clearVideo: (episodeId: string, shotId: string) => Promise<void>

  setActiveEpisodeId: (episodeId: string | null) => void
  setActiveShotId: (shotId: string | null) => void
  setDetailPanelOpen: (open: boolean) => void
  setShotLayout: (layout: ShotCardLayout) => void
  toggleShotSelection: (shotId: string) => void
  clearShotSelection: () => void

  confirmScriptShots: (projectId: string) => Promise<void>

  activeEpisodeScriptShots: () => ScriptShotPlan[]
  activeShot: () => { shot: Shot; scriptShotPlan: ScriptShotPlan } | null
  nextShot: () => { shot: Shot; scriptShotPlan: ScriptShotPlan } | null
  prevShot: () => { shot: Shot; scriptShotPlan: ScriptShotPlan } | null
  episodeScriptShotStatus: (episodeId: string) => "none" | "partial" | "generated" | "generating" | "error"
  scriptShotStats: () => {
    episodeCount: number
    totalShots: number
    avgShotsPerEpisode: number
    coverage: string
    totalEpisodes: number
  }

  reset: () => void
}

export const useScriptShotsStore = create<ScriptShotState>((set, get) => ({
  scriptShotPlans: [],
  episodes: [],
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
  shotLayout: "list",

  imageGeneratingIds: new Set(),
  batchImageStatus: "idle",
  batchImageProgress: null,

  videoGeneratingIds: new Set(),
  batchVideoStatus: "idle",
  batchVideoProgress: null,

  fetchScriptShotPlans: async (projectId, episodeId) => {
    const currentFetchToken = ++scriptShotPlansFetchToken
    try {
      const url = episodeId
        ? `/api/script-shots?projectId=${projectId}&episodeId=${episodeId}`
        : `/api/script-shots?projectId=${projectId}`

      if (episodeId) {
        set({ scriptShotPlans: [] })
      }

      const data = await apiFetch<ScriptShotPlan[]>(url)

      if (currentFetchToken !== scriptShotPlansFetchToken) {
        return
      }
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

  generateScriptShots: async (projectId, episodeIds, imageType, gridLayout) => {
    set({ generateStatus: "generating", generateError: null, generateProgress: null })
    try {
      const data = await apiFetch<{ scriptShotPlans?: ScriptShotPlan[] }>("/api/script-shots/generate", {
        method: "POST",
        body: { projectId, episodeIds, imageType, gridLayout },
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

  addShot: async (episodeId, data) => {
    const shots = await apiFetch<Shot[]>(`/api/script-shots/${episodeId}/shots`, {
      method: "POST",
      body: data,
    })
    set({
      scriptShotPlans: get().scriptShotPlans.map((sb) =>
        sb.id === episodeId ? { ...sb, shots } : sb
      ),
    })
  },

  updateShot: async (episodeId, shotId, data) => {
    const updated = await apiFetch<Shot>(`/api/script-shots/${episodeId}/shots/${shotId}`, {
      method: "PATCH",
      body: data,
    })
    set({
      scriptShotPlans: updateShotInPlans(get().scriptShotPlans, episodeId, shotId, updated),
    })
  },

  deleteShot: async (episodeId, shotId) => {
    const shots = await apiFetch<Shot[]>(`/api/script-shots/${episodeId}/shots/${shotId}`, {
      method: "DELETE",
    })
    set({
      scriptShotPlans: get().scriptShotPlans.map((sb) =>
        sb.id === episodeId ? { ...sb, shots } : sb
      ),
    })
  },

  duplicateShot: async (episodeId, shotId) => {
    const sb = get().scriptShotPlans.find((s) => s.id === episodeId)
    const shot = sb?.shots.find((s) => s.id === shotId)
    if (!shot) return
    await get().addShot(episodeId, {
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

  reorderShots: async (episodeId, orderedIds) => {
    const shots = await apiFetch<Shot[]>(`/api/script-shots/${episodeId}/shots/reorder`, {
      method: "PUT",
      body: { orderedIds },
    })
    set({
      scriptShotPlans: get().scriptShotPlans.map((sb) =>
        sb.id === episodeId ? { ...sb, shots } : sb
      ),
    })
  },

  moveShot: async (shotId, sourceEpisodeId, targetEpisodeId, targetIndex) => {
    const { source, target } = await apiFetch<{ source: { shots: Shot[] }; target: { shots: Shot[] } }>(
      "/api/script-shots/shots/move",
      {
        method: "POST",
        body: { shotId, sourceEpisodeId, targetEpisodeId, targetIndex },
      }
    )
    set({
      scriptShotPlans: get().scriptShotPlans.map((sb) => {
        if (sb.id === sourceEpisodeId) return { ...sb, shots: source.shots }
        if (sb.id === targetEpisodeId) return { ...sb, shots: target.shots }
        return sb
      }),
    })
  },

  optimizePrompt: async (episodeId, shotId) => {
    const sb = get().scriptShotPlans.find((s) => s.id === episodeId)
    const shot = sb?.shots.find((s) => s.id === shotId)
    if (!shot) throw new Error("镜头不存在")
    return apiFetch<{ optimizedPrompt: string; negativePrompt: string }>(
      `/api/script-shots/${episodeId}/shots/${shotId}/optimize-prompt`,
      { method: "POST", body: { currentPrompt: shot.prompt } }
    )
  },

  generateImage: async (episodeId, shotId) => {
    const sb = get().scriptShotPlans.find((s) => s.id === episodeId)
    const shot = sb?.shots.find((s) => s.id === shotId)
    if (!shot) return

    const { assetCharacters, assetScenes, assetProps } = get()
    const characterIds = parseJsonArray(shot.characterIds)
    const propIds = parseJsonArray(shot.propIds)
    const boundCharacters = assetCharacters.filter((c) => characterIds.includes(c.id))
    const boundScene = shot.sceneId ? assetScenes.find((s) => s.id === shot.sceneId) : null
    const boundProps = assetProps.filter((p) => propIds.includes(p.id))

    const missingAssetNames: string[] = []
    for (const c of boundCharacters) {
      if (!c.imageUrl) missingAssetNames.push(`角色「${c.name}」`)
    }
    if (boundScene && !boundScene.imageUrl) {
      missingAssetNames.push(`场景「${boundScene.name}」`)
    }
    for (const p of boundProps) {
      if (!p.imageUrl) missingAssetNames.push(`道具「${p.name}」`)
    }

    if (missingAssetNames.length > 0) {
      toast.error(`请先补充关联资产图片：${missingAssetNames.join("、")}`)
      return
    }

    const referenceImages: string[] = []
    const refLabels: string[] = []
    let imgIndex = 1
    for (const c of boundCharacters) {
      if (c.imageUrl) {
        referenceImages.push(c.imageUrl)
        refLabels.push(`图${imgIndex}为角色「${c.name}」`)
        imgIndex++
      }
    }
    if (boundScene?.imageUrl) {
      referenceImages.push(boundScene.imageUrl)
      refLabels.push(`图${imgIndex}为场景「${boundScene.name}」`)
      imgIndex++
    }
    for (const p of boundProps) {
      if (p.imageUrl) {
        referenceImages.push(p.imageUrl)
        refLabels.push(`图${imgIndex}为道具「${p.name}」`)
        imgIndex++
      }
    }

    const generating = new Set(get().imageGeneratingIds)
    generating.add(shotId)
    set({ imageGeneratingIds: generating })

    try {
      const body: Record<string, unknown> = {
        shotId,
        imageType: shot.imageType || "keyframe",
        content: shot.content,
        prompt: shot.prompt,
        promptEnd: shot.promptEnd,
        negativePrompt: shot.negativePrompt,
        referenceImages,
        refLabels,
      }

      if (shot.imageType === "multi_grid") {
        body.gridPrompts = shot.gridPrompts ? JSON.parse(shot.gridPrompts) : []
        body.gridLayout = shot.gridLayout || "2x2"
      }

      const data = await apiFetch<{ shot: Shot }>("/api/images/generate", {
        method: "POST",
        body,
      })
      const updatedShot = data.shot

      set({
        scriptShotPlans: updateShotInPlans(get().scriptShotPlans, episodeId, shotId, updatedShot),
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
          shotIds: options?.shotIds,
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

  clearImage: async (episodeId, shotId) => {
    await get().updateShot(episodeId, shotId, { imageUrl: null, imageUrls: null } as any)
  },

  generateVideo: async (episodeId, shotId) => {
    const sb = get().scriptShotPlans.find((s) => s.id === episodeId)
    const shot = sb?.shots.find((s) => s.id === shotId)

    if (!shot?.imageUrl) {
      toast.error("请先生成分镜图片，再进行图生视频")
      return
    }

    const videoGeneratingIds = new Set(get().videoGeneratingIds)
    videoGeneratingIds.add(shotId)
    set({ videoGeneratingIds })

    try {
      const data = await apiFetch<{ shot: Shot }>(
        `/api/script-shots/${episodeId}/shots/${shotId}/generate-video`,
        { method: "POST" }
      )
      set({
        scriptShotPlans: updateShotInPlans(get().scriptShotPlans, episodeId, shotId, data.shot),
      })
      startVideoPolling(episodeId, shotId)
    } catch (err) {
      const after = new Set(get().videoGeneratingIds)
      after.delete(shotId)
      set({ videoGeneratingIds: after })
      toast.error(`视频生成失败：${(err as Error).message}`)
    }
  },

  generateBatchVideos: async (projectId, options) => {
    const { scriptShotPlans } = get()
    const mode = options?.mode ?? "missing_only"
    const episodeId = options?.episodeId

    const plans = episodeId
      ? scriptShotPlans.filter((sb) => sb.episodeId === episodeId)
      : scriptShotPlans

    const targets = plans.flatMap((plan) =>
      plan.shots.filter((s) => {
        if (!s.imageUrl) return false
        if (mode === "missing_only") return !s.videoUrl
        return true
      }).map((s) => ({ episodeId: plan.id, shot: s }))
    )

    if (targets.length === 0) {
      toast.info("没有需要生成视频的镜头（请确认已生成图片）")
      return
    }

    set({ batchVideoStatus: "generating", batchVideoProgress: { current: 0, total: targets.length } })

    let completed = 0
    const total = targets.length

    for (const { episodeId: eId, shot } of targets) {
      try {
        await get().generateVideo(eId, shot.id)
      } catch {
        // 单镜失败不中断批量
      }
      completed++
      set({ batchVideoProgress: { current: completed, total } })
    }

    set({ batchVideoStatus: "completed" })
    setTimeout(() => {
      set({ batchVideoStatus: "idle", batchVideoProgress: null })
    }, 2000)
  },

  clearVideo: async (episodeId, shotId) => {
    await get().updateShot(episodeId, shotId, { videoUrl: null, videoStatus: null, videoDuration: null, videoTaskId: null } as any)
  },

  setActiveEpisodeId: (episodeId) => set({ activeEpisodeId: episodeId }),
  setActiveShotId: (shotId) => set({ activeShotId: shotId, detailPanelOpen: !!shotId }),
  setDetailPanelOpen: (open) => set({ detailPanelOpen: open, activeShotId: open ? get().activeShotId : null }),
  setShotLayout: (layout) => set({ shotLayout: layout }),

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
    return scriptShotPlans.filter((sb) => sb.episodeId === activeEpisodeId)
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
    const allShots = flattenShotsByActiveEpisode(scriptShotPlans, activeEpisodeId)
    const idx = allShots.findIndex((item) => item.shot.id === activeShotId)
    return idx >= 0 && idx < allShots.length - 1 ? allShots[idx + 1] : null
  },

  prevShot: () => {
    const { scriptShotPlans, activeShotId, activeEpisodeId } = get()
    if (!activeShotId) return null
    const allShots = flattenShotsByActiveEpisode(scriptShotPlans, activeEpisodeId)
    const idx = allShots.findIndex((item) => item.shot.id === activeShotId)
    return idx > 0 ? allShots[idx - 1] : null
  },

  episodeScriptShotStatus: (episodeId) => {
    const { scriptShotPlans, generateStatus } = get()
    if (generateStatus === "generating") return "generating"
    const plan = scriptShotPlans.find((sb) => sb.episodeId === episodeId)
    if (!plan || plan.shots.length === 0) return "none"
    return "generated"
  },

  scriptShotStats: () => {
    const { scriptShotPlans, episodes } = get()
    const totalEpisodes = episodes.length
    const generatedSbs = scriptShotPlans.filter((sb) => sb.shots.length > 0)
    const totalShots = scriptShotPlans.reduce((sum, sb) => sum + sb.shots.length, 0)
    return {
      episodeCount: generatedSbs.length,
      totalShots,
      avgShotsPerEpisode: generatedSbs.length > 0 ? Math.round((totalShots / generatedSbs.length) * 10) / 10 : 0,
      coverage: `${generatedSbs.length}/${totalEpisodes}`,
      totalEpisodes,
    }
  },

  reset: () => {
    set({
      scriptShotPlans: [],
      episodes: [],
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
      shotLayout: "list",
      imageGeneratingIds: new Set(),
      batchImageStatus: "idle",
      batchImageProgress: null,
      videoGeneratingIds: new Set(),
      batchVideoStatus: "idle",
      batchVideoProgress: null,
    })
  },
}))
