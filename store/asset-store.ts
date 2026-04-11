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

interface AssetState {
  characters: AssetCharacter[]
  scenes: AssetScene[]
  props: AssetProp[]
  generatingAssets: Record<string, boolean>

  fetchAssets: (projectId: string) => Promise<void>
  setGeneratingAsset: (id: string, isGenerating: boolean) => void

  addCharacter: (projectId: string, data: AssetCharacterInput) => Promise<void>
  updateCharacter: (id: string, data: Partial<AssetCharacterInput>) => Promise<void>
  deleteCharacter: (id: string) => Promise<void>

  addScene: (projectId: string, data: AssetSceneInput) => Promise<void>
  updateScene: (id: string, data: Partial<AssetSceneInput>) => Promise<void>
  deleteScene: (id: string) => Promise<void>

  addProp: (projectId: string, data: AssetPropInput) => Promise<void>
  updateProp: (id: string, data: Partial<AssetPropInput>) => Promise<void>
  deleteProp: (id: string) => Promise<void>

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

  setGeneratingAsset: (id, isGenerating) => {
    set((state) => {
      const newGenerating = { ...state.generatingAssets }
      if (isGenerating) {
        newGenerating[id] = true
      } else {
        delete newGenerating[id]
      }
      return { generatingAssets: newGenerating }
    })
  },

  fetchAssets: async (projectId) => {
    try {
      const data = await apiFetch<{ characters?: AssetCharacter[]; scenes?: AssetScene[]; props?: AssetProp[] }>(
        `/api/assets?projectId=${projectId}`
      )
      set({
        characters: data.characters || [],
        scenes: data.scenes || [],
        props: data.props || [],
      })
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
    set({ characters: get().characters.map((c) => (c.id === id ? updated : c)) })
  },

  deleteCharacter: async (id) => {
    await apiFetch(`/api/assets/characters/${id}`, { method: "DELETE" })
    set({ characters: get().characters.filter((c) => c.id !== id) })
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
    set({ scenes: get().scenes.map((s) => (s.id === id ? updated : s)) })
  },

  deleteScene: async (id) => {
    await apiFetch(`/api/assets/scenes/${id}`, { method: "DELETE" })
    set({ scenes: get().scenes.filter((s) => s.id !== id) })
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
    set({ props: get().props.map((p) => (p.id === id ? updated : p)) })
  },

  deleteProp: async (id) => {
    await apiFetch(`/api/assets/props/${id}`, { method: "DELETE" })
    set({ props: get().props.filter((p) => p.id !== id) })
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
    set({
      characters: [],
      scenes: [],
      props: [],
      generatingAssets: {},
    })
  },
}))
