import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { projectId, ...data } = body

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 })
  }

  const character = await prisma.assetCharacter.create({
    data: { projectId, ...data },
  })

  return NextResponse.json(character, { status: 201 })
}
