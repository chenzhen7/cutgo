"use client"

import { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { AlertCircle, CheckCircle2, Loader2, Paintbrush } from "lucide-react"
import { apiFetch } from "@/lib/api-client"
import type { Project } from "@/lib/types"
import {
  ProjectStyleManagerFields,
  type ProjectStyleManagerValue,
} from "@/app/(project)/project/components/project-style-manager-fields"

type SaveStatus = "idle" | "dirty" | "saving" | "saved" | "error"

function toStyleManagerValue(project: Project): ProjectStyleManagerValue {
  return {
    aspectRatio: project.aspectRatio || "9:16",
    resolution: project.resolution || "1080x1920",
    stylePreset: project.stylePreset,
  }
}

function toSnapshot(value: ProjectStyleManagerValue) {
  return JSON.stringify(value)
}

export default function StylePage() {
  const params = useParams()
  const projectId = params.id as string

  const [value, setValue] = useState<ProjectStyleManagerValue>({
    aspectRatio: "9:16",
    resolution: "1080x1920",
    stylePreset: null,
  })
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")

  const latestValueRef = useRef(value)
  const lastSavedSnapshotRef = useRef("")
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveStateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    latestValueRef.current = value
  }, [value])

  useEffect(() => {
    let active = true

    async function loadProject() {
      try {
        const project = await apiFetch<Project>(`/api/projects/${projectId}`)
        if (!active) return

        const nextValue = toStyleManagerValue(project)
        setValue(nextValue)
        latestValueRef.current = nextValue
        lastSavedSnapshotRef.current = toSnapshot(nextValue)
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadProject()

    return () => {
      active = false
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      if (saveStateTimerRef.current) clearTimeout(saveStateTimerRef.current)
    }
  }, [projectId])

  async function persist(nextValue: ProjectStyleManagerValue) {
    const snapshot = toSnapshot(nextValue)

    if (snapshot === lastSavedSnapshotRef.current) {
      setSaveStatus("saved")
      return
    }

    setSaveStatus("saving")

    try {
      await apiFetch<Project>(`/api/projects/${projectId}`, {
        method: "PATCH",
        body: {
          stylePreset: nextValue.stylePreset,
          aspectRatio: nextValue.aspectRatio,
          resolution: nextValue.resolution,
        },
      })

      lastSavedSnapshotRef.current = snapshot

      if (snapshot === toSnapshot(latestValueRef.current)) {
        setSaveStatus("saved")
        if (saveStateTimerRef.current) clearTimeout(saveStateTimerRef.current)
        saveStateTimerRef.current = setTimeout(() => {
          setSaveStatus((current) => (current === "saved" ? "idle" : current))
        }, 2000)
      } else {
        setSaveStatus("dirty")
      }
    } catch {
      setSaveStatus("error")
    }
  }

  function handleValueChange(nextValue: ProjectStyleManagerValue) {
    setValue(nextValue)
    latestValueRef.current = nextValue

    const snapshot = toSnapshot(nextValue)
    if (snapshot === lastSavedSnapshotRef.current) {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      setSaveStatus("idle")
      return
    }

    setSaveStatus("dirty")

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      void persist(nextValue)
    }, 700)
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-6">
      <div className="flex items-center justify-between gap-4 border-b pb-5">
        <div className="flex items-center gap-3">
          <Paintbrush className="h-5 w-5 text-muted-foreground" />
          <div>
            <h1 className="text-xl font-semibold">视觉风格管理器</h1>
            <p className="text-sm text-muted-foreground">
              在项目启动前锁定风格与画幅，后续生成会默认沿用这些参数。
            </p>
          </div>
        </div>

        <div className="flex min-w-28 items-center justify-end gap-2 text-sm text-muted-foreground">
          {saveStatus === "saving" && (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>保存中...</span>
            </>
          )}
          {saveStatus === "saved" && (
            <>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>已自动保存</span>
            </>
          )}
          {saveStatus === "dirty" && <span>修改后将自动保存</span>}
          {saveStatus === "error" && (
            <>
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span>保存失败</span>
            </>
          )}
        </div>
      </div>

      {!loading && (
        <ProjectStyleManagerFields
          value={value}
          onChange={handleValueChange}
          className="py-6"
        />
      )}
    </div>
  )
}
