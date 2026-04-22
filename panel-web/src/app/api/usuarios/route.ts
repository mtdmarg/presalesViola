import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { getUsuarios, createUsuario } from "@/lib/queries/usuarios"
import { z } from "zod"

const createSchema = z.object({
  username: z.string().min(3).max(100),
  full_name: z.string().optional().default(""),
  role: z.enum(["admin", "viewer"]),
  activa: z.boolean().default(true),
  password: z.string().min(8),
  access_token: z.string().min(1),
  chatwoot_id: z.number().int().positive(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }
  const usuarios = await getUsuarios()
  return NextResponse.json(usuarios)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const usuario = await createUsuario(parsed.data)
    return NextResponse.json(usuario, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : ""
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return NextResponse.json({ error: "El nombre de usuario ya existe" }, { status: 409 })
    }
    throw err
  }
}
