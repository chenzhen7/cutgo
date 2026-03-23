import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

interface AIAssetResult {
  characters: {
    name: string
    role: "protagonist" | "supporting" | "extra"
    gender?: string
    description?: string
    personality?: string
  }[]
  scenes: {
    name: string
    description?: string
    tags?: string
  }[]
  props: {
    name: string
    description?: string
  }[]
}

async function callAIExtractAssets(
  episodes: { title: string; outline: string | null }[]
): Promise<AIAssetResult> {
  const apiKey = process.env.OPENAI_API_KEY
  const baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini"

  if (!apiKey) {
    return extractAssetsLocally(episodes)
  }

  const episodesText = episodes
    .map(
      (ep) =>
        `【${ep.title}】${ep.outline || ""}`
    )
    .join("\n\n")

  const prompt = `你是一位专业的短剧制作资产管理专家。请根据以下分集与场景信息，提取并整理出该项目所需的全部资产。

## 分集与场景
${episodesText}

## 任务
请从以上内容中提取三类资产：

### 1. 角色（characters）
- 提取所有在大纲中出现的角色
- 结合小说原始角色信息补充描述
- 每个角色包含：名字、角色类型（protagonist/supporting/extra）、性别、角色描述、性格描述
- 角色外貌信息请写入 description，不要单独输出外貌字段
- 如果角色来自小说原始角色列表，标注对应关系

### 2. 场景（scenes）
- 提取所有在大纲场景中出现的地点/环境
- 合并相同或相似的场景
- 每个场景包含：名称、环境描述、标签

### 3. 道具（props）
- 提取在剧情中有重要作用的道具/物品
- 每个道具包含：名称、描述

## 输出格式
请严格按以下 JSON 格式输出：

{
  "characters": [
    {
      "name": "角色名",
      "role": "protagonist",
      "gender": "female",
      "description": "角色简介（包含外貌特征、身份背景等）",
      "personality": "性格描述"
    }
  ],
  "scenes": [
    {
      "name": "场景名",
      "description": "场景环境描述",
      "tags": "室内,现代,豪华"
    }
  ],
  "props": [
    {
      "name": "道具名",
      "description": "道具描述"
    }
  ]
}`

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    })

    if (!response.ok) {
      console.error("AI API error:", response.status)
      return extractAssetsLocally(episodes)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) return extractAssetsLocally(episodes)

    const parsed = JSON.parse(content)
    return {
      characters: parsed.characters || [],
      scenes: parsed.scenes || [],
      props: parsed.props || [],
    }
  } catch (err) {
    console.error("AI asset extraction failed, falling back to local:", err)
    return extractAssetsLocally(episodes)
  }
}

function extractAssetsLocally(
  episodes: { title: string; outline: string | null }[]
): AIAssetResult {
  const scenes: AIAssetResult["scenes"] = episodes.map((ep) => ({
    name: ep.title,
    description: (ep.outline || "").slice(0, 100) || undefined,
  }))
  return { characters: [], scenes, props: [] }
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { projectId, mode = "skip_existing" } = body

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 })
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) {
    return NextResponse.json({ error: "项目不存在" }, { status: 404 })
  }

  const episodes = await prisma.episode.findMany({
    where: { projectId },
    orderBy: { index: "asc" },
  })

  if (episodes.length === 0) {
    return NextResponse.json(
      { error: "暂无分集数据，请先在「剧本生成」中按章节创建分集并生成剧本" },
      { status: 400 }
    )
  }


  if (mode === "overwrite") {
    await Promise.all([
      prisma.assetCharacter.deleteMany({ where: { projectId } }),
      prisma.assetScene.deleteMany({ where: { projectId } }),
      prisma.assetProp.deleteMany({ where: { projectId } }),
    ])
  } else {
    const existingCount = await Promise.all([
      prisma.assetCharacter.count({ where: { projectId } }),
      prisma.assetScene.count({ where: { projectId } }),
      prisma.assetProp.count({ where: { projectId } }),
    ])
    const total = existingCount.reduce((a, b) => a + b, 0)
    if (total > 0) {
      const [characters, scenes, props] = await Promise.all([
        prisma.assetCharacter.findMany({ where: { projectId }, orderBy: { createdAt: "asc" } }),
        prisma.assetScene.findMany({ where: { projectId }, orderBy: { createdAt: "asc" } }),
        prisma.assetProp.findMany({ where: { projectId }, orderBy: { createdAt: "asc" } }),
      ])
      return NextResponse.json({
        characters,
        scenes,
        props,
        stats: {
          characterCount: characters.length,
          sceneCount: scenes.length,
          propCount: props.length,
        },
        skipped: true,
      })
    }
  }

  try {
    const aiResult = await callAIExtractAssets(
      episodes.map((ep) => ({
        title: ep.title,
        outline: ep.outline,
      }))
    )

    const createdCharacters = await Promise.all(
      aiResult.characters.map((c) =>
        prisma.assetCharacter.create({
          data: {
            projectId,
            name: c.name,
            role: c.role || "supporting",
            gender: c.gender || null,
            description: c.description || null,
            personality: c.personality || null,
          },
        })
      )
    )

    const createdScenes = await Promise.all(
      aiResult.scenes.map((s) =>
        prisma.assetScene.create({
          data: {
            projectId,
            name: s.name,
            description: s.description || null,
            tags: s.tags || null,
          },
        })
      )
    )

    const createdProps = await Promise.all(
      aiResult.props.map((p) =>
        prisma.assetProp.create({
          data: {
            projectId,
            name: p.name,
            description: p.description || null,
          },
        })
      )
    )

    return NextResponse.json({
      characters: createdCharacters,
      scenes: createdScenes,
      props: createdProps,
      stats: {
        characterCount: createdCharacters.length,
        sceneCount: createdScenes.length,
        propCount: createdProps.length,
      },
    })
  } catch (err) {
    console.error("Asset generation failed:", err)
    return NextResponse.json(
      { error: "资产提取失败: " + (err as Error).message },
      { status: 500 }
    )
  }
}
