import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { getDashboardStats } from "@/lib/queries/stats"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const stats = await getDashboardStats()
  return NextResponse.json(stats)
}
