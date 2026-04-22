import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import {
  getCampanaById,
  updateCampana,
  deleteCampana,
  toggleCampanaActiva,
} from "@/lib/queries/campanas"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const campana = await getCampanaById(parseInt(id, 10))
  if (!campana) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  return NextResponse.json(campana)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const { id } = await params
  const campanaId = parseInt(id, 10)
  const body = await req.json()

  // Toggle rápido de activa (desde la tabla)
  if (Object.keys(body).length === 1 && "activa" in body) {
    await toggleCampanaActiva(campanaId, body.activa)
    return NextResponse.json({ ok: true })
  }

  const updated = await updateCampana(campanaId, body)
  if (!updated) return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  return NextResponse.json(updated)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const { id } = await params
  const result = await deleteCampana(parseInt(id, 10))

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }
  return NextResponse.json({ ok: true })
}
