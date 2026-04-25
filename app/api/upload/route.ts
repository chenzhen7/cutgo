import { NextRequest, NextResponse } from "next/server"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { randomUUID } from "node:crypto"
import { throwCutGoError, withError } from "@/lib/api-error"

const PUBLIC_DIR = path.join(process.cwd(), "public")

function extFromMimeType(mimeType: string): string {
  const normalized = mimeType.toLowerCase()
  if (normalized.includes("jpeg") || normalized.includes("jpg")) return "jpg"
  if (normalized.includes("webp")) return "webp"
  if (normalized.includes("gif")) return "gif"
  if (normalized.includes("png")) return "png"
  if (normalized.includes("mp4")) return "mp4"
  if (normalized.includes("webm")) return "webm"
  if (normalized.includes("mov")) return "mov"
  return "bin"
}

export const POST = withError(async (request: NextRequest) => {
  const formData = await request.formData()
  const file = formData.get("file") as File | null
  const projectId = formData.get("projectId") as string | null
  const type = formData.get("type") as string | null

  if (!file) throwCutGoError("MISSING_PARAMS", "缺少文件")
  if (!projectId) throwCutGoError("MISSING_PARAMS", "缺少 projectId")
  if (!type || (type !== "image" && type !== "video")) {
    throwCutGoError("VALIDATION", "类型必须是 image 或 video")
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const ext = extFromMimeType(file.type)
  const rootDir = type === "image" ? "uploaded-images" : "uploaded-videos"
  const relativeDir = path.join(rootDir, projectId)
  const outputDir = path.join(PUBLIC_DIR, relativeDir)
  await mkdir(outputDir, { recursive: true })

  const fileName = `${Date.now()}-${randomUUID()}.${ext}`
  const absolutePath = path.join(outputDir, fileName)
  await writeFile(absolutePath, buffer)

  const normalizedRelative = path.posix.join(rootDir, projectId, fileName)
  return NextResponse.json({ url: `/${normalizedRelative}` })
})
