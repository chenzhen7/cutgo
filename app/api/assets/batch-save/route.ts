import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { cutGoError, withError } from "@/lib/api-error"

interface CharacterItem {
  name: string
  role?: "protagonist" | "supporting" | "extra"
  gender?: string
  description?: string
  personality?: string
  overwrite?: boolean
}

interface SceneItem {
  name: string
  description?: string
  tags?: string
  overwrite?: boolean
}

interface PropItem {
  name: string
  description?: string
  overwrite?: boolean
}

export const POST = withError(async (request: NextRequest) => {
  const body = await request.json()
  const { projectId, characters = [], scenes = [], props = [] } = body as {
    projectId: string
    characters?: CharacterItem[]
    scenes?: SceneItem[]
    props?: PropItem[]
  }

  if (!projectId) {
    throw cutGoError("MISSING_PARAMS", "projectId is required")
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true },
  })
  if (!project) {
    throw cutGoError("NOT_FOUND", "项目不存在")
  }

  const [savedCharacters, savedScenes, savedProps] = await Promise.all([
    Promise.all(
      characters.map((c) =>
        c.overwrite
          ? prisma.assetCharacter.upsert({
              where: { projectId_name: { projectId, name: c.name } },
              create: {
                projectId,
                name: c.name,
                role: c.role ?? "supporting",
                gender: c.gender ?? null,
                description: c.description ?? null,
                personality: c.personality ?? null,
              },
              update: {
                role: c.role ?? "supporting",
                gender: c.gender ?? null,
                description: c.description ?? null,
                personality: c.personality ?? null,
              },
            })
          : prisma.assetCharacter.create({
              data: {
                projectId,
                name: c.name,
                role: c.role ?? "supporting",
                gender: c.gender ?? null,
                description: c.description ?? null,
                personality: c.personality ?? null,
              },
            })
      )
    ),
    Promise.all(
      scenes.map((s) =>
        s.overwrite
          ? prisma.assetScene.upsert({
              where: { projectId_name: { projectId, name: s.name } },
              create: {
                projectId,
                name: s.name,
                description: s.description ?? null,
                tags: s.tags ?? null,
              },
              update: {
                description: s.description ?? null,
                tags: s.tags ?? null,
              },
            })
          : prisma.assetScene.create({
              data: {
                projectId,
                name: s.name,
                description: s.description ?? null,
                tags: s.tags ?? null,
              },
            })
      )
    ),
    Promise.all(
      props.map((p) =>
        p.overwrite
          ? prisma.assetProp.upsert({
              where: { projectId_name: { projectId, name: p.name } },
              create: {
                projectId,
                name: p.name,
                description: p.description ?? null,
              },
              update: {
                description: p.description ?? null,
              },
            })
          : prisma.assetProp.create({
              data: {
                projectId,
                name: p.name,
                description: p.description ?? null,
              },
            })
      )
    ),
  ])

  return NextResponse.json({
    stats: {
      characterCount: savedCharacters.length,
      sceneCount: savedScenes.length,
      propCount: savedProps.length,
    },
  })
})
