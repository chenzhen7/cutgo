import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { projectId, ...data } = body

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 })
  }

  const prop = await prisma.assetProp.create({
    data: { projectId, ...data },
  })

  return NextResponse.json(prop, { status: 201 })
}
