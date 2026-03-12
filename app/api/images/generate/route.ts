import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

interface GenerateImageRequest {
  shotId: string
  imageType: "keyframe" | "first_last" | "multi_grid"
  prompt: string
  promptEnd?: string
  gridPrompts?: string[]
  gridLayout?: string
  negativePrompt?: string
  aspectRatio?: string
  stylePreset?: string
}

function makePlaceholderUrl(
  prompt: string,
  width: number,
  height: number,
  index?: number
): string {
  const label = encodeURIComponent(
    (index != null ? `#${index + 1} ` : "") +
      prompt.slice(0, 30).replace(/[^\w\s]/g, "")
  )
  const colors = ["264653", "2a9d8f", "e9c46a", "f4a261", "e76f51", "606c38"]
  const bg = colors[Math.floor(Math.random() * colors.length)]
  return `https://placehold.co/${width}x${height}/${bg}/white?text=${label}`
}

// --- Placeholder generators (replace with real AI service) ---

async function generateKeyframe(
  prompt: string,
  _negativePrompt?: string,
  aspectRatio?: string,
  _stylePreset?: string
): Promise<string> {
  // TODO: Replace with real AI image generation (DALL-E, Flux, ComfyUI, etc.)
  const [w, h] = aspectRatio === "16:9" ? [768, 432] : [432, 768]
  await new Promise((r) => setTimeout(r, 800))
  return makePlaceholderUrl(prompt, w, h)
}

async function generateFirstLast(
  prompt: string,
  promptEnd: string,
  _negativePrompt?: string,
  aspectRatio?: string,
  _stylePreset?: string
): Promise<[string, string]> {
  // TODO: Replace with real AI image generation
  const [w, h] = aspectRatio === "16:9" ? [768, 432] : [432, 768]
  await new Promise((r) => setTimeout(r, 1200))
  return [
    makePlaceholderUrl("首帧 " + prompt, w, h, 0),
    makePlaceholderUrl("尾帧 " + promptEnd, w, h, 1),
  ]
}

async function generateMultiGrid(
  gridPrompts: string[],
  _gridLayout: string,
  _negativePrompt?: string,
  aspectRatio?: string,
  _stylePreset?: string
): Promise<string> {
  // TODO: Replace with real AI image generation + grid stitching
  const [w, h] = aspectRatio === "16:9" ? [768, 432] : [432, 768]
  await new Promise((r) => setTimeout(r, 1500))
  const summary = gridPrompts.map((p, i) => `${i + 1}:${p.slice(0, 12)}`).join("|")
  return makePlaceholderUrl(summary, w, h)
}

export async function POST(request: NextRequest) {
  const body: GenerateImageRequest = await request.json()
  const { shotId, imageType, prompt, promptEnd, gridPrompts, gridLayout, negativePrompt, aspectRatio, stylePreset } = body

  if (!shotId || !prompt) {
    return NextResponse.json({ error: "shotId and prompt are required" }, { status: 400 })
  }

  const shot = await prisma.shot.findUnique({ where: { id: shotId } })
  if (!shot) {
    return NextResponse.json({ error: "Shot not found" }, { status: 404 })
  }

  try {
    const type = imageType || "keyframe"

    if (type === "keyframe") {
      const imageUrl = await generateKeyframe(prompt, negativePrompt, aspectRatio, stylePreset)
      const updated = await prisma.shot.update({
        where: { id: shotId },
        data: { imageUrl, imageType: "keyframe", imageUrls: null },
      })
      return NextResponse.json({ shotId, imageUrl, imageType: "keyframe", shot: updated })
    }

    if (type === "first_last") {
      if (!promptEnd) {
        return NextResponse.json({ error: "promptEnd is required for first_last type" }, { status: 400 })
      }
      const [firstUrl, lastUrl] = await generateFirstLast(prompt, promptEnd, negativePrompt, aspectRatio, stylePreset)
      const imageUrls = JSON.stringify([firstUrl, lastUrl])
      const updated = await prisma.shot.update({
        where: { id: shotId },
        data: { imageUrl: firstUrl, imageType: "first_last", imageUrls, promptEnd },
      })
      return NextResponse.json({ shotId, imageUrl: firstUrl, imageUrls: [firstUrl, lastUrl], imageType: "first_last", shot: updated })
    }

    if (type === "multi_grid") {
      if (!gridPrompts?.length || !gridLayout) {
        return NextResponse.json({ error: "gridPrompts and gridLayout are required for multi_grid type" }, { status: 400 })
      }
      const imageUrl = await generateMultiGrid(gridPrompts, gridLayout, negativePrompt, aspectRatio, stylePreset)
      const updated = await prisma.shot.update({
        where: { id: shotId },
        data: {
          imageUrl,
          imageType: "multi_grid",
          imageUrls: null,
          gridLayout,
          gridPrompts: JSON.stringify(gridPrompts),
        },
      })
      return NextResponse.json({ shotId, imageUrl, imageType: "multi_grid", shot: updated })
    }

    return NextResponse.json({ error: "Invalid imageType" }, { status: 400 })
  } catch (err) {
    console.error("Image generation failed:", err)
    return NextResponse.json({ error: "Image generation failed" }, { status: 500 })
  }
}
