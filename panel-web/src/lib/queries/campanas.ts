import { query } from "@/lib/db"
import type { Campana, CampanaFormData } from "@/types/campana"
import type { LeadSummary } from "@/types/lead"

export async function getCampanas(filters: {
  activa?: boolean
  q?: string
} = {}): Promise<Campana[]> {
  const conditions: string[] = []
  const params: unknown[] = []
  let idx = 1

  if (filters.activa !== undefined) {
    conditions.push(`c.activa = $${idx}`)
    params.push(filters.activa)
    idx++
  }
  if (filters.q) {
    conditions.push(`(c.nombre_campana ILIKE $${idx} OR c.source_id ILIKE $${idx})`)
    params.push(`%${filters.q}%`)
    idx++
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

  const result = await query<Campana & { leads_count: string }>(
    `SELECT c.*,
            COUNT(l.id) as leads_count
     FROM campanas c
     LEFT JOIN leads l ON l.fuente = c.source_id
     ${where}
     GROUP BY c.id
     ORDER BY c.fecha_creacion DESC`,
    params
  )

  return result.rows.map((r) => ({
    ...r,
    leads_count: parseInt(r.leads_count as unknown as string, 10),
  }))
}

export async function getCampanaById(
  id: number
): Promise<(Campana & { leads: LeadSummary[] }) | null> {
  const [campanaResult, leadsResult] = await Promise.all([
    query<Campana>(
      `SELECT c.*, COUNT(l.id) as leads_count
       FROM campanas c
       LEFT JOIN leads l ON l.fuente = c.source_id
       WHERE c.id = $1
       GROUP BY c.id`,
      [id]
    ),
    query<LeadSummary>(
      `SELECT l.id, l.nombre, l.telefono, l.email, l.ciudad,
              l.tipoventa, l.modelo_interes, l.etapa_ciclo_vida, l.estado,
              l.fuente, l.fecha_creacion
       FROM leads l
       JOIN campanas c ON l.fuente = c.source_id
       WHERE c.id = $1
       ORDER BY l.fecha_creacion DESC`,
      [id]
    ),
  ])

  if (!campanaResult.rows[0]) return null
  const campana = campanaResult.rows[0]
  return {
    ...campana,
    leads_count: parseInt(campana.leads_count as unknown as string, 10),
    leads: leadsResult.rows,
  }
}

export async function createCampana(data: CampanaFormData): Promise<Campana> {
  const result = await query<Campana>(
    `INSERT INTO campanas
       (tipo, source_id, nombre_campana, modelo, tipo_venta, plan_interes, activa, notas)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      data.tipo,
      data.source_id,
      data.nombre_campana,
      data.modelo || null,
      data.tipo_venta || null,
      data.plan_interes || null,
      data.activa,
      data.notas || null,
    ]
  )
  return result.rows[0]
}

export async function updateCampana(
  id: number,
  data: Partial<CampanaFormData>
): Promise<Campana | null> {
  const fields: string[] = []
  const params: unknown[] = []
  let idx = 1

  const allowed: (keyof CampanaFormData)[] = [
    "tipo", "source_id", "nombre_campana", "modelo",
    "tipo_venta", "plan_interes", "activa", "notas",
  ]

  for (const key of allowed) {
    if (key in data) {
      fields.push(`${key} = $${idx}`)
      params.push(data[key] ?? null)
      idx++
    }
  }

  if (fields.length === 0) return null
  fields.push(`fecha_actualizacion = NOW()`)
  params.push(id)

  const result = await query<Campana>(
    `UPDATE campanas SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
    params
  )
  return result.rows[0] ?? null
}

export async function toggleCampanaActiva(
  id: number,
  activa: boolean
): Promise<void> {
  await query(
    `UPDATE campanas SET activa = $1, fecha_actualizacion = NOW() WHERE id = $2`,
    [activa, id]
  )
}

export async function deleteCampana(id: number): Promise<{ ok: boolean; error?: string }> {
  // Verificar que no tenga leads asociados
  const check = await query<{ count: string }>(
    `SELECT COUNT(l.id) as count FROM campanas c
     LEFT JOIN leads l ON l.fuente = c.source_id
     WHERE c.id = $1`,
    [id]
  )
  const count = parseInt(check.rows[0]?.count ?? "0", 10)
  if (count > 0) {
    return { ok: false, error: `No se puede eliminar: tiene ${count} leads asociados` }
  }

  await query(`DELETE FROM campanas WHERE id = $1`, [id])
  return { ok: true }
}
