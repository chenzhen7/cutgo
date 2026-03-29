import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { throwCutGoError, withError } from "@/lib/api-error"

export const GET = withError(
  async (_request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const { id } = await context.params

    const task = await prisma.aiTask.findUnique({
      where: { id },
    })

    if (!task) {
      throwCutGoError("NOT_FOUND", "任务不存在")
    }

    return NextResponse.json(task)
  }
)
