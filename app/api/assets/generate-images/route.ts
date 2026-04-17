import { NextRequest, NextResponse } from "next/server"
import { withError, throwCutGoError } from "@/lib/api-error"
import { submitAssetImageTask, type AssetType } from "@/lib/image-task-service"

interface GenerateAssetImageRequest {
  type: AssetType
  id: string
}

export const POST = withError(async (request: NextRequest) => {
  const body: GenerateAssetImageRequest = await request.json()
  const { type, id } = body

  if (!type || !id) {
    throwCutGoError("MISSING_PARAMS", "type 和 id 不能为空")
  }
  if (!["character", "scene", "prop"].includes(type)) {
    throwCutGoError("VALIDATION", "type 必须是 character、scene 或 prop")
  }

  const result = await submitAssetImageTask({ type, id })

  return NextResponse.json({
    success: true,
    taskId: result.taskId,
    asset: result.asset,
  })
})
