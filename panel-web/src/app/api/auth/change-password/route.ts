import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { query } from "@/lib/db"
import bcrypt from "bcryptjs"
import { z } from "zod"

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }

  const { currentPassword, newPassword } = parsed.data

  // Obtener el hash actual
  const result = await query<{ password_hash: string }>(
    `SELECT password_hash FROM panel_users WHERE id = $1 AND activa = true`,
    [session.user.id]
  )
  const user = result.rows[0]
  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
  }

  // Verificar contraseña actual
  const valid = await bcrypt.compare(currentPassword, user.password_hash)
  if (!valid) {
    return NextResponse.json({ error: "La contraseña actual es incorrecta" }, { status: 400 })
  }

  // Guardar nueva
  const newHash = await bcrypt.hash(newPassword, 12)
  await query(
    `UPDATE panel_users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
    [newHash, session.user.id]
  )

  return NextResponse.json({ ok: true })
}
