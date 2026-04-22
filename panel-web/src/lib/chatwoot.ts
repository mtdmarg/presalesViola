import type { ChatwootMessage, ChatwootConversation } from "@/types/chatwoot"

interface ParsedChatwootUrl {
  accountId: number
  conversationId: number
}

export function parseChatwootUrl(url: string | null): ParsedChatwootUrl | null {
  if (!url) return null
  const match = url.match(/\/accounts\/(\d+)\/conversations\/(\d+)/)
  if (!match) return null
  return {
    accountId: parseInt(match[1], 10),
    conversationId: parseInt(match[2], 10),
  }
}

export async function getConversationMessages(
  accountId: number,
  conversationId: number,
  { noCache = false, userToken }: { noCache?: boolean; userToken?: string } = {}
): Promise<ChatwootMessage[]> {
  const baseUrl = process.env.CHATWOOT_BASE_URL
  // Preferir el token del usuario; caer al env como fallback
  const rawToken = userToken || process.env.CHATWOOT_API_TOKEN

  if (!baseUrl || !rawToken) {
    throw new Error("Chatwoot no configurado: falta CHATWOOT_BASE_URL o el token de acceso")
  }

  const cleanBase = baseUrl.trim().replace(/\/$/, "")
  const cleanToken = rawToken.trim()
  const baseUrl2 = `${cleanBase}/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`
  const fetchOpts: RequestInit = noCache
    ? { headers: { "api_access_token": cleanToken }, cache: "no-store" }
    : { headers: { "api_access_token": cleanToken }, next: { revalidate: 30 } }

  const allMessages: ChatwootMessage[] = []
  let before: number | null = null
  const PAGE_SIZE = 20

  // Chatwoot pagina de a 20 con cursor ?before={id}. Iteramos hasta obtener una página incompleta.
  while (true) {
    const url = before ? `${baseUrl2}?before=${before}` : baseUrl2
    const res = await fetch(url, fetchOpts)

    if (!res.ok) {
      const body = await res.text().catch(() => "")
      console.error(`[Chatwoot] ${res.status} — ${url} — ${body.slice(0, 300)}`)
      throw new Error(`Error al cargar la conversación (${res.status})`)
    }

    const data = await res.json()
    const page: ChatwootMessage[] = data?.payload?.messages ?? data?.payload ?? []

    allMessages.push(...page)

    // Si la página tiene menos de PAGE_SIZE entradas, es la última
    if (page.length < PAGE_SIZE) break

    // El próximo cursor es el id más bajo de esta página
    const minId = Math.min(...page.map((m) => m.id))
    before = minId
  }

  console.log(`[Chatwoot] conv=${conversationId} — ${allMessages.length} mensajes totales`)

  // Filtrar eventos de sistema (type 2) y ordenar por timestamp, con id como desempate
  return allMessages
    .filter((m) => m.message_type !== 2)
    .sort((a, b) => a.created_at - b.created_at || a.id - b.id)
}

export async function assignConversation(
  accountId: number,
  conversationId: number,
  assigneeId: number | null,
  userToken: string
): Promise<void> {
  const baseUrl = process.env.CHATWOOT_BASE_URL?.trim().replace(/\/$/, "")
  const token = userToken.trim()
  if (!baseUrl || !token) throw new Error("Chatwoot no configurado")

  const res = await fetch(
    `${baseUrl}/api/v1/accounts/${accountId}/conversations/${conversationId}/assignments`,
    {
      method: "POST",
      headers: {
        "api_access_token": token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ assignee_id: assigneeId }),
    }
  )

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    console.error(`[Chatwoot] assignConversation ${res.status} — ${body.slice(0, 300)}`)
    throw new Error(`Error al asignar conversación (${res.status})`)
  }
}

export async function sendMessage(
  accountId: number,
  conversationId: number,
  content: string,
  userToken: string
): Promise<ChatwootMessage> {
  const baseUrl = process.env.CHATWOOT_BASE_URL?.trim().replace(/\/$/, "")
  const token = userToken.trim()

  if (!baseUrl || !token) throw new Error("Chatwoot no configurado")

  const url = `${baseUrl}/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "api_access_token": token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content,
      message_type: "outgoing",
      private: false,
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    console.error(`[Chatwoot] sendMessage ${res.status} — ${body.slice(0, 300)}`)
    throw new Error(`Error al enviar mensaje (${res.status})`)
  }

  return await res.json()
}

export async function getConversationDetail(
  accountId: number,
  conversationId: number
): Promise<ChatwootConversation | null> {
  const baseUrl = process.env.CHATWOOT_BASE_URL
  const token = process.env.CHATWOOT_API_TOKEN

  if (!baseUrl || !token) return null

  try {
    const res = await fetch(
      `${baseUrl}/api/v1/accounts/${accountId}/conversations/${conversationId}`,
      {
        headers: { api_access_token: token },
        next: { revalidate: 30 },
      }
    )
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}
