import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { projectId, ...data } = body

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 })
  }

  if (data.name) {
    const existing = await prisma.assetCharacter.findUnique({
      where: { projectId_name: { projectId, name: data.name } },
    })
    if (existing) {
      return NextResponse.json({ error: `角色名「${data.name}」已存在，请使用不同的名称` }, { status: 409 })
    }
  }

  const character = await prisma.assetCharacter.create({
    data: { projectId, ...data },
  })

  return NextResponse.json(character, { status: 201 })
}
