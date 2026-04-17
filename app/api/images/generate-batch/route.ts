import { NextRequest, NextResponse } from "next/server"
import { throwCutGoError, withError } from "@/lib/api-error"
import { submitBatchShotImageTasks } from "@/lib/image-task-service"

export const POST = withError(async (request: NextRequest) => {
  const body = await request.json()
  const { projectId, episodeId, mode = "missing_only", shotIds } = body

  if (!projectId) {
    throwCutGoError("MISSING_PARAMS", "projectId is required")
  }

  const result = await submitBatchShotImageTasks({
    projectId,
    episodeId,
    mode,
    shotIds,
  })

  return NextResponse.json({
    success: true,
    ...result,
  })
})
