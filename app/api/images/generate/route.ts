import { NextRequest, NextResponse } from "next/server"
import { throwCutGoError, withError } from "@/lib/api-error"
import { submitShotImageTask } from "@/lib/image-task-service"

interface GenerateImageRequest {
  shotId: string
  imageType?: "keyframe" | "first_last" | "multi_grid"
  content?: string
  lastContent?: string | null
  gridLayout?: string
  negativePrompt?: string
  aspectRatio?: string
  resolution?: string
  referenceImages?: string[]
  refLabels?: string[]
  refImageNote?: string
}

export const POST = withError(async (request: NextRequest) => {
  const body: GenerateImageRequest = await request.json()

  if (!body.shotId) {
    throwCutGoError("MISSING_PARAMS", "shotId is required")
  }

  const result = await submitShotImageTask(body)

  return NextResponse.json({
    success: true,
    shotId: body.shotId,
    taskId: result.taskId,
    shot: result.shot,
  })
})
