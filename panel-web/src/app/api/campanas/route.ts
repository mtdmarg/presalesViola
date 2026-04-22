import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { getCampanas, createCampana } from "@/lib/queries/campanas"
import { z } from "zod"

const createSchema = z.object({
  tipo: z.string().min(1),
  source_id: z.string().min(1),
  nombre_campana: z.string().min(1),
  modelo: z.string().optional().default(""),
  tipo_venta: z.string().optional().default(""),
  plan_interes: z.string().optional().default(""),
  activa: z.boolean().default(true),
  notas: z.string().optional().default(""),
})

export async function GET(_req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }
  const campanas = await getCampanas()
  return NextResponse.json(campanas)
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

  const campana = await createCampana(parsed.data)
  return NextResponse.json(campana, { status: 201 })
}
