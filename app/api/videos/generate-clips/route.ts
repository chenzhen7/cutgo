import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    const { shotIds } = await req.json()

    // 这里应该是调用 AI 视频生成服务的逻辑
    // 目前先模拟更新数据库状态
    
    if (shotIds && Array.isArray(shotIds)) {
      await prisma.shot.updateMany({
        where: {
          id: { in: shotIds }
        },
        data: {
          videoStatus: "generating"
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: "视频生成任务已启动"
    })
  } catch (error) {
    console.error("[VIDEO_GEN_ERROR]", error)
    return NextResponse.json(
      { error: "启动视频生成失败" },
      { status: 500 }
    )
  }
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    
    const shots = await prisma.shot.findMany({
      where: {
        storyboard: {
          projectId: projectId
        }
      },
      select: {
        id: true,
        index: true,
        videoUrl: true,
        videoStatus: true,
        imageUrl: true,
        prompt: true
      },
      orderBy: {
        index: "asc"
      }
    })

    return NextResponse.json(shots)
  } catch (error) {
    console.error("[VIDEO_GEN_GET_ERROR]", error)
    return NextResponse.json(
      { error: "获取视频状态失败" },
      { status: 500 }
    )
  }
}
