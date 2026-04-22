import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { getLeads } from "@/lib/queries/leads"
import { z } from "zod"

const querySchema = z.object({
  q: z.string().optional(),
  tipoventa: z.string().optional(),
  etapa_ciclo_vida: z.string().optional(),
  estado: z.string().optional(),
  fuente: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const parsed = querySchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams)
  )
  if (!parsed.success) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 })
  }

  const result = await getLeads(parsed.data)
  return NextResponse.json(result)
}
