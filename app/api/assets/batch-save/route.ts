import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { throwCutGoError, withError } from "@/lib/api-error"
import { buildEpisodeAssetData, extractEpisodeAssetIds } from "@/lib/utils"

type AssetStrategy = "save" | "keep" | "rename"

interface CharacterItem {
  name: string
  role?: "protagonist" | "supporting" | "extra"
  gender?: string
  prompt?: string
  strategy: AssetStrategy
}

interface SceneItem {
  name: string
  prompt?: string
  tags?: string
  strategy: AssetStrategy
}

interface PropItem {
  name: string
  prompt?: string
  strategy: AssetStrategy
}

export const POST = withError(async (request: NextRequest) => {
  const body = await request.json()
  const {
    projectId,
    episodeId,
    characters = [],
    scenes = [],
    props = [],
  } = body as {
    projectId: string
    episodeId: string
    characters?: CharacterItem[]
    scenes?: SceneItem[]
    props?: PropItem[]
  }

  if (!projectId) {
    throwCutGoError("MISSING_PARAMS", "projectId is required")
  }
  if (!episodeId) {
    throwCutGoError("MISSING_PARAMS", "episodeId is required")
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true },
  })
  if (!project) {
    throwCutGoError("NOT_FOUND", "项目不存在")
  }

  const episode = await prisma.episode.findUnique({
    where: { id: episodeId },
    include: { episodeAssets: true },
  })
  if (!episode) {
    throwCutGoError("NOT_FOUND", "分集不存在")
  }

  // ── 保存资产 ──
  const [savedCharacters, savedScenes, savedProps] = await Promise.all([
    Promise.all(
      characters.map(async (c) => {
        if (c.strategy === "save") {
          return prisma.assetCharacter.upsert({
            where: { projectId_name: { projectId, name: c.name } },
            create: {
              projectId,
              name: c.name,
              role: c.role ?? "supporting",
              gender: c.gender ?? null,
              prompt: c.prompt ?? null,
            },
            update: {
              role: c.role ?? "supporting",
              gender: c.gender ?? null,
              prompt: c.prompt ?? null,
            },
          })
        }
        if (c.strategy === "keep") {
          const existing = await prisma.assetCharacter.findUnique({
            where: { projectId_name: { projectId, name: c.name } },
          })
          if (existing) return existing
          return prisma.assetCharacter.create({
            data: {
              projectId,
              name: c.name,
              role: c.role ?? "supporting",
              gender: c.gender ?? null,
              prompt: c.prompt ?? null,
            },
          })
        }
        // rename
        return prisma.assetCharacter.create({
          data: {
            projectId,
            name: c.name,
            role: c.role ?? "supporting",
            gender: c.gender ?? null,
            prompt: c.prompt ?? null,
          },
        })
      })
    ),
    Promise.all(
      scenes.map(async (s) => {
        if (s.strategy === "save") {
          return prisma.assetScene.upsert({
            where: { projectId_name: { projectId, name: s.name } },
            create: {
              projectId,
              name: s.name,
              prompt: s.prompt ?? null,
              tags: s.tags ?? null,
            },
            update: {
              prompt: s.prompt ?? null,
              tags: s.tags ?? null,
            },
          })
        }
        if (s.strategy === "keep") {
          const existing = await prisma.assetScene.findUnique({
            where: { projectId_name: { projectId, name: s.name } },
          })
          if (existing) return existing
          return prisma.assetScene.create({
            data: {
              projectId,
              name: s.name,
              prompt: s.prompt ?? null,
              tags: s.tags ?? null,
            },
          })
        }
        // rename
        return prisma.assetScene.create({
          data: {
            projectId,
            name: s.name,
            prompt: s.prompt ?? null,
            tags: s.tags ?? null,
          },
        })
      })
    ),
    Promise.all(
      props.map(async (p) => {
        if (p.strategy === "save") {
          return prisma.assetProp.upsert({
            where: { projectId_name: { projectId, name: p.name } },
            create: {
              projectId,
              name: p.name,
              prompt: p.prompt ?? null,
            },
            update: {
              prompt: p.prompt ?? null,
            },
          })
        }
        if (p.strategy === "keep") {
          const existing = await prisma.assetProp.findUnique({
            where: { projectId_name: { projectId, name: p.name } },
          })
          if (existing) return existing
          return prisma.assetProp.create({
            data: {
              projectId,
              name: p.name,
              prompt: p.prompt ?? null,
            },
          })
        }
        // rename
        return prisma.assetProp.create({
          data: {
            projectId,
            name: p.name,
            prompt: p.prompt ?? null,
          },
        })
      })
    ),
  ])

  // ── 绑定到 episode（去重追加） ──
  const existing = extractEpisodeAssetIds(episode.episodeAssets)
  const existingCharacterIds = new Set<string>(existing.characterIds)
  const existingSceneIds = new Set<string>(existing.sceneIds)
  const existingPropIds = new Set<string>(existing.propIds)

  savedCharacters.forEach((c) => existingCharacterIds.add(c.id))
  savedScenes.forEach((s) => existingSceneIds.add(s.id))
  savedProps.forEach((p) => existingPropIds.add(p.id))

  await prisma.$transaction([
    prisma.episodeAsset.deleteMany({ where: { episodeId } }),
    prisma.episodeAsset.createMany({
      data: buildEpisodeAssetData(
        episodeId,
        Array.from(existingCharacterIds),
        Array.from(existingSceneIds),
        Array.from(existingPropIds)
      ),
    }),
  ])

  return NextResponse.json({
    stats: {
      characterCount: savedCharacters.length,
      sceneCount: savedScenes.length,
      propCount: savedProps.length,
    },
  })
})
