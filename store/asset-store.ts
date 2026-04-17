import { create } from "zustand"
import type {
  AssetCharacter,
  AssetScene,
  AssetProp,
  AssetCharacterInput,
  AssetSceneInput,
  AssetPropInput,
} from "@/lib/types"
import { apiFetch } from "@/lib/api-client"

const ASSET_POLL_INTERVAL_MS = 10000

let assetPollTimer: ReturnType<typeof setTimeout> | null = null
let assetPollProjectId: string | null = null

function collectGeneratingAssets(
  characters: AssetCharacter[],
  scenes: AssetScene[],
  props: AssetProp[]
): Record<string, boolean> {
  const generating: Record<string, boolean> = {}

  for (const asset of [...characters, ...scenes, ...props]) {
    if (asset.imageStatus === "generating") {
      generating[asset.id] = true
    }
  }

  return generating
}

function stopAssetPolling() {
  if (assetPollTimer) {
    clearTimeout(assetPollTimer)
    assetPollTimer = null
  }
  assetPollProjectId = null
}

function scheduleAssetPolling(projectId: string) {
  if (assetPollTimer && assetPollProjectId === projectId) {
    return
  }

  if (assetPollProjectId && assetPollProjectId !== projectId) {
    stopAssetPolling()
  }

  assetPollProjectId = projectId
  assetPollTimer = setTimeout(async () => {
    assetPollTimer = null

    const store = useAssetStore.getState()
    try {
      await store.fetchAssets(projectId)
    } catch {
      // ignore polling errors
    }

    const nextStore = useAssetStore.getState()
    if (Object.keys(nextStore.generatingAssets).length > 0) {
      scheduleAssetPolling(projectId)
    } else {
      stopAssetPolling()
    }
  }, ASSET_POLL_INTERVAL_MS)
}

interface AssetState {
  characters: AssetCharacter[]
  scenes: AssetScene[]
  props: AssetProp[]
  generatingAssets: Record<string, boolean>

  fetchAssets: (projectId: string) => Promise<void>

  addCharacter: (projectId: string, data: AssetCharacterInput) => Promise<void>
  updateCharacter: (id: string, data: Partial<AssetCharacterInput>) => Promise<void>
  deleteCharacter: (id: string) => Promise<void>
  deleteCharacters: (ids: string[]) => Promise<void>

  addScene: (projectId: string, data: AssetSceneInput) => Promise<void>
  updateScene: (id: string, data: Partial<AssetSceneInput>) => Promise<void>
  deleteScene: (id: string) => Promise<void>
  deleteScenes: (ids: string[]) => Promise<void>

  addProp: (projectId: string, data: AssetPropInput) => Promise<void>
  updateProp: (id: string, data: Partial<AssetPropInput>) => Promise<void>
  deleteProp: (id: string) => Promise<void>
  deleteProps: (ids: string[]) => Promise<void>

  assetStats: () => {
    characterCount: number
    sceneCount: number
    propCount: number
    totalCount: number
  }

  reset: () => void
}

export const useAssetStore = create<AssetState>((set, get) => ({
  characters: [],
  scenes: [],
  props: [],
  generatingAssets: {},

  fetchAssets: async (projectId) => {
    try {
      const data = await apiFetch<{ characters?: AssetCharacter[]; scenes?: AssetScene[]; props?: AssetProp[] }>(
        `/api/assets?projectId=${projectId}`
      )
      const characters = data.characters || []
      const scenes = data.scenes || []
      const props = data.props || []
      const generatingAssets = collectGeneratingAssets(characters, scenes, props)

      set({
        characters,
        scenes,
        props,
        generatingAssets,
      })

      if (Object.keys(generatingAssets).length > 0) {
        scheduleAssetPolling(projectId)
      } else if (assetPollProjectId === projectId) {
        stopAssetPolling()
      }
    } catch {
      // 非关键数据加载，静默失败
    }
  },

  addCharacter: async (projectId, data) => {
    const character = await apiFetch<AssetCharacter>("/api/assets/characters", {
      method: "POST",
      body: { projectId, ...data },
    })
    set({ characters: [...get().characters, character] })
  },

  updateCharacter: async (id, data) => {
    const updated = await apiFetch<AssetCharacter>(`/api/assets/characters/${id}`, {
      method: "PATCH",
      body: data,
    })
    set((state) => {
      const characters = state.characters.map((c) => (c.id === id ? updated : c))
      return {
        characters,
        generatingAssets: collectGeneratingAssets(characters, state.scenes, state.props),
      }
    })
  },

  deleteCharacter: async (id) => {
    await apiFetch(`/api/assets/characters/${id}`, { method: "DELETE" })
    set((state) => {
      const characters = state.characters.filter((c) => c.id !== id)
      return {
        characters,
        generatingAssets: collectGeneratingAssets(characters, state.scenes, state.props),
      }
    })
  },

  deleteCharacters: async (ids) => {
    await Promise.all(ids.map((id) => apiFetch(`/api/assets/characters/${id}`, { method: "DELETE" })))
    set((state) => {
      const characters = state.characters.filter((c) => !ids.includes(c.id))
      return {
        characters,
        generatingAssets: collectGeneratingAssets(characters, state.scenes, state.props),
      }
    })
  },

  addScene: async (projectId, data) => {
    const scene = await apiFetch<AssetScene>("/api/assets/scenes", {
      method: "POST",
      body: { projectId, ...data },
    })
    set({ scenes: [...get().scenes, scene] })
  },

  updateScene: async (id, data) => {
    const updated = await apiFetch<AssetScene>(`/api/assets/scenes/${id}`, {
      method: "PATCH",
      body: data,
    })
    set((state) => {
      const scenes = state.scenes.map((s) => (s.id === id ? updated : s))
      return {
        scenes,
        generatingAssets: collectGeneratingAssets(state.characters, scenes, state.props),
      }
    })
  },

  deleteScene: async (id) => {
    await apiFetch(`/api/assets/scenes/${id}`, { method: "DELETE" })
    set((state) => {
      const scenes = state.scenes.filter((s) => s.id !== id)
      return {
        scenes,
        generatingAssets: collectGeneratingAssets(state.characters, scenes, state.props),
      }
    })
  },

  deleteScenes: async (ids) => {
    await Promise.all(ids.map((id) => apiFetch(`/api/assets/scenes/${id}`, { method: "DELETE" })))
    set((state) => {
      const scenes = state.scenes.filter((s) => !ids.includes(s.id))
      return {
        scenes,
        generatingAssets: collectGeneratingAssets(state.characters, scenes, state.props),
      }
    })
  },

  addProp: async (projectId, data) => {
    const prop = await apiFetch<AssetProp>("/api/assets/props", {
      method: "POST",
      body: { projectId, ...data },
    })
    set({ props: [...get().props, prop] })
  },

  updateProp: async (id, data) => {
    const updated = await apiFetch<AssetProp>(`/api/assets/props/${id}`, {
      method: "PATCH",
      body: data,
    })
    set((state) => {
      const props = state.props.map((p) => (p.id === id ? updated : p))
      return {
        props,
        generatingAssets: collectGeneratingAssets(state.characters, state.scenes, props),
      }
    })
  },

  deleteProp: async (id) => {
    await apiFetch(`/api/assets/props/${id}`, { method: "DELETE" })
    set((state) => {
      const props = state.props.filter((p) => p.id !== id)
      return {
        props,
        generatingAssets: collectGeneratingAssets(state.characters, state.scenes, props),
      }
    })
  },

  deleteProps: async (ids) => {
    await Promise.all(ids.map((id) => apiFetch(`/api/assets/props/${id}`, { method: "DELETE" })))
    set((state) => {
      const props = state.props.filter((p) => !ids.includes(p.id))
      return {
        props,
        generatingAssets: collectGeneratingAssets(state.characters, state.scenes, props),
      }
    })
  },

  assetStats: () => {
    const { characters, scenes, props } = get()
    return {
      characterCount: characters.length,
      sceneCount: scenes.length,
      propCount: props.length,
      totalCount: characters.length + scenes.length + props.length,
    }
  },

  reset: () => {
    stopAssetPolling()
    set({
      characters: [],
      scenes: [],
      props: [],
      generatingAssets: {},
    })
  },
}))
