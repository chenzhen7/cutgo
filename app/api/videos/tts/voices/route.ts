import { NextResponse } from "next/server"
import { TTS_VOICES } from "@/lib/types"

export async function GET() {
  return NextResponse.json({ voices: TTS_VOICES })
}
