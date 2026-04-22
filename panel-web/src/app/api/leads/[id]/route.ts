import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { getLeadById } from "@/lib/queries/leads"
import { query } from "@/lib/db"
import { z } from "zod"

const updateSchema = z.object({
  nombre:               z.string().max(150).nullable().optional(),
  telefono:             z.string().max(20).nullable().optional(),
  email:                z.string().max(255).nullable().optional(),
  ciudad:               z.string().max(150).nullable().optional(),
  tipoventa:            z.enum(["PLAN", "CONVENCIONAL", "USADO", "INDEFINIDO"]).nullable().optional(),
  estado:               z.string().max(32).nullable().optional(),
  etapa_ciclo_vida:     z.string().max(50).nullable().optional(),
  origen:               z.string().max(100).nullable().optional(),
  fuente:               z.string().max(100).nullable().optional(),
  modelo_interes:       z.string().max(150).nullable().optional(),
  modelo_version:       z.string().max(50).nullable().optional(),
  plan_interes:         z.string().max(150).nullable().optional(),
  modelo_color:         z.string().max(64).nullable().optional(),
  tiempo_espero_entrega:z.string().max(16).nullable().optional(),
  financiacion:         z.string().max(128).nullable().optional(),
  marca_modelo_usado:   z.string().max(128).nullable().optional(),
  motivo_no_califica:   z.string().nullable().optional(),
  detalle:              z.string().max(128).nullable().optional(),
  resumencliente:       z.string().nullable().optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params
  const leadId = parseInt(id, 10)
  if (isNaN(leadId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 })
  }

  const lead = await getLeadById(leadId)
  if (!lead) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  }

  return NextResponse.json(lead)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const leadId = parseInt(id, 10)
  if (isNaN(leadId)) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })

  const fields = parsed.data
  const keys = Object.keys(fields) as (keyof typeof fields)[]
  if (keys.length === 0) return NextResponse.json({ error: "Sin cambios" }, { status: 400 })

  const setClauses = keys.map((k, i) => `${k} = $${i + 1}`).join(", ")
  const values = keys.map((k) => fields[k] ?? null)

  await query(
    `UPDATE leads SET ${setClauses}, fecha_actualizacion = NOW() WHERE id = $${keys.length + 1}`,
    [...values, leadId]
  )

  return NextResponse.json({ ok: true })
}
