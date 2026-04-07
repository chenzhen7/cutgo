import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { randomUUID } from "node:crypto"

const PUBLIC_DIR = path.join(process.cwd(), "public")
const ROOT_RELATIVE_DIR = "generated-videos"

function extFromMimeType(mimeType?: string): string {
  if (!mimeType) return "mp4"
  const normalized = mimeType.toLowerCase()
  if (normalized.includes("mp4")) return "mp4"
  if (normalized.includes("webm")) return "webm"
  if (normalized.includes("mov")) return "mov"
  return "mp4"
}

export async function fetchRemoteVideo(sourceUrl: string): Promise<{ buffer: Buffer; mimeType?: string }> {
  const response = await fetch(sourceUrl, {
    signal: AbortSignal.timeout(3000_000), // 5 minutes timeout for video downloading
  })
  if (!response.ok) {
    throw new Error(`Fetch video failed: ${response.status} ${response.statusText}`)
  }
  const arrayBuffer = await response.arrayBuffer()
  return {
    buffer: Buffer.from(arrayBuffer),
    mimeType: response.headers.get("content-type") ?? undefined,
  }
}

export async function persistGeneratedVideoLocally(params: {
  sourceUrl: string
  projectId: string
  scope: "shot" | "episode"
}): Promise<string> {
  const { sourceUrl, projectId, scope } = params

  if (!sourceUrl) {
    throw new Error("sourceUrl is required")
  }
  if (sourceUrl.startsWith("/")) {
    return sourceUrl // Already local
  }

  let buffer: Buffer
  let mimeType: string | undefined

  if (sourceUrl.startsWith("http://") || sourceUrl.startsWith("https://")) {
    const fetched = await fetchRemoteVideo(sourceUrl)
    buffer = fetched.buffer
    mimeType = fetched.mimeType
  } else {
    throw new Error("Unsupported video URL format")
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
