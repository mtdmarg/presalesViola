import { query } from "@/lib/db"
import type { Lead, LeadFilters, LeadSummary, UltimoContacto } from "@/types/lead"

const PAGE_SIZE = 20

export async function getLeads(
  filters: LeadFilters = {}
): Promise<{ rows: LeadSummary[]; total: number }> {
  const { q, tipoventa, etapa_ciclo_vida, estado, fuente, page = 1, limit = PAGE_SIZE } = filters

  const conditions: string[] = []
  const params: unknown[] = []
  let idx = 1

  if (q) {
    conditions.push(
      `(nombre ILIKE $${idx} OR email ILIKE $${idx} OR telefono ILIKE $${idx} OR ciudad ILIKE $${idx})`
    )
    params.push(`%${q}%`)
    idx++
  }
  if (tipoventa) {
    conditions.push(`tipoventa = $${idx}`)
    params.push(tipoventa)
    idx++
  }
  if (etapa_ciclo_vida) {
    conditions.push(`etapa_ciclo_vida = $${idx}`)
    params.push(etapa_ciclo_vida)
    idx++
  }
  if (estado) {
    conditions.push(`estado = $${idx}`)
    params.push(estado)
    idx++
  }
  if (fuente) {
    conditions.push(`fuente = $${idx}`)
    params.push(fuente)
    idx++
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""
  const offset = (page - 1) * limit

  const [dataResult, countResult] = await Promise.all([
    query<LeadSummary>(
      `SELECT id, nombre, telefono, email, ciudad, tipoventa,
              modelo_interes, etapa_ciclo_vida, estado, fuente, fecha_creacion
       FROM leads
       ${where}
       ORDER BY fecha_creacion DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    ),
    query<{ count: string }>(
      `SELECT COUNT(*) as count FROM leads ${where}`,
      params
    ),
  ])

  return {
    rows: dataResult.rows,
    total: parseInt(countResult.rows[0]?.count ?? "0", 10),
  }
}

export async function getLeadById(id: number): Promise<Lead | null> {
  const result = await query<Lead>(
    `SELECT * FROM leads WHERE id = $1`,
    [id]
  )
  return result.rows[0] ?? null
}

export async function getUltimoContacto(
  telefono: string
): Promise<UltimoContacto | null> {
  if (!telefono) return null
  const result = await query<UltimoContacto>(
    `SELECT telefono, idmensaje, fecha, procesado, mensaje
     FROM "ultimoContacto"
     WHERE telefono = $1
     ORDER BY fecha DESC
     LIMIT 1`,
    [telefono]
  )
  return result.rows[0] ?? null
}

export async function getLeadFilterOptions(): Promise<{
  etapas: string[]
  estados: string[]
  fuentes: string[]
}> {
  const [etapas, estados, fuentes] = await Promise.all([
    query<{ etapa_ciclo_vida: string }>(
      `SELECT DISTINCT etapa_ciclo_vida FROM leads WHERE etapa_ciclo_vida IS NOT NULL ORDER BY 1`
    ),
    query<{ estado: string }>(
      `SELECT DISTINCT estado FROM leads WHERE estado IS NOT NULL ORDER BY 1`
    ),
    query<{ fuente: string }>(
      `SELECT DISTINCT fuente FROM leads WHERE fuente IS NOT NULL ORDER BY 1`
    ),
  ])
  return {
    etapas: etapas.rows.map((r) => r.etapa_ciclo_vida),
    estados: estados.rows.map((r) => r.estado),
    fuentes: fuentes.rows.map((r) => r.fuente),
  }
}
