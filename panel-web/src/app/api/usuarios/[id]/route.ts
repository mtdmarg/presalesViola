import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { getUsuarioById, updateUsuario, deleteUsuario } from "@/lib/queries/usuarios"
import { z } from "zod"

const updateSchema = z.object({
  username: z.string().min(3).max(100).optional(),
  full_name: z.string().optional(),
  role: z.enum(["admin", "viewer"]).optional(),
  activa: z.boolean().optional(),
  password: z.string().min(8).optional(),
  access_token: z.string().nullable().optional(),
  chatwoot_id: z.number().int().nullable().optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const { id } = await params
  const usuario = await getUsuarioById(id)
  if (!usuario) return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  return NextResponse.json(usuario)
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
  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }

  const { password, ...rest } = parsed.data

  // Actualizar campos
  const updated = await updateUsuario(id, rest)
  if (!updated) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  // Cambiar contraseña si viene
  if (password) {
    const { resetPassword } = await import("@/lib/queries/usuarios")
    await resetPassword(id, password)
  }

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
  const result = await deleteUsuario(id, session.user.id)

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }
  return NextResponse.json({ ok: true })
}
