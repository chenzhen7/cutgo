export const episodeWithShotsInclude = {
  shots: { orderBy: { index: "asc" as const } },
}

export function toScriptShotPlan(episode: {
  id: string
  projectId: string
  index: number
  title: string
  script: string
  shotType: string
  createdAt: Date
  updatedAt: Date
  shots: unknown[]
}) {
  return {
    id: episode.id,
    projectId: episode.projectId,
    episodeId: episode.id,
    episode: {
      id: episode.id,
      index: episode.index,
      title: episode.title,
      script: episode.script,
      shotType: episode.shotType,
    },
    status: episode.script ? "generated" : "draft",
    shots: episode.shots,
    createdAt: episode.createdAt,
    updatedAt: episode.updatedAt,
  }
}
