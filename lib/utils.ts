import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseJsonArray<T>(val: string | null | undefined): T[] {
  if (!val) return []
  try {
    const parsed = JSON.parse(val)
    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch {
    return []
  }
}

// ── Episode / Shot Asset 关联表序列化工具 ──

export interface EpisodeAssetItem {
  assetType: string
  assetId: string
}

export interface ShotAssetItem {
  assetType: string
  assetId: string
}

export function extractEpisodeAssetIds(assets: EpisodeAssetItem[]) {
  return {
    characterIds: assets.filter((a) => a.assetType === "character").map((a) => a.assetId),
    sceneIds: assets.filter((a) => a.assetType === "scene").map((a) => a.assetId),
    propIds: assets.filter((a) => a.assetType === "prop").map((a) => a.assetId),
  }
}

export function extractShotAssetIds(assets: ShotAssetItem[]) {
  const characters = assets.filter((a) => a.assetType === "character").map((a) => a.assetId)
  const scenes = assets.filter((a) => a.assetType === "scene").map((a) => a.assetId)
  const props = assets.filter((a) => a.assetType === "prop").map((a) => a.assetId)
  return {
    characterIds: characters,
    sceneId: scenes[0] ?? null,
    propIds: props,
  }
}

export function buildEpisodeAssetData(
  episodeId: string,
  characterIds: string[] | undefined,
  sceneIds: string[] | undefined,
  propIds: string[] | undefined
) {
  const data: { episodeId: string; assetType: string; assetId: string }[] = []
  characterIds?.forEach((id) => data.push({ episodeId, assetType: "character", assetId: id }))
  sceneIds?.forEach((id) => data.push({ episodeId, assetType: "scene", assetId: id }))
  propIds?.forEach((id) => data.push({ episodeId, assetType: "prop", assetId: id }))
  return data
}

export function buildShotAssetData(
  shotId: string,
  characterIds: string[] | undefined,
  sceneId: string | null | undefined,
  propIds: string[] | undefined
) {
  const data: { shotId: string; assetType: string; assetId: string }[] = []
  characterIds?.forEach((id) => data.push({ shotId, assetType: "character", assetId: id }))
  if (sceneId) data.push({ shotId, assetType: "scene", assetId: sceneId })
  propIds?.forEach((id) => data.push({ shotId, assetType: "prop", assetId: id }))
  return data
}
