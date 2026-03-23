import { create } from "zustand"
import type { Project } from "@/lib/types"
import { apiFetch } from "@/lib/api-client"

interface ProjectState {
  projects: Project[]
  loading: boolean
  error: string | null

  fetchProjects: () => Promise<void>
  createProject: (data: Record<string, unknown>) => Promise<Project>
  updateProject: (id: string, data: Record<string, unknown>) => Promise<Project>
  deleteProject: (id: string) => Promise<void>
  getProject: (id: string) => Promise<Project>
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  loading: false,
  error: null,

  fetchProjects: async () => {
    set({ loading: true, error: null })
    try {
      const data = await apiFetch<Project[]>("/api/projects")
      set({ projects: data, loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  createProject: async (data) => {
    const project = await apiFetch<Project>("/api/projects", { method: "POST", body: data })
    set({ projects: [...get().projects, project] })
    return project
  },

  updateProject: async (id, data) => {
    const project = await apiFetch<Project>(`/api/projects/${id}`, { method: "PATCH", body: data })
    set({ projects: get().projects.map((p) => (p.id === id ? project : p)) })
    return project
  },

  deleteProject: async (id) => {
    await apiFetch(`/api/projects/${id}`, { method: "DELETE" })
    set({ projects: get().projects.filter((p) => p.id !== id) })
  },

  getProject: async (id) => {
    return apiFetch<Project>(`/api/projects/${id}`)
  },
}))
