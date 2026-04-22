import { notFound } from "next/navigation"
import Link from "next/link"
import { auth } from "@/auth"
import { getLeadById } from "@/lib/queries/leads"
import { query } from "@/lib/db"
import { getConversationMessages } from "@/lib/chatwoot"
import PageHeader from "@/components/layout/PageHeader"
import LeadEditForm from "@/components/leads/LeadEditForm"
import ConversationThread from "@/components/lead-detail/ConversationThread"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import type { ChatwootMessage } from "@/types/chatwoot"

export const dynamic = "force-dynamic"

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const leadId = parseInt(id, 10)
  if (isNaN(leadId)) notFound()

  const [lead, session] = await Promise.all([getLeadById(leadId), auth()])
  if (!lead) notFound()

  const userToken = session?.user?.access_token ?? undefined

  // Conversación Chatwoot — usa los campos directos del lead
  let messages: ChatwootMessage[] | null = null
  let chatwootError: string | undefined

  const hasConversation = lead.id_cuenta != null && lead.id_conversacion != null

  if (hasConversation) {
    try {
      messages = await getConversationMessages(lead.id_cuenta!, lead.id_conversacion!, { userToken })
    } catch (err) {
      chatwootError = err instanceof Error ? err.message : "Error desconocido"
    }
  }

  // Auto-liberar conversación si fue tomada pero pasaron más de 24hs desde el último mensaje
  let conversacionTomada = lead.conversacion_tomada ?? false
  if (conversacionTomada && messages && messages.length > 0) {
    const lastMessage = messages[messages.length - 1]
    const secondsElapsed = Date.now() / 1000 - lastMessage.created_at
    if (secondsElapsed > 86400) {
      await query(`UPDATE leads SET conversacion_tomada = false WHERE id = $1`, [leadId])
      conversacionTomada = false
    }
  }

  return (
    <div>
      <PageHeader
        title={lead.nombre ?? `Lead #${lead.id}`}
        description={`ID: ${lead.id} · ${lead.telefono ?? "Sin teléfono"}`}
        breadcrumbs={[{ label: "Leads", href: "/leads" }, { label: lead.nombre ?? `#${lead.id}` }]}
        action={
          <Link href="/leads">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ArrowLeft size={14} />
              Volver
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Columna izquierda — formulario de edición */}
        <div className="xl:max-h-[calc(100vh-12rem)] xl:overflow-y-auto space-y-4">
          <LeadEditForm lead={lead} />
        </div>

        {/* Columna derecha */}
        <div className="xl:max-h-[calc(100vh-12rem)] xl:overflow-hidden">
          <ConversationThread
            messages={messages}
            error={chatwootError}
            conversacionTomada={conversacionTomada}
            leadId={lead.id}
          />
        </div>
      </div>
    </div>
  )
}
