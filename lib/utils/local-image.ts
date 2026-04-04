import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { randomUUID } from "node:crypto"

const PUBLIC_DIR = path.join(process.cwd(), "public")
const ROOT_RELATIVE_DIR = "generated-images"

function decodeDataUrl(dataUrl: string): { buffer: Buffer; mimeType: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) {
    throw new Error("Invalid data URL format")
  }
  const [, mimeType, base64Data] = match
  return { buffer: Buffer.from(base64Data, "base64"), mimeType }
}

function extFromMimeType(mimeType?: string): string {
  if (!mimeType) return "png"
  const normalized = mimeType.toLowerCase()
  if (normalized.includes("jpeg") || normalized.includes("jpg")) return "jpg"
  if (normalized.includes("webp")) return "webp"
  if (normalized.includes("gif")) return "gif"
  return "png"
}

async function fetchRemoteImage(sourceUrl: string): Promise<{ buffer: Buffer; mimeType?: string }> {
  const response = await fetch(sourceUrl, {
    signal: AbortSignal.timeout(120_000),
  })
  if (!response.ok) {
    throw new Error(`Fetch image failed: ${response.status} ${response.statusText}`)
  }
  const arrayBuffer = await response.arrayBuffer()
  return {
    buffer: Buffer.from(arrayBuffer),
    mimeType: response.headers.get("content-type") ?? undefined,
  }
}

export async function persistGeneratedImageLocally(params: {
  sourceUrl: string
  projectId: string
  scope: "shot" | "asset"
}): Promise<string> {
  const { sourceUrl, projectId, scope } = params

  if (!sourceUrl) {
    throw new Error("sourceUrl is required")
  }
  if (sourceUrl.startsWith("/")) {
    return sourceUrl
  }

  let buffer: Buffer
  let mimeType: string | undefined

  if (sourceUrl.startsWith("data:image/")) {
    const decoded = decodeDataUrl(sourceUrl)
    buffer = decoded.buffer
    mimeType = decoded.mimeType
  } else if (sourceUrl.startsWith("http://") || sourceUrl.startsWith("https://")) {
    const fetched = await fetchRemoteImage(sourceUrl)
    buffer = fetched.buffer
    mimeType = fetched.mimeType
  } else {
    throw new Error("Unsupported image URL format")
  }

  const ext = extFromMimeType(mimeType)
  const relativeDir = path.join(ROOT_RELATIVE_DIR, scope, projectId)
  const outputDir = path.join(PUBLIC_DIR, relativeDir)
  await mkdir(outputDir, { recursive: true })

  const fileName = `${Date.now()}-${randomUUID()}.${ext}`
  const absolutePath = path.join(outputDir, fileName)
  await writeFile(absolutePath, buffer)

  const normalizedRelative = path.posix.join(ROOT_RELATIVE_DIR, scope, projectId, fileName)
  return `/${normalizedRelative}`
}
