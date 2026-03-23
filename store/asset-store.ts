import { create } from "zustand"
import type {
  AssetCharacter,
  AssetScene,
  AssetProp,
  AssetCharacterInput,
  AssetSceneInput,
  AssetPropInput,
} from "@/lib/types"

interface AssetState {
  characters: AssetCharacter[]
  scenes: AssetScene[]
  props: AssetProp[]

  fetchAssets: (projectId: string) => Promise<void>

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

  fetchAssets: async (projectId) => {
    const res = await fetch(`/api/assets?projectId=${projectId}`)
    if (!res.ok) return
    const data = await res.json()
    set({
      characters: data.characters || [],
      scenes: data.scenes || [],
      props: data.props || [],
    })
  },

  addCharacter: async (projectId, data) => {
    const res = await fetch("/api/assets/characters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, ...data }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || "添加角色失败")
    }
    const character = await res.json()
    set({ characters: [...get().characters, character] })
  },

  updateCharacter: async (id, data) => {
    const res = await fetch(`/api/assets/characters/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || "更新角色失败")
    }
    const updated = await res.json()
    set({ characters: get().characters.map((c) => (c.id === id ? updated : c)) })
  },

  deleteCharacter: async (id) => {
    const res = await fetch(`/api/assets/characters/${id}`, { method: "DELETE" })
    if (!res.ok) throw new Error("删除角色失败")
    set({ characters: get().characters.filter((c) => c.id !== id) })
  },

  addScene: async (projectId, data) => {
    const res = await fetch("/api/assets/scenes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, ...data }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || "添加场景失败")
    }
    const scene = await res.json()
    set({ scenes: [...get().scenes, scene] })
  },

  updateScene: async (id, data) => {
    const res = await fetch(`/api/assets/scenes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || "更新场景失败")
    }
    const updated = await res.json()
    set({ scenes: get().scenes.map((s) => (s.id === id ? updated : s)) })
  },

  deleteScene: async (id) => {
    const res = await fetch(`/api/assets/scenes/${id}`, { method: "DELETE" })
    if (!res.ok) throw new Error("删除场景失败")
    set({ scenes: get().scenes.filter((s) => s.id !== id) })
  },

  addProp: async (projectId, data) => {
    const res = await fetch("/api/assets/props", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, ...data }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || "添加道具失败")
    }
    const prop = await res.json()
    set({ props: [...get().props, prop] })
  },

  updateProp: async (id, data) => {
    const res = await fetch(`/api/assets/props/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || "更新道具失败")
    }
    const updated = await res.json()
    set({ props: get().props.map((p) => (p.id === id ? updated : p)) })
  },

  deleteProp: async (id) => {
    const res = await fetch(`/api/assets/props/${id}`, { method: "DELETE" })
    if (!res.ok) throw new Error("删除道具失败")
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
    })
  },
}))
