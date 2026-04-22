import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { query } from "@/lib/db"
import { sendMessage } from "@/lib/chatwoot"
import { z } from "zod"

const schema = z.object({
  content: z.string().min(1).max(4096),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const leadId = parseInt(id, 10)
  if (isNaN(leadId)) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })

  // Obtener IDs de Chatwoot desde la DB (no confiar en el cliente)
  const result = await query<{ id_cuenta: number; id_conversacion: number }>(
    `SELECT id_cuenta, id_conversacion FROM leads WHERE id = $1`,
    [leadId]
  )
  const lead = result.rows[0]
  if (!lead?.id_cuenta || !lead?.id_conversacion) {
    console.error(`[mensaje] lead=${leadId} no tiene id_cuenta/id_conversacion — cuenta=${lead?.id_cuenta} conv=${lead?.id_conversacion}`)
    return NextResponse.json({ error: "Conversación no configurada en este lead" }, { status: 422 })
  }

  const userToken = session.user.access_token
  if (!userToken) {
    console.error(`[mensaje] usuario ${session.user.username} no tiene access_token configurado`)
    return NextResponse.json({ error: "Sin token" }, { status: 422 })
  }

  try {
    const message = await sendMessage(lead.id_cuenta, lead.id_conversacion, parsed.data.content, userToken)
    return NextResponse.json({ ok: true, message })
  } catch (err) {
    console.error(`[mensaje] sendMessage falló — lead=${leadId} cuenta=${lead.id_cuenta} conv=${lead.id_conversacion}`, err)
    return NextResponse.json({ error: "Error al enviar" }, { status: 502 })
  }
}
