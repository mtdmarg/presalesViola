import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { query } from "@/lib/db"
import { assignConversation } from "@/lib/chatwoot"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const leadId = parseInt(id, 10)
  if (isNaN(leadId)) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const tomada = body.tomada !== false // default true

  // Actualizar flag en DB
  await query(`UPDATE leads SET conversacion_tomada = $1 WHERE id = $2`, [tomada, leadId])

  // Asignar / desasignar en Chatwoot
  const leadResult = await query<{ id_cuenta: number; id_conversacion: number }>(
    `SELECT id_cuenta, id_conversacion FROM leads WHERE id = $1`,
    [leadId]
  )
  const lead = leadResult.rows[0]

  if (lead?.id_cuenta && lead?.id_conversacion && session.user.access_token) {
    const assigneeId = tomada ? (session.user.chatwoot_id ?? null) : null
    await assignConversation(
      lead.id_cuenta,
      lead.id_conversacion,
      assigneeId,
      session.user.access_token
    )
  }

  return NextResponse.json({ ok: true })
}
