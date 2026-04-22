import { query } from "@/lib/db"

export interface TipoVentaStat {
  tipoventa: string
  count: number
}

export interface ModeloStat {
  modelo_interes: string
  count: number
}

export interface WeeklyStat {
  week: string
  count: number
}

export interface EtapaStat {
  etapa_ciclo_vida: string
  count: number
}

export interface DashboardKpis {
  total: number
  calificados_hoy: number
  pendientes: number
  tasa_calificacion: number
}

export async function getDashboardStats() {
  const [kpis, tipoVenta, topModelos, semanal, etapas] = await Promise.all([
    getDashboardKpis(),
    getLeadsByTipoVenta(),
    getTopModelos(),
    getLeadsSemanal(),
    getLeadsByEtapa(),
  ])
  return { kpis, tipoVenta, topModelos, semanal, etapas }
}

async function getDashboardKpis(): Promise<DashboardKpis> {
  const result = await query<{
    total: string
    calificados_hoy: string
    pendientes: string
  }>(`
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (
        WHERE estado = 'calificado'
        AND fecha_creacion >= CURRENT_DATE
      ) AS calificados_hoy,
      COUNT(*) FILTER (WHERE estado = 'calificando') AS pendientes
    FROM leads
  `)
  const row = result.rows[0]
  const total = parseInt(row.total, 10)
  const calificados_hoy = parseInt(row.calificados_hoy, 10)
  const pendientes = parseInt(row.pendientes, 10)
  const tasa_calificacion =
    total > 0
      ? Math.round(
          (parseInt(
            (
              await query<{ c: string }>(
                `SELECT COUNT(*) as c FROM leads WHERE estado = 'calificado'`
              )
            ).rows[0].c,
            10
          ) /
            total) *
            100
        )
      : 0

  return { total, calificados_hoy, pendientes, tasa_calificacion }
}

export async function getLeadsByTipoVenta(): Promise<TipoVentaStat[]> {
  const result = await query<{ tipoventa: string; count: string }>(`
    SELECT
      COALESCE(tipoventa, 'INDEFINIDO') as tipoventa,
      COUNT(*) as count
    FROM leads
    GROUP BY tipoventa
    ORDER BY count DESC
  `)
  return result.rows.map((r) => ({ tipoventa: r.tipoventa, count: parseInt(r.count, 10) }))
}

export async function getTopModelos(limit = 10): Promise<ModeloStat[]> {
  const result = await query<{ modelo_interes: string; count: string }>(
    `SELECT
      COALESCE(modelo_interes, 'Sin especificar') as modelo_interes,
      COUNT(*) as count
     FROM leads
     WHERE modelo_interes IS NOT NULL
     GROUP BY modelo_interes
     ORDER BY count DESC
     LIMIT $1`,
    [limit]
  )
  return result.rows.map((r) => ({
    modelo_interes: r.modelo_interes,
    count: parseInt(r.count, 10),
  }))
}

export async function getLeadsSemanal(weeks = 12): Promise<WeeklyStat[]> {
  const result = await query<{ week: string; count: string }>(
    `SELECT
      TO_CHAR(DATE_TRUNC('week', fecha_creacion), 'DD/MM') as week,
      COUNT(*) as count
     FROM leads
     WHERE fecha_creacion >= NOW() - ($1 || ' weeks')::interval
     GROUP BY DATE_TRUNC('week', fecha_creacion)
     ORDER BY DATE_TRUNC('week', fecha_creacion)`,
    [weeks]
  )
  return result.rows.map((r) => ({ week: r.week, count: parseInt(r.count, 10) }))
}

export async function getLeadsByEtapa(): Promise<EtapaStat[]> {
  const result = await query<{ etapa_ciclo_vida: string; count: string }>(`
    SELECT
      COALESCE(etapa_ciclo_vida, 'Sin etapa') as etapa_ciclo_vida,
      COUNT(*) as count
    FROM leads
    GROUP BY etapa_ciclo_vida
    ORDER BY count DESC
  `)
  return result.rows.map((r) => ({
    etapa_ciclo_vida: r.etapa_ciclo_vida,
    count: parseInt(r.count, 10),
  }))
}
