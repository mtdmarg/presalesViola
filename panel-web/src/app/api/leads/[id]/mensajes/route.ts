import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { query } from "@/lib/db"
import { getConversationMessages } from "@/lib/chatwoot"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const leadId = parseInt(id, 10)
  if (isNaN(leadId)) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

  const result = await query<{ id_cuenta: number; id_conversacion: number }>(
    `SELECT id_cuenta, id_conversacion FROM leads WHERE id = $1`,
    [leadId]
  )
  const lead = result.rows[0]
  if (!lead?.id_cuenta || !lead?.id_conversacion) {
    return NextResponse.json({ error: "Sin conversación" }, { status: 422 })
  }

  const userToken = session.user.access_token ?? undefined
  const messages = await getConversationMessages(lead.id_cuenta, lead.id_conversacion, { noCache: true, userToken })
  return NextResponse.json({ messages })
}
