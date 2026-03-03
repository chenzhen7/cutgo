import { create } from "zustand"
import type { Project } from "@/lib/types"

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
      const res = await fetch("/api/projects")
      if (!res.ok) throw new Error("Failed to fetch projects")
      const data = await res.json()
      set({ projects: data, loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  createProject: async (data) => {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error("Failed to create project")
    const project = await res.json()
    set({ projects: [...get().projects, project] })
    return project
  },

  updateProject: async (id, data) => {
    const res = await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error("Failed to update project")
    const project = await res.json()
    set({
      projects: get().projects.map((p) => (p.id === id ? project : p)),
    })
    return project
  },

  deleteProject: async (id) => {
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE" })
    if (!res.ok) throw new Error("Failed to delete project")
    set({ projects: get().projects.filter((p) => p.id !== id) })
  },

  getProject: async (id) => {
    const res = await fetch(`/api/projects/${id}`)
    if (!res.ok) throw new Error("Failed to fetch project")
    return res.json()
  },
}))
